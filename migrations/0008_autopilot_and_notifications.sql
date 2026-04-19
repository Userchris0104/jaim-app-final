-- Autopilot settings - AI-driven automation configuration
CREATE TABLE IF NOT EXISTS autopilot_settings (
  id TEXT PRIMARY KEY,
  store_id TEXT UNIQUE NOT NULL,

  -- Master toggle
  enabled INTEGER DEFAULT 0,

  -- Budget controls
  daily_budget_limit REAL,
  monthly_budget_limit REAL,
  min_roas_threshold REAL DEFAULT 2.0,

  -- Automation settings
  auto_pause_underperforming INTEGER DEFAULT 1,
  auto_scale_winners INTEGER DEFAULT 1,
  auto_create_ads INTEGER DEFAULT 0,
  auto_publish_ads INTEGER DEFAULT 0,

  -- Thresholds
  pause_after_days INTEGER DEFAULT 3, -- Days before pausing underperforming
  min_spend_before_pause REAL DEFAULT 50, -- Minimum spend before evaluating
  scale_roas_threshold REAL DEFAULT 4.0, -- ROAS to trigger scaling
  scale_increase_percent REAL DEFAULT 20, -- Budget increase percentage

  -- Schedule
  active_hours TEXT, -- JSON: { start: "06:00", end: "23:00" }
  active_days TEXT, -- JSON array: [1,2,3,4,5,6,7] (1=Monday)

  -- Platforms
  platforms TEXT, -- JSON array: ['tiktok', 'instagram', 'facebook']

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Autopilot actions log - tracks what autopilot has done
CREATE TABLE IF NOT EXISTS autopilot_actions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,

  -- Action details
  action_type TEXT NOT NULL, -- paused_ad, scaled_budget, created_ad, published_ad
  target_type TEXT, -- ad, campaign
  target_id TEXT,
  target_name TEXT,

  -- Context
  reason TEXT, -- Why the action was taken
  details TEXT, -- JSON with additional details
  platform TEXT,

  -- Result
  status TEXT DEFAULT 'completed', -- completed, failed, reverted
  error_message TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Notifications - user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  store_id TEXT,

  -- Content
  type TEXT NOT NULL, -- info, success, warning, error, action_required
  category TEXT, -- campaign, ad, budget, platform, system
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  action_label TEXT,

  -- State
  read INTEGER DEFAULT 0,
  dismissed INTEGER DEFAULT 0,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  read_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Budget alerts - configured budget thresholds
CREATE TABLE IF NOT EXISTS budget_alerts (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,

  -- Alert configuration
  alert_type TEXT NOT NULL, -- daily_limit, weekly_limit, monthly_limit, roas_drop
  threshold_value REAL NOT NULL,
  comparison TEXT DEFAULT 'gte', -- gte, lte, eq

  -- Notification settings
  notify_email INTEGER DEFAULT 1,
  notify_in_app INTEGER DEFAULT 1,

  -- State
  enabled INTEGER DEFAULT 1,
  last_triggered_at TEXT,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_store_id ON autopilot_actions(store_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_created_at ON autopilot_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_store_id ON budget_alerts(store_id);
