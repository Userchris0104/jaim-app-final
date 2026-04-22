/**
 * Scene Generation - Nano Banana 2 Edit + Text-to-Image
 *
 * Uses two approaches based on variant type:
 *
 * 1. EDIT ENDPOINT (fal-ai/nano-banana-2/edit):
 *    For product-focused variants where the product is composited
 *    into the scene by AI. Provides image_urls with clean product image.
 *
 * 2. TEXT-TO-IMAGE (fal-ai/nano-banana-2):
 *    For lifestyle/model scenes where product will be CSS overlaid.
 *    Generates scene with empty center zone for product placement.
 *
 * // ALWAYS_UNIQUE: Every generation uses random seed + variation pools
 * // BRAND_DNA_WINS: Brand identity overrides category defaults
 */

import type {
  Env,
  SceneGenerationResult,
  BrandDNA,
  ProductStyleProfile,
  AdVariant,
  StoreCategory
} from './types';

import {
  getVariantType,
  getVariationPools,
  selectVariation,
  buildCategoryPrompt,
  generateUniqueSeed,
  generatePromptHash,
  requiresTextToImage,
  type VariantType,
  type VariationSelection
} from './promptVariation';

// ===========================================
// CONSTANTS
// ===========================================

const FAL_API_URL = 'https://fal.run';
const NANO_BANANA_EDIT_ENDPOINT = 'fal-ai/nano-banana-2/edit';
const NANO_BANANA_TEXT_ENDPOINT = 'fal-ai/nano-banana-2';
const FLUX_FALLBACK_ENDPOINT = 'fal-ai/flux/dev';
const MAX_RETRIES = 2;

// Empty center zone instruction for text-to-image scenes
const CENTER_ZONE_INSTRUCTION = `Leave a clearly empty rectangular space in the center of the frame approximately 60% of the composition. Do not generate any product, object, or physical item in that center zone. Generate only the background environment.`;

// ===========================================
// EXTENDED RESULT TYPE
// ===========================================

export interface ExtendedSceneResult extends SceneGenerationResult {
  variantType: VariantType;
  variation: VariationSelection;
  seed: number;
  promptHash: string;
  usedEditEndpoint: boolean;
}

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Generate a scene for a variant using the appropriate endpoint.
 *
 * @param variant - A, B, or C
 * @param brandDna - Store's brand identity
 * @param productStyle - Product visual analysis
 * @param cleanProductImageUrl - Background-removed product image
 * @param storeId - For R2 storage path
 * @param env - Environment with API keys
 */
export async function generateScene(
  variant: AdVariant,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  cleanProductImageUrl: string | null,
  storeId: string,
  env: Env
): Promise<ExtendedSceneResult> {
  const category = brandDna.store_category as StoreCategory;
  const variantType = getVariantType(category, variant);

  // Select random variations from category pools
  const pools = getVariationPools(category);
  const variation = selectVariation(pools);

  // Generate unique seed
  const seed = generateUniqueSeed();

  // Generate prompt hash for duplicate detection
  const promptHash = generatePromptHash(
    category,
    variantType,
    variation.surface,
    variation.prop,
    variation.lighting,
    variation.atmosphere,
    brandDna.version
  );

  // Build the category prompt with variations and brand override
  const productStyleHint = productStyle?.compositing_hints.suggested_scene_style;
  let prompt = buildCategoryPrompt(
    variantType,
    variation,
    brandDna,
    productStyleHint
  );

  // Determine which endpoint to use
  const useTextToImage = requiresTextToImage(variantType) || !cleanProductImageUrl;

  console.log('[SCENE_GEN] Generating:', {
    variant,
    variantType,
    category,
    atmosphere: variation.atmosphere,
    useTextToImage,
    seed
  });

  let result: { success: boolean; sceneUrl: string | null; error?: string };

  if (useTextToImage) {
    // Add center zone instruction for text-to-image
    prompt = `${prompt} ${CENTER_ZONE_INSTRUCTION}`;
    result = await generateWithNanoBananaText(prompt, seed, env);
  } else {
    // Use edit endpoint with product image
    result = await generateWithNanoBananaEdit(
      prompt,
      cleanProductImageUrl!,
      seed,
      env
    );
  }

  // Retry logic
  if (!result.success) {
    console.warn('[SCENE_GEN] First attempt failed, retrying...');
    const retrySeed = generateUniqueSeed();

    if (useTextToImage) {
      result = await generateWithNanoBananaText(prompt, retrySeed, env);
    } else {
      result = await generateWithNanoBananaEdit(prompt, cleanProductImageUrl!, retrySeed, env);
    }
  }

  // Fallback to FLUX if still failing
  if (!result.success) {
    console.log('[SCENE_GEN] Falling back to FLUX');
    result = await generateWithFlux(prompt, env);
  }

  if (result.success && result.sceneUrl) {
    // Save to R2 for permanent storage
    const r2Url = await saveSceneToR2(result.sceneUrl, storeId, variant, env);

    return {
      success: true,
      sceneUrl: r2Url,
      provider: 'nano-banana-2',
      prompt,
      variantType,
      variation,
      seed,
      promptHash,
      usedEditEndpoint: !useTextToImage
    };
  }

  return {
    success: false,
    sceneUrl: null,
    provider: 'nano-banana-2',
    prompt,
    error: result.error || 'All generation attempts failed',
    variantType,
    variation,
    seed,
    promptHash,
    usedEditEndpoint: !useTextToImage
  };
}

// ===========================================
// NANO BANANA 2 EDIT ENDPOINT
// ===========================================

/**
 * Generate scene with product using Nano Banana 2 Edit endpoint.
 * The AI composites the product into the generated scene.
 */
async function generateWithNanoBananaEdit(
  prompt: string,
  productImageUrl: string,
  seed: number,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; error?: string }> {
  if (!env.FAL_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No FAL API key' };
  }

  try {
    const response = await fetch(`${FAL_API_URL}/${NANO_BANANA_EDIT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        image_urls: [productImageUrl],
        aspect_ratio: '1:1',
        resolution: '1K',
        seed,
        safety_tolerance: '4'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NANO_BANANA_EDIT] API error:', response.status, errorText);
      return {
        success: false,
        sceneUrl: null,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json() as {
      images?: Array<{ url: string }>;
      image?: { url: string };
    };

    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[NANO_BANANA_EDIT] Generated successfully');
    return { success: true, sceneUrl: imageUrl };
  } catch (error: any) {
    console.error('[NANO_BANANA_EDIT] Error:', error);
    return {
      success: false,
      sceneUrl: null,
      error: error.message || 'Generation failed'
    };
  }
}

// ===========================================
// NANO BANANA 2 TEXT-TO-IMAGE
// ===========================================

/**
 * Generate scene using text-to-image (for lifestyle/model scenes).
 * Product will be CSS overlaid onto the result.
 */
async function generateWithNanoBananaText(
  prompt: string,
  seed: number,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; error?: string }> {
  if (!env.FAL_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No FAL API key' };
  }

  try {
    const response = await fetch(`${FAL_API_URL}/${NANO_BANANA_TEXT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '1:1',
        resolution: '1K',
        seed,
        limit_generations: true,
        safety_tolerance: '4'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NANO_BANANA_TEXT] API error:', response.status, errorText);
      return {
        success: false,
        sceneUrl: null,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json() as {
      images?: Array<{ url: string }>;
      image?: { url: string };
    };

    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[NANO_BANANA_TEXT] Generated successfully');
    return { success: true, sceneUrl: imageUrl };
  } catch (error: any) {
    console.error('[NANO_BANANA_TEXT] Error:', error);
    return {
      success: false,
      sceneUrl: null,
      error: error.message || 'Generation failed'
    };
  }
}

// ===========================================
// FLUX FALLBACK
// ===========================================

/**
 * Fallback scene generation with FLUX.
 * Only used when Nano Banana 2 fails.
 */
async function generateWithFlux(
  prompt: string,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; error?: string }> {
  if (!env.FAL_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No FAL API key' };
  }

  try {
    const response = await fetch(`${FAL_API_URL}/${FLUX_FALLBACK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square',
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FLUX_FALLBACK] API error:', response.status, errorText);
      return {
        success: false,
        sceneUrl: null,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json() as {
      images?: Array<{ url: string }>;
    };

    if (!data.images?.[0]?.url) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[FLUX_FALLBACK] Generated successfully');
    return { success: true, sceneUrl: data.images[0].url };
  } catch (error: any) {
    console.error('[FLUX_FALLBACK] Error:', error);
    return {
      success: false,
      sceneUrl: null,
      error: error.message || 'Generation failed'
    };
  }
}

// ===========================================
// R2 STORAGE
// ===========================================

/**
 * Save scene image to R2 for permanent storage.
 */
async function saveSceneToR2(
  imageUrl: string,
  storeId: string,
  variant: AdVariant,
  env: Env
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('[SCENE_GEN] Failed to download scene:', response.status);
      return imageUrl;
    }

    const buffer = await response.arrayBuffer();
    const timestamp = Date.now();
    const key = `scenes/${storeId}/${timestamp}-variant-${variant}.jpg`;

    await env.R2.put(key, buffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    console.log('[SCENE_GEN] Saved to R2:', key);

    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('[SCENE_GEN] R2 save failed:', error);
    return imageUrl;
  }
}

// ===========================================
// BATCH GENERATION
// ===========================================

/**
 * Generate scenes for multiple variants in parallel.
 */
export async function generateScenesParallel(
  variants: AdVariant[],
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  cleanProductImageUrl: string | null,
  storeId: string,
  env: Env
): Promise<Map<AdVariant, ExtendedSceneResult>> {
  console.log(`[SCENE_GEN] Generating ${variants.length} scenes in parallel...`);

  const results = await Promise.allSettled(
    variants.map(variant =>
      generateScene(variant, brandDna, productStyle, cleanProductImageUrl, storeId, env)
        .then(result => ({ variant, result }))
    )
  );

  const sceneMap = new Map<AdVariant, ExtendedSceneResult>();

  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled') {
      const { variant, result } = settledResult.value;
      sceneMap.set(variant, result);
    } else {
      console.error('[SCENE_GEN] Scene generation failed:', settledResult.reason);
    }
  }

  console.log(`[SCENE_GEN] Generated ${sceneMap.size}/${variants.length} scenes`);
  return sceneMap;
}
