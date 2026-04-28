-- Seed data for Categories
INSERT INTO public.categories (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Technology', 'Tech news'),
('22222222-2222-2222-2222-222222222222', 'Business', 'Business news')
ON CONFLICT (id) DO NOTHING;

-- Seed data for Sources
INSERT INTO public.sources (id, name, url) VALUES
('33333333-3333-3333-3333-333333333333', 'TechInsider', 'https://techinsider.com'),
('44444444-4444-4444-4444-444444444444', 'Financial Times', 'https://ft.com')
ON CONFLICT (id) DO NOTHING;

-- Seed data for Articles
INSERT INTO public.articles (id, title, url, summary, author, source_id, category_id, image_url, published_at) VALUES
(
  '55555555-5555-5555-5555-555555555555', 
  'Global Tech Summit Unveils Next-Gen AI Innovations', 
  'https://techinsider.com/ai-innovations', 
  'The annual Global Tech Summit concluded today with groundbreaking announcements from industry leaders...',
  'Jane Doe',
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
  CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
  '66666666-6666-6666-6666-666666666666', 
  'Market Rallies as Inflation Shows Signs of Cooling', 
  'https://ft.com/market-rally', 
  'Investors reacted positively today as new inflation data suggests a cooling economy...',
  'John Smith',
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200',
  CURRENT_TIMESTAMP - INTERVAL '4 hours'
)
ON CONFLICT (id) DO NOTHING;
