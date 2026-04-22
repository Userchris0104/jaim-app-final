-- Migration: Modular Compositing Pipeline
-- Adds support for Brand DNA, phase detection, Photoroom fitting, and AI rationale
-- This replaces the old hallucination-prone pipeline with verified compositing

-- ===========================================
-- STORES TABLE - Brand DNA and Phase Detection
-- ===========================================

-- Brand DNA: Comprehensive brand identity JSON (replaces simple brand_style_profile)
-- Generated once per store by Claude Sonnet, drives all creative decisions
ALTER TABLE stores ADD COLUMN brand_dna TEXT;

-- Brand DNA version: Incremented when Brand DNA is regenerated
-- Used to track which version of DNA was used for each ad
ALTER TABLE stores ADD COLUMN brand_dna_version INTEGER DEFAULT 0;

-- Performance insights: JSON with historical performance patterns
-- Used by AI to make data-driven creative decisions
ALTER TABLE stores ADD COLUMN performance_insights TEXT;

-- When performance insights were last calculated
ALTER TABLE stores ADD COLUMN insights_updated_at TEXT;

-- Current generation phase: LEARNING, OPTIMISING, or EXPLOITING
-- Determines how many variants to generate and strategy
ALTER TABLE stores ADD COLUMN generation_phase TEXT DEFAULT 'LEARNING';

-- ===========================================
-- PRODUCTS TABLE - Clean Images and Style Analysis
-- ===========================================

-- When the product style was last analyzed by GPT-4o-mini
ALTER TABLE products ADD COLUMN product_style_analysed_at TEXT;

-- Clean product image URL (background removed via Bria RMBG 2.0)
-- Cached in R2 to avoid re-processing the same image
ALTER TABLE products ADD COLUMN clean_image_url TEXT;

-- ===========================================
-- GENERATED_ADS TABLE - Compositing and Rationale
-- ===========================================

-- Final composited image URL (after Photoroom fitting)
-- This is the actual ad image shown to users
ALTER TABLE generated_ads ADD COLUMN composited_image_url TEXT;

-- AI rationale: Plain English explanation for the merchant
-- 2-4 sentences explaining why this ad was created this way
ALTER TABLE generated_ads ADD COLUMN ai_rationale TEXT;

-- Is this a challenger variant (testing new approach vs proven winner)?
ALTER TABLE generated_ads ADD COLUMN is_challenger INTEGER DEFAULT 0;

-- Generation phase at time of creation
ALTER TABLE generated_ads ADD COLUMN generation_phase TEXT;

-- Confidence level: low, medium, high
-- Based on amount of performance data available
ALTER TABLE generated_ads ADD COLUMN confidence_level TEXT DEFAULT 'low';

-- Which Brand DNA version was used to generate this ad
-- Helps track if ads need regeneration after DNA update
ALTER TABLE generated_ads ADD COLUMN brand_dna_version INTEGER;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Index for finding ads by generation phase
CREATE INDEX IF NOT EXISTS idx_generated_ads_generation_phase ON generated_ads(generation_phase);

-- Index for finding challenger ads
CREATE INDEX IF NOT EXISTS idx_generated_ads_is_challenger ON generated_ads(is_challenger);

-- Index for finding ads by Brand DNA version
CREATE INDEX IF NOT EXISTS idx_generated_ads_brand_dna_version ON generated_ads(brand_dna_version);

-- Index for products with clean images (for cache lookup)
CREATE INDEX IF NOT EXISTS idx_products_clean_image_url ON products(clean_image_url);

-- Index for stores by generation phase
CREATE INDEX IF NOT EXISTS idx_stores_generation_phase ON stores(generation_phase);
