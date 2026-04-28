import os
import time
import feedparser
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timezone
import dateutil.parser
from textblob import TextBlob
from sumy.parsers.html import HtmlParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "3600"))

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")

# Initialize Supabase Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {e}")
    supabase = None

def clean_html(html_content):
    """Remove HTML tags to extract plain text."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator=' ', strip=True)

def parse_date(date_string):
    """Parse string date to ISO 8601 string compatible with Postgres."""
    if not date_string:
        return datetime.now(timezone.utc).isoformat()
    try:
        parsed_date = dateutil.parser.parse(date_string)
        return parsed_date.isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

def fetch_and_store_articles():
    if not supabase:
        print("Supabase client not initialized. Exiting.")
        return

    print(f"[{datetime.now().isoformat()}] Starting ingestion cycle...")
    
    # 1. Fetch active sources from Supabase
    try:
        response = supabase.table('sources').select('id, name, rss_url, category').eq('is_active', True).execute()
        sources = response.data
    except Exception as e:
        print(f"Failed to fetch sources: {e}")
        return

    if not sources:
        print("No active sources found.")
        return

    new_articles_count = 0

    # 2. Process each source
    for source in sources:
        source_id = source.get('id')
        rss_url = source.get('rss_url')
        category_name = source.get('category')
        
        if not rss_url:
            continue
            
        print(f"Fetching RSS feed for {source.get('name')} at {rss_url}")
        feed = feedparser.parse(rss_url)
        
        # Resolve category ID if category name is provided
        category_id = None
        if category_name:
            try:
                cat_response = supabase.table('categories').select('id').ilike('name', category_name).execute()
                if cat_response.data:
                    category_id = cat_response.data[0]['id']
            except Exception as e:
                print(f"Error resolving category {category_name}: {e}")

        # 3. Parse entries and insert
        for entry in feed.entries:
            title = entry.get('title', '')
            url = entry.get('link', '')
            author = entry.get('author', '')
            published_at = parse_date(entry.get('published') or entry.get('updated'))
            
            # Use content if available, else fallback to summary/description
            content_html = ''
            if 'content' in entry and len(entry.content) > 0:
                content_html = entry.content[0].value
            elif 'summary' in entry:
                content_html = entry.summary
                
            plain_text = clean_html(content_html)
            
            # 1. Sentiment Analysis
            sentiment_score = 0.0
            if plain_text:
                blob = TextBlob(plain_text)
                sentiment_score = blob.sentiment.polarity

            # 2. AI Summarization
            ai_summary = ""
            if content_html:
                try:
                    parser = HtmlParser.from_string(content_html, url, Tokenizer("english"))
                    stemmer = Stemmer("english")
                    summarizer = LsaSummarizer(stemmer)
                    summarizer.stop_words = get_stop_words("english")
                    
                    sentences = summarizer(parser.document, 2)
                    ai_summary = " ".join(str(s) for s in sentences)
                except Exception as e:
                    print(f"Error summarizing {title}: {e}")
            
            # Fallback if sumy fails or returns empty
            if not ai_summary:
                ai_summary = plain_text[:500] + '...' if len(plain_text) > 500 else plain_text
            
            # Simple metadata extraction
            image_url = None
            if 'media_content' in entry and len(entry.media_content) > 0:
                image_url = entry.media_content[0].get('url')
            elif 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
                image_url = entry.media_thumbnail[0].get('url')

            article_data = {
                'title': title,
                'url': url,
                'summary': ai_summary,
                'content': content_html,
                'author': author,
                'source_id': source_id,
                'category_id': category_id,
                'published_at': published_at,
                'image_url': image_url,
                'sentiment_score': sentiment_score
            }

            try:
                # Attempt to insert, ignore conflicts based on unique URL
                supabase.table('articles').upsert(article_data, on_conflict='url').execute()
                new_articles_count += 1
            except Exception as e:
                # Log error and continue
                print(f"Error inserting article '{title}': {e}")
                
        # Update last_fetched_at for the source
        try:
            supabase.table('sources').update({'last_fetched_at': datetime.now(timezone.utc).isoformat()}).eq('id', source_id).execute()
        except Exception as e:
            print(f"Failed to update last_fetched_at for source {source_id}: {e}")

    print(f"[{datetime.now().isoformat()}] Ingestion cycle complete. Processed {new_articles_count} articles.")

if __name__ == "__main__":
    print("News Aggregator Ingestion Service Started")
    print(f"Polling interval: {POLL_INTERVAL} seconds")
    
    # Continuous scheduling loop
    while True:
        fetch_and_store_articles()
        print(f"Sleeping for {POLL_INTERVAL} seconds...")
        time.sleep(POLL_INTERVAL)
