-- Daily store analytics - aggregated daily performance
CREATE TABLE IF NOT EXISTS analytics_daily (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD

  -- Spend & Revenue
  spend REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  profit REAL DEFAULT 0,
  roas REAL DEFAULT 0,

  -- Engagement
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0, -- Click-through rate

  -- Conversions
  conversions INTEGER DEFAULT 0,
  cpa REAL DEFAULT 0, -- Cost per acquisition

  -- Orders (from Shopify)
  orders INTEGER DEFAULT 0,
  average_order_value REAL DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, date)
);

-- Platform daily analytics - performance by platform
CREATE TABLE IF NOT EXISTS analytics_platform_daily (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- tiktok, instagram, facebook
  date TEXT NOT NULL,

  -- Spend & Revenue
  spend REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,

  -- Engagement
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,

  -- Conversions
  conversions INTEGER DEFAULT 0,
  cpa REAL DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, platform, date)
);

-- Ad performance - per-ad metrics
CREATE TABLE IF NOT EXISTS ad_performance (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  published_ad_id TEXT, -- Reference to published_ads
  date TEXT NOT NULL,

  -- Spend & Revenue
  spend REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,

  -- Engagement
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,

  -- Conversions
  conversions INTEGER DEFAULT 0,
  cpa REAL DEFAULT 0,

  -- Video metrics (for video ads)
  video_views INTEGER DEFAULT 0,
  video_watch_time INTEGER DEFAULT 0, -- seconds
  video_completion_rate REAL DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (ad_id) REFERENCES generated_ads(id) ON DELETE CASCADE,
  UNIQUE(ad_id, date)
);

-- Campaign performance - per-campaign metrics
CREATE TABLE IF NOT EXISTS campaign_performance (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  date TEXT NOT NULL,

  -- Spend & Revenue
  spend REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,

  -- Engagement
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0,

  -- Conversions
  conversions INTEGER DEFAULT 0,
  cpa REAL DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, date)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_daily_store_date ON analytics_daily(store_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_platform_daily_store ON analytics_platform_daily(store_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_performance_ad_date ON ad_performance(ad_id, date);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_date ON campaign_performance(campaign_id, date);
