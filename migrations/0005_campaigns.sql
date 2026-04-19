-- Campaigns table - ad campaigns across platforms
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Status
  status TEXT DEFAULT 'draft', -- draft, pending, active, paused, ended

  -- Budget
  budget_type TEXT DEFAULT 'daily', -- daily, lifetime
  daily_budget REAL,
  lifetime_budget REAL,
  total_spent REAL DEFAULT 0,

  -- Schedule
  start_date TEXT,
  end_date TEXT,

  -- Targeting
  objective TEXT DEFAULT 'conversions', -- awareness, traffic, conversions, sales
  target_audience TEXT, -- JSON: age, gender, interests, locations

  -- Platform distribution
  platforms TEXT, -- JSON array: ['tiktok', 'instagram', 'facebook']

  -- Performance (cached for quick access)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  roas REAL DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Campaign ads junction table (ads belong to campaigns)
CREATE TABLE IF NOT EXISTS campaign_ads (
  campaign_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, ad_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (ad_id) REFERENCES generated_ads(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_store_id ON campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_campaign_id ON campaign_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_ads_ad_id ON campaign_ads(ad_id);
