-- Generated ads table - stores AI-generated ad creatives
CREATE TABLE IF NOT EXISTS generated_ads (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT DEFAULT 'generating', -- generating, ready, approved, rejected, published

  -- Ad creative content
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  call_to_action TEXT,

  -- Generated image
  image_url TEXT,
  image_prompt TEXT,

  -- Platform and format
  platform TEXT DEFAULT 'meta_feed', -- meta_feed, meta_stories, tiktok, instagram_reels
  format TEXT DEFAULT 'square', -- square, portrait, story

  -- Creative strategy used
  creative_strategy TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_ads_store_id ON generated_ads(store_id);
CREATE INDEX IF NOT EXISTS idx_generated_ads_product_id ON generated_ads(product_id);
CREATE INDEX IF NOT EXISTS idx_generated_ads_status ON generated_ads(status);
