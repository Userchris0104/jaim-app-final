/// <reference types="@cloudflare/workers-types" />

/**
 * Modular Compositing Pipeline - Shared Types
 *
 * PROVIDER RULES (referenced throughout codebase):
 *
 * // NANO_BANANA_ONLY: Primary scene generator
 * // Uses aspect_ratio not image_size
 * // Natural language prompts only
 * // fal-ai/nano-banana-2
 *
 * // ZERO_HALLUCINATION: Product image always from Shopify.
 * // AI generates SCENE only. Empty center zone is explicit in every prompt.
 *
 * // CLAUDE_COPY: All copy and Brand DNA via Claude Sonnet 4.6.
 * // Raw HTTP fetch only. No Anthropic SDK — Cloudflare Workers.
 *
 * // GPT_VISION_ONLY: OpenAI GPT-4o-mini used ONLY for product image to JSON analysis.
 * // detail: low, strict JSON schema mode.
 *
 * // BRIA_RMBG: Background removal only. fal-ai/bria/background/remove
 * // Cache result — never remove same image twice.
 *
 * // PHOTOROOM_FITTING: Optional but important. Graceful fallback if key missing.
 * // This is what makes ads look professional.
 *
 * // FASHN_REMOVED: FASHN is NOT used in this pipeline.
 * // It is a virtual try-on tool not ad generation.
 *
 * // FLUX_FALLBACK: FLUX is emergency fallback only if Nano Banana 2 fails after 2 retries.
 *
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads.
 * // Before that always 3 variants, no exceptions.
 *
 * // PARALLEL: Image gen and copy gen always run in parallel via Promise.allSettled.
 */

// ===========================================
// ENVIRONMENT
// ===========================================

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ANTHROPIC_API_KEY: string;
  FAL_API_KEY: string;
  OPENAI_API_KEY: string;
  PHOTOROOM_API_KEY?: string;  // Optional - graceful fallback if missing
  R2_PUBLIC_URL?: string;
  GEMINI_API_KEY?: string;     // Emergency fallback only
}

// ===========================================
// GENERATION PHASE
// ===========================================

export type GenerationPhase = 'LEARNING' | 'OPTIMISING' | 'EXPLOITING';

export interface PhaseDetectionResult {
  phase: GenerationPhase;
  storeAgeDays: number;
  publishedAdsCount: number;
  variantsToGenerate: number;
  useWinningFormula: boolean;
  isChallenger: boolean;
  confidence: 'low' | 'medium' | 'high';
  rationale: string;
}

// ===========================================
// BRAND DNA
// ===========================================

export interface BrandDNA {
  brand_name: string;
  analysed_at: string;  // ISO timestamp
  version: number;

  identity: {
    core_vibe: CoreVibe;
    primary_palette: string[];  // hex colors
    accent_palette: string[];   // hex colors
    brand_voice: BrandVoice;
  };

  visual_language: {
    lighting_profile: {
      type: LightingType;
      direction: LightingDirection;
      temperature: 'warm' | 'cool' | 'neutral';
    };
    composition_style: CompositionStyle;
    background_preference: BackgroundPreference;
    depth_of_field: 'deep' | 'shallow-bokeh' | 'medium';
  };

  store_category: StoreCategory;

  model_direction: {
    use_models: boolean;
    gender_default: Gender;
    age_range: AgeRange;
    style_archetype: string;  // max 2 sentences
    expression: ModelExpression;
    setting_preference: string;  // 1 sentence
  };

  scene_templates: {
    variant_a_clean: SceneTemplate;
    variant_b_lifestyle: SceneTemplate;
    variant_c_editorial: SceneTemplate;
  };

  copy_framework: {
    variant_a_angle: string;
    variant_b_angle: string;
    variant_c_angle: string;
    banned_words: string[];
    power_words: string[];
  };

  performance_memory: {
    best_variant_historically: AdVariant | null;
    best_lighting_historically: string | null;
    best_copy_angle_historically: string | null;
    last_updated: string | null;
  };
}

export type CoreVibe =
  | 'minimalist'
  | 'luxury'
  | 'energetic'
  | 'earthy'
  | 'playful'
  | 'clinical'
  | 'editorial'
  | 'streetwear'
  | 'premium'
  | 'authentic';

export type BrandVoice =
  | 'luxury'
  | 'casual'
  | 'urgent'
  | 'inspirational'
  | 'educational'
  | 'humorous'
  | 'authoritative';

export type LightingType =
  | 'high-key-studio'
  | 'golden-hour'
  | 'soft-natural'
  | 'dramatic-spotlight'
  | 'neon-ambient'
  | 'overcast-outdoor'
  | 'warm-interior';

export type LightingDirection =
  | 'front'
  | 'side'
  | 'backlit'
  | 'overhead'
  | 'ambient';

export type CompositionStyle =
  | 'centered-hero'
  | 'rule-of-thirds'
  | 'flat-lay'
  | 'editorial-crop'
  | 'environmental'
  | 'macro-detail';

export type BackgroundPreference =
  | 'clean-minimal'
  | 'lifestyle-contextual'
  | 'dramatic-dark'
  | 'bright-airy'
  | 'textured-surface'
  | 'outdoor-natural';

export type StoreCategory =
  | 'FASHION'
  | 'HOME'
  | 'BEAUTY'
  | 'FOOD'
  | 'TECH'
  | 'JEWELRY'
  | 'PETS'
  | 'SPORTS'
  | 'KIDS'
  | 'GENERAL';

export type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL' | 'MIXED';

export type AgeRange = '18-25' | '25-35' | '35-50' | '50+' | 'mixed';

export type ModelExpression =
  | 'confident'
  | 'candid'
  | 'aspirational'
  | 'approachable'
  | 'intense'
  | 'joyful';

export interface SceneTemplate {
  direction: 'minimal' | 'contextual' | 'bold';
  nano_banana_prompt: string;
  photoroom_config: {
    shadow_mode: 'ai-soft' | 'ai-hard' | 'none';
    lighting_mode: 'ai-auto' | 'dramatic' | 'natural';
    background_blur: number;  // 0-100
  };
}

// ===========================================
// PRODUCT STYLE PROFILE
// ===========================================

export interface ProductStyleProfile {
  product_id: string;
  analysed_at: string;  // ISO timestamp

  visual: {
    background_type: ProductBackgroundType;
    lighting: string;
    composition: ProductComposition;
    color_tone: ProductColorTone;
    product_angle: ProductAngle;
  };

  classification: {
    is_wearable: boolean;
    requires_model: boolean;
    gender: Gender;
    category_override: string | null;
  };

  compositing_hints: {
    remove_background_first: boolean;
    dominant_colors: string[];  // hex colors
    shadow_complexity: 'simple' | 'complex' | 'transparent';
    suggested_scene_style: string;  // 1 sentence
  };
}

export type ProductBackgroundType =
  | 'white-studio'
  | 'gradient'
  | 'lifestyle'
  | 'outdoor'
  | 'textured'
  | 'transparent';

export type ProductComposition =
  | 'centered'
  | 'flat-lay'
  | 'angled'
  | 'hanging'
  | 'on-model'
  | 'in-use';

export type ProductColorTone =
  | 'warm'
  | 'cool'
  | 'neutral'
  | 'vibrant'
  | 'muted'
  | 'monochrome';

export type ProductAngle =
  | 'front'
  | 'side'
  | 'three-quarter'
  | 'overhead'
  | 'detail-macro';

// ===========================================
// AD VARIANTS
// ===========================================

export type AdVariant = 'A' | 'B' | 'C';

export interface VariantConfig {
  variant: AdVariant;
  direction: 'minimal' | 'contextual' | 'bold';
  copyAngle: string;
  scenePrompt: string;
  photoroomConfig: {
    shadow_mode: string;
    lighting_mode: string;
    background_blur: number;
  };
}

// ===========================================
// GENERATION RESULTS
// ===========================================

export interface SceneGenerationResult {
  success: boolean;
  sceneUrl: string | null;
  provider: 'nano-banana-2' | 'flux-fallback';
  prompt: string;
  error?: string;
}

export interface BackgroundRemovalResult {
  success: boolean;
  cleanImageUrl: string | null;
  cached: boolean;
  error?: string;
}

export interface ProductFittingResult {
  success: boolean;
  compositedImageUrl: string | null;
  provider: 'photoroom' | 'fallback-overlay';
  error?: string;
}

export interface CopyGenerationResult {
  success: boolean;
  variants: {
    variant: AdVariant;
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
  }[];
  error?: string;
}

export interface AdGenerationResult {
  variant: AdVariant;
  success: boolean;

  // Images
  sceneImageUrl: string | null;
  productImageUrl: string | null;
  cleanProductImageUrl: string | null;
  compositedImageUrl: string | null;

  // Copy
  headline: string;
  primaryText: string;
  description: string;
  cta: string;

  // Metadata
  compositingMethod: CompositingMethod;
  aiRationale: string;
  isChallenger: boolean;
  generationPhase: GenerationPhase;
  confidenceLevel: 'low' | 'medium' | 'high';
  brandDnaVersion: number;

  error?: string;
}

export type CompositingMethod =
  | 'photoroom_fitted'
  | 'scene_overlay'
  | 'shopify_only';

// ===========================================
// DATABASE RECORDS
// ===========================================

export interface StoreRecord {
  id: string;
  shop_domain: string;
  store_name: string | null;
  store_email: string | null;
  currency: string;
  connected_at: string;
  brand_dna: string | null;
  brand_dna_version: number;
  store_category: string | null;
  generation_phase: string | null;
  performance_insights: string | null;
  insights_updated_at: string | null;
}

export interface ProductRecord {
  id: string;
  store_id: string;
  shopify_id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string | null;
  image_url: string | null;
  images: string | null;  // JSON array
  price_min: number | null;
  price_max: number | null;
  product_style_profile: string | null;
  product_style_analysed_at: string | null;
  clean_image_url: string | null;
}

export interface GeneratedAdRecord {
  id: string;
  store_id: string;
  product_id: string;
  status: string;
  headline: string | null;
  primary_text: string | null;
  description: string | null;
  call_to_action: string | null;
  image_url: string | null;
  scene_image_url: string | null;
  product_image_url: string | null;
  composited_image_url: string | null;
  compositing_method: string | null;
  platform: string;
  format: string;
  ab_variant: string | null;
  ab_group: string | null;
  ai_rationale: string | null;
  is_challenger: number;
  generation_phase: string | null;
  confidence_level: string | null;
  brand_dna_version: number | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// API PAYLOADS
// ===========================================

export interface GenerateAdRequest {
  productId: string;
  forceRegenerate?: boolean;
  variantOverride?: AdVariant;  // For testing specific variants
}

export interface GenerateAdResponse {
  success: boolean;
  message: string;
  abGroup: string;
  phase: GenerationPhase;
  variants: {
    id: string;
    variant: AdVariant;
    productId: string;
    headline: string;
    primaryText: string;
    description: string;
    callToAction: string;
    imageUrl: string | null;
    sceneImageUrl: string | null;
    productImageUrl: string | null;
    compositedImageUrl: string | null;
    compositingMethod: string;
    aiRationale: string;
    isChallenger: boolean;
    confidenceLevel: string;
  }[];
  error?: string;
}
