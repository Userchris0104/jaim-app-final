-- Publishing job queue - tracks ad publishing tasks
CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- tiktok, meta

  -- Job configuration
  ad_account_id TEXT,
  budget_type TEXT, -- daily, lifetime
  budget_amount REAL,
  targeting TEXT, -- JSON object
  campaign_name TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_id) REFERENCES generated_ads(id) ON DELETE CASCADE
);

-- Add store_id to published_ads for easier querying
ALTER TABLE published_ads ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE CASCADE;

-- Add platform column to ad_performance for filtering
ALTER TABLE ad_performance ADD COLUMN platform TEXT;

-- Update unique constraint on ad_performance to include published_ad_id
-- Note: SQLite doesn't support modifying constraints, so we create a new index
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_performance_published_ad_date ON ad_performance(published_ad_id, date);

-- Indexes for publish_jobs
CREATE INDEX IF NOT EXISTS idx_publish_jobs_store_id ON publish_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_ad_id ON publish_jobs(ad_id);

-- Index for published_ads store_id
CREATE INDEX IF NOT EXISTS idx_published_ads_store_id ON published_ads(store_id);
