import os
import time
import logging
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

# ─── Logging Setup ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "3600"))

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_KEY is missing from environment variables.")

# Initialize Supabase Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Error initializing Supabase client: {e}")
    supabase = None

# ─── Helpers ──────────────────────────────────────────────────────────────────

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

def get_category_id(category_name):
    """Resolve a category name to its ID via exact match (not .ilike)."""
    if not category_name or not supabase:
        return None
    try:
        # FIX: Use .eq() instead of .ilike() — the PostgREST API
        # does not support .ilike() on the categories table reliably.
        cat_response = supabase.table('categories').select('id').eq('name', category_name).execute()
        if cat_response.data:
            return cat_response.data[0]['id']
        else:
            logger.warning(f"Category '{category_name}' not found in database.")
            return None
    except Exception as e:
        logger.error(f"Error resolving category '{category_name}': {e}")
        return None

def article_exists(url):
    """Check if an article with this URL already exists in the database."""
    if not url or not supabase:
        return False
    try:
        response = supabase.table('articles').select('id').eq('url', url).limit(1).execute()
        return bool(response.data)
    except Exception:
        return False

# ─── Main Ingestion ──────────────────────────────────────────────────────────

def fetch_and_store_articles():
    if not supabase:
        logger.error("Supabase client not initialized. Exiting.")
        return

    logger.info("Starting ingestion cycle...")
    
    # 1. Fetch active sources from Supabase
    try:
        response = supabase.table('sources').select('id, name, rss_url, category').eq('is_active', True).execute()
        sources = response.data
    except Exception as e:
        logger.error(f"Failed to fetch sources: {e}")
        return

    if not sources:
        logger.info("No active sources found.")
        return

    new_articles_count = 0
    skipped_count = 0

    # 2. Process each source
    for source in sources:
        source_id = source.get('id')
        source_name = source.get('name', 'Unknown')
        rss_url = source.get('rss_url')
        category_name = source.get('category')
        
        if not rss_url:
            continue
            
        logger.info(f"Fetching RSS feed for '{source_name}' at {rss_url}")
        
        try:
            feed = feedparser.parse(rss_url)
        except Exception as e:
            logger.error(f"Failed to parse RSS feed for '{source_name}': {e}")
            continue
        
        # Resolve category ID using helper (uses .eq() not .ilike())
        category_id = get_category_id(category_name)

        # 3. Parse entries and insert
        for entry in feed.entries:
            title = entry.get('title', '')
            url = entry.get('link', '')
            author = entry.get('author', '')
            published_at = parse_date(entry.get('published') or entry.get('updated'))
            
            # Deduplication check — skip if article already exists
            if url and article_exists(url):
                skipped_count += 1
                continue
            
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
                try:
                    blob = TextBlob(plain_text)
                    sentiment_score = blob.sentiment.polarity
                except Exception as e:
                    logger.warning(f"Sentiment analysis failed for '{title}': {e}")

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
                    logger.warning(f"Summarization failed for '{title}': {e}")
            
            # Fallback if sumy fails or returns empty
            if not ai_summary:
                ai_summary = plain_text[:500] + '...' if len(plain_text) > 500 else plain_text
            
            # Image extraction
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
                logger.debug(f"Inserted article: '{title}'")
            except Exception as e:
                logger.error(f"Error inserting article '{title}': {e}")
                
        # Update last_fetched_at for the source
        try:
            supabase.table('sources').update({'last_fetched_at': datetime.now(timezone.utc).isoformat()}).eq('id', source_id).execute()
        except Exception as e:
            logger.error(f"Failed to update last_fetched_at for source '{source_name}': {e}")

    logger.info(f"Ingestion cycle complete. Inserted {new_articles_count} new articles, skipped {skipped_count} duplicates.")

if __name__ == "__main__":
    logger.info("News Aggregator Ingestion Service Started")
    logger.info(f"Polling interval: {POLL_INTERVAL} seconds")
    
    # Continuous scheduling loop
    while True:
        try:
            fetch_and_store_articles()
        except Exception as e:
            logger.error(f"Unexpected error in ingestion cycle: {e}")
        logger.info(f"Sleeping for {POLL_INTERVAL} seconds...")
        time.sleep(POLL_INTERVAL)
