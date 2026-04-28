INSERT INTO categories (name, description) VALUES ('Technology', 'Tech News') ON CONFLICT DO NOTHING;

INSERT INTO sources (name, url, rss_url, category, is_active) 
VALUES ('BBC Tech', 'https://bbc.com/news/technology', 'http://feeds.bbci.co.uk/news/technology/rss.xml', 'Technology', true);
