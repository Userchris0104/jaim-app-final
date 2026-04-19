-- Platform connections - OAuth tokens for ad platforms
CREATE TABLE IF NOT EXISTS platform_connections (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- tiktok, meta, google

  -- OAuth credentials (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TEXT,

  -- Platform-specific IDs
  account_id TEXT, -- Ad account ID
  account_name TEXT,
  business_id TEXT, -- For Meta Business Manager

  -- Status
  status TEXT DEFAULT 'active', -- active, expired, revoked, error
  last_error TEXT,

  -- Permissions/scopes
  scopes TEXT, -- JSON array of granted scopes

  -- Metadata
  connected_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_synced_at TEXT,

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, platform)
);

-- Platform ad accounts (a connection can have multiple ad accounts)
CREATE TABLE IF NOT EXISTS platform_ad_accounts (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL,
  platform_account_id TEXT NOT NULL, -- ID from the platform
  name TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT,
  status TEXT DEFAULT 'active',
  is_primary INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (connection_id) REFERENCES platform_connections(id) ON DELETE CASCADE,
  UNIQUE(connection_id, platform_account_id)
);

-- Published ads - tracks ads pushed to platforms
CREATE TABLE IF NOT EXISTS published_ads (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL, -- Reference to generated_ads
  campaign_id TEXT,
  connection_id TEXT NOT NULL,
  ad_account_id TEXT,

  -- Platform-specific IDs
  platform TEXT NOT NULL,
  platform_ad_id TEXT, -- ID returned by the platform
  platform_adset_id TEXT,
  platform_campaign_id TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, paused, rejected, ended
  review_status TEXT, -- pending_review, approved, rejected
  rejection_reason TEXT,

  -- Metadata
  published_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (ad_id) REFERENCES generated_ads(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (connection_id) REFERENCES platform_connections(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_connections_store_id ON platform_connections(store_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_ad_accounts_connection_id ON platform_ad_accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_published_ads_ad_id ON published_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_published_ads_campaign_id ON published_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_published_ads_platform ON published_ads(platform);
