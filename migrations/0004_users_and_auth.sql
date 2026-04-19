-- Users table - account management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,

  -- Authentication
  password_hash TEXT, -- for email/password auth
  email_verified INTEGER DEFAULT 0,

  -- Subscription
  plan TEXT DEFAULT 'free', -- free, starter, growth, pro
  plan_started_at TEXT,
  plan_expires_at TEXT,
  stripe_customer_id TEXT,

  -- Preferences
  timezone TEXT DEFAULT 'UTC',
  notifications_enabled INTEGER DEFAULT 1,

  -- Metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- Sessions table - for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link stores to users (many-to-many)
CREATE TABLE IF NOT EXISTS user_stores (
  user_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  role TEXT DEFAULT 'owner', -- owner, admin, viewer
  added_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, store_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store_id ON user_stores(store_id);
