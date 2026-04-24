-- ===========================================
-- TEMPLATE PERFORMANCE TRACKING
-- ===========================================

-- Tracks performance of each template per store
-- Used for smart template selection (Phase 2 & 3)
CREATE TABLE IF NOT EXISTS template_performance (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  template_id TEXT NOT NULL,  -- e.g., 'T01_EDITORIAL_HERO' or hybrid ID

  -- Usage metrics
  times_used INTEGER DEFAULT 0,
  times_approved INTEGER DEFAULT 0,  -- Merchant approved for publishing
  times_published INTEGER DEFAULT 0,

  -- Performance metrics (from Meta API)
  total_spend REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,

  -- Calculated metrics
  avg_roas REAL,                -- total_revenue / total_spend
  avg_ctr REAL,                 -- total_clicks / total_impressions
  approval_rate REAL,           -- times_approved / times_used

  -- Trend tracking
  last_5_roas TEXT,             -- JSON array of last 5 ROAS values
  roas_trend TEXT,              -- 'improving', 'stable', 'declining'

  -- Timestamps
  first_used_at TEXT,
  last_used_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE(store_id, template_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_template_perf_store ON template_performance(store_id);
CREATE INDEX IF NOT EXISTS idx_template_perf_roas ON template_performance(store_id, avg_roas DESC);

-- ===========================================
-- GENERATED (HYBRID) TEMPLATES
-- ===========================================

-- Stores AI-generated hybrid templates created when performance declines
CREATE TABLE IF NOT EXISTS generated_templates (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  name TEXT DEFAULT 'Custom Template',

  -- Source templates that inspired this hybrid
  inspired_by TEXT,             -- JSON array: ['T01_EDITORIAL_HERO', 'T03_CLEAN_PRODUCT_HERO']

  -- The generated prompt
  prompt_text TEXT NOT NULL,

  -- Template metadata (same structure as fixed templates)
  has_model INTEGER DEFAULT 0,
  has_text_overlay INTEGER DEFAULT 1,
  placement TEXT DEFAULT 'feed_4x5',

  -- Performance tracking
  times_used INTEGER DEFAULT 0,
  avg_roas REAL,
  is_active INTEGER DEFAULT 1,  -- Set to 0 when retired

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  retired_at TEXT,

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Index for active hybrids per store
CREATE INDEX IF NOT EXISTS idx_gen_templates_store ON generated_templates(store_id, is_active);

-- ===========================================
-- ADD TEMPLATE TRACKING TO GENERATED_ADS
-- ===========================================

-- Track which ad used which template for performance correlation
-- (template_id column already added in 0012, this adds performance link)
ALTER TABLE generated_ads ADD COLUMN template_perf_id TEXT REFERENCES template_performance(id);
