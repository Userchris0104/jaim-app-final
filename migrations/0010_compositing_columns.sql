-- Migration: Add compositing columns for two-stage image generation
-- The two-stage pipeline generates scene backgrounds and composites real product images

-- Add columns to generated_ads for storing compositing data
ALTER TABLE generated_ads ADD COLUMN scene_image_url TEXT;
ALTER TABLE generated_ads ADD COLUMN product_image_url TEXT;
ALTER TABLE generated_ads ADD COLUMN compositing_method TEXT DEFAULT 'css_overlay';

-- scene_image_url: URL to the generated scene background (stored in R2)
-- product_image_url: URL to the original Shopify product image
-- compositing_method: 'css_overlay' (frontend) or 'server_composite' (future)
