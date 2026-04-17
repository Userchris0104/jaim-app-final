-- Stores table - holds Shopify store connections
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  store_name TEXT,
  store_email TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT,
  plan_name TEXT,
  connected_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Products table - synced from Shopify
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  shopify_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  product_type TEXT,
  handle TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT,
  image_url TEXT,
  images TEXT, -- JSON array of image URLs
  variants TEXT, -- JSON array of variants
  price_min REAL,
  price_max REAL,
  inventory_total INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  UNIQUE(store_id, shopify_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_stores_shop_domain ON stores(shop_domain);
