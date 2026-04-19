-- Migration: A/B Testing and Multi-Provider Image Generation
-- Adds support for A/B variant testing and enhanced image generation

-- Add A/B testing columns to generated_ads
ALTER TABLE generated_ads ADD COLUMN ab_variant TEXT;
ALTER TABLE generated_ads ADD COLUMN ab_group TEXT;

-- Add store_category to stores for provider routing
ALTER TABLE stores ADD COLUMN store_category TEXT;

-- Add product_style_profile to products for per-product styling
ALTER TABLE products ADD COLUMN product_style_profile TEXT;

-- Indexes for A/B testing queries
CREATE INDEX IF NOT EXISTS idx_generated_ads_ab_group ON generated_ads(ab_group);
CREATE INDEX IF NOT EXISTS idx_generated_ads_ab_variant ON generated_ads(ab_variant);

-- ab_variant: 'A', 'B', or 'C'
-- ab_group: productId + timestamp (links the 3 variants together)
-- store_category: 'fashion', 'beauty', 'home', 'tech', 'food', 'pets', 'jewelry', 'general'
-- product_style_profile: JSON with lighting, composition, background, colorTone, productMood, suggestedAdStyle, modelStyle
