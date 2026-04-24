-- ===========================================
-- STORES TABLE - Brand Colors for Template System
-- ===========================================

-- Primary brand color (hex) extracted from Shopify theme
-- Used for backgrounds, large color areas in ad templates
ALTER TABLE stores ADD COLUMN primary_color TEXT;

-- Accent/secondary brand color (hex) extracted from Shopify theme
-- Used for CTAs, buttons, highlights in ad templates
ALTER TABLE stores ADD COLUMN accent_color TEXT;

-- When brand colors were last extracted from Shopify
ALTER TABLE stores ADD COLUMN brand_colors_updated_at TEXT;

-- ===========================================
-- GENERATED_ADS TABLE - Template Tracking
-- ===========================================

-- Template ID used for this ad (e.g., 'T01_EDITORIAL_HERO')
-- NULL means legacy category-based generation was used
ALTER TABLE generated_ads ADD COLUMN template_id TEXT;

-- Index for template-based queries
CREATE INDEX IF NOT EXISTS idx_generated_ads_template_id ON generated_ads(template_id);
