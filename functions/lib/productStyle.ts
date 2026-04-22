/**
 * Product Style Analysis
 *
 * // GPT_VISION_ONLY: OpenAI GPT-4o-mini used ONLY for product image to JSON analysis.
 * // detail: low, strict JSON schema mode.
 *
 * Analyzes product images to extract:
 * - Visual characteristics (background, lighting, composition)
 * - Classification (wearable, requires model, gender)
 * - Compositing hints (dominant colors, shadow complexity)
 *
 * Results are cached in products.product_style_profile to avoid re-analysis.
 */

import type {
  Env,
  ProductStyleProfile,
  ProductRecord,
  Gender
} from './types';
import { detectGender, isWearableProduct } from './adRules';

// ===========================================
// CONSTANTS
// ===========================================

const GPT_MODEL = 'gpt-4o-mini';
const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';

// ===========================================
// MAIN ANALYSIS FUNCTION
// ===========================================

/**
 * Analyze a product image and generate a style profile.
 * Uses GPT-4o-mini with vision for image analysis.
 *
 * @param product - Product record from database
 * @param env - Environment with API keys
 * @param forceReanalyze - Skip cache and re-analyze
 * @returns ProductStyleProfile or null if analysis fails
 */
export async function analyzeProductStyle(
  product: ProductRecord,
  env: Env,
  forceReanalyze = false
): Promise<ProductStyleProfile | null> {
  // Check cache first
  if (!forceReanalyze && product.product_style_profile) {
    try {
      return JSON.parse(product.product_style_profile) as ProductStyleProfile;
    } catch {
      console.warn('[PRODUCT_STYLE] Failed to parse cached profile, re-analyzing');
    }
  }

  // Get product image URL
  const imageUrl = getProductImageUrl(product);
  if (!imageUrl) {
    console.warn('[PRODUCT_STYLE] No image URL available for product:', product.id);
    return createFallbackProfile(product);
  }

  // Analyze with GPT-4o-mini
  try {
    const profile = await analyzeWithGPT(product, imageUrl, env);

    // Cache the result
    await cacheProductStyle(product.id, profile, env);

    return profile;
  } catch (error) {
    console.error('[PRODUCT_STYLE] Analysis failed:', error);
    return createFallbackProfile(product);
  }
}

/**
 * Analyze product image using GPT-4o-mini with vision.
 */
async function analyzeWithGPT(
  product: ProductRecord,
  imageUrl: string,
  env: Env
): Promise<ProductStyleProfile> {
  if (!env.OPENAI_API_KEY) {
    console.warn('[PRODUCT_STYLE] No OpenAI API key, using fallback');
    return createFallbackProfile(product);
  }

  const systemPrompt = `You are an expert visual merchandiser and e-commerce photography analyst.
Analyze the product image and return ONLY valid JSON matching this exact schema.
Do not include any text outside the JSON object.`;

  const userPrompt = `Analyze this product image for e-commerce ad generation.

Product context:
- Title: ${product.title}
- Type: ${product.product_type || 'Unknown'}
- Tags: ${product.tags || 'None'}

Return this exact JSON structure:
{
  "visual": {
    "background_type": "white-studio|gradient|lifestyle|outdoor|textured|transparent",
    "lighting": "description of lighting style in 5 words or less",
    "composition": "centered|flat-lay|angled|hanging|on-model|in-use",
    "color_tone": "warm|cool|neutral|vibrant|muted|monochrome",
    "product_angle": "front|side|three-quarter|overhead|detail-macro"
  },
  "classification": {
    "is_wearable": true/false,
    "requires_model": true/false,
    "gender": "MALE|FEMALE|NEUTRAL",
    "category_override": null or "specific category if obvious"
  },
  "compositing_hints": {
    "remove_background_first": true/false,
    "dominant_colors": ["#hex1", "#hex2"],
    "shadow_complexity": "simple|complex|transparent",
    "suggested_scene_style": "one sentence describing ideal scene"
  }
}`;

  const response = await fetch(GPT_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low'  // Low detail = cheaper and sufficient
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PRODUCT_STYLE] GPT API error:', response.status, errorText);
    throw new Error(`GPT API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in GPT response');
  }

  // Parse and validate the response
  const parsed = JSON.parse(content);

  // Build the full profile with product metadata
  const profile: ProductStyleProfile = {
    product_id: product.id,
    analysed_at: new Date().toISOString(),
    visual: {
      background_type: validateEnum(parsed.visual?.background_type, [
        'white-studio', 'gradient', 'lifestyle', 'outdoor', 'textured', 'transparent'
      ], 'white-studio'),
      lighting: parsed.visual?.lighting || 'studio lighting',
      composition: validateEnum(parsed.visual?.composition, [
        'centered', 'flat-lay', 'angled', 'hanging', 'on-model', 'in-use'
      ], 'centered'),
      color_tone: validateEnum(parsed.visual?.color_tone, [
        'warm', 'cool', 'neutral', 'vibrant', 'muted', 'monochrome'
      ], 'neutral'),
      product_angle: validateEnum(parsed.visual?.product_angle, [
        'front', 'side', 'three-quarter', 'overhead', 'detail-macro'
      ], 'front')
    },
    classification: {
      is_wearable: parsed.classification?.is_wearable ?? isWearableProduct(product),
      requires_model: parsed.classification?.requires_model ?? false,
      gender: validateEnum(parsed.classification?.gender, [
        'MALE', 'FEMALE', 'NEUTRAL'
      ], detectGender(product)) as Gender,
      category_override: parsed.classification?.category_override || null
    },
    compositing_hints: {
      remove_background_first: parsed.compositing_hints?.remove_background_first ?? true,
      dominant_colors: Array.isArray(parsed.compositing_hints?.dominant_colors)
        ? parsed.compositing_hints.dominant_colors.slice(0, 3)
        : ['#FFFFFF', '#000000'],
      shadow_complexity: validateEnum(parsed.compositing_hints?.shadow_complexity, [
        'simple', 'complex', 'transparent'
      ], 'simple'),
      suggested_scene_style: parsed.compositing_hints?.suggested_scene_style ||
        'Clean studio environment with soft lighting'
    }
  };

  console.log('[PRODUCT_STYLE] Analysis complete:', {
    productId: product.id,
    backgroundType: profile.visual.background_type,
    isWearable: profile.classification.is_wearable,
    gender: profile.classification.gender
  });

  return profile;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get the primary image URL from a product.
 */
function getProductImageUrl(product: ProductRecord): string | null {
  if (product.image_url) {
    return product.image_url;
  }

  if (product.images) {
    try {
      const images = JSON.parse(product.images);
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

/**
 * Validate a value against allowed enum values.
 */
function validateEnum<T extends string>(
  value: unknown,
  allowed: T[],
  defaultValue: T
): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  return defaultValue;
}

/**
 * Create a fallback profile when analysis fails.
 * Uses rule-based detection from adRules.
 */
function createFallbackProfile(product: ProductRecord): ProductStyleProfile {
  const isWearable = isWearableProduct(product);
  const gender = detectGender(product);

  return {
    product_id: product.id,
    analysed_at: new Date().toISOString(),
    visual: {
      background_type: 'white-studio',
      lighting: 'studio lighting',
      composition: 'centered',
      color_tone: 'neutral',
      product_angle: 'front'
    },
    classification: {
      is_wearable: isWearable,
      requires_model: isWearable && gender !== 'NEUTRAL',
      gender,
      category_override: null
    },
    compositing_hints: {
      remove_background_first: true,
      dominant_colors: ['#FFFFFF', '#000000'],
      shadow_complexity: 'simple',
      suggested_scene_style: 'Clean studio environment with soft lighting'
    }
  };
}

/**
 * Cache the product style profile in the database.
 */
async function cacheProductStyle(
  productId: string,
  profile: ProductStyleProfile,
  env: Env
): Promise<void> {
  try {
    await env.DB.prepare(`
      UPDATE products
      SET
        product_style_profile = ?,
        product_style_analysed_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(JSON.stringify(profile), productId).run();

    console.log('[PRODUCT_STYLE] Cached profile for product:', productId);
  } catch (error) {
    console.error('[PRODUCT_STYLE] Failed to cache profile:', error);
  }
}

/**
 * Batch analyze multiple products.
 * Does not block - runs analysis in background.
 */
export async function analyzeProductsBatch(
  products: ProductRecord[],
  env: Env
): Promise<void> {
  // Filter products that need analysis
  const needsAnalysis = products.filter(p =>
    !p.product_style_profile || !p.product_style_analysed_at
  );

  if (needsAnalysis.length === 0) {
    console.log('[PRODUCT_STYLE] All products already analyzed');
    return;
  }

  console.log(`[PRODUCT_STYLE] Analyzing ${needsAnalysis.length} products...`);

  // Analyze in parallel with concurrency limit
  const CONCURRENCY = 3;
  for (let i = 0; i < needsAnalysis.length; i += CONCURRENCY) {
    const batch = needsAnalysis.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(product => analyzeProductStyle(product, env))
    );
  }

  console.log('[PRODUCT_STYLE] Batch analysis complete');
}

/**
 * Get product style, analyzing if needed.
 * This is the main entry point for the pipeline.
 */
export async function getProductStyle(
  product: ProductRecord,
  env: Env
): Promise<ProductStyleProfile> {
  // Try to get cached profile
  if (product.product_style_profile) {
    try {
      return JSON.parse(product.product_style_profile) as ProductStyleProfile;
    } catch {
      // Invalid cache, re-analyze
    }
  }

  // Analyze now (non-blocking in pipeline context)
  const profile = await analyzeProductStyle(product, env);

  // If analysis failed, return fallback
  return profile || createFallbackProfile(product);
}
