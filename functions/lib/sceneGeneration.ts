/**
 * Scene Generation - Google Gemini API
 *
 * // PROVIDER_RULE: Google Gemini is the only image generation provider.
 * // fal.ai is never used for image generation.
 * // Fallback = real product image, not AI generation.
 * // A real product photo always beats a hallucination.
 *
 * Uses Gemini 3.1 Flash Image Preview for all scene generation.
 *
 * COST: $0.067/image (standard), $0.034/image (batch)
 *
 * Two modes based on variant type:
 *
 * 1. WITH PRODUCT IMAGE (Edit-style):
 *    For product-focused variants and model-wearing variants.
 *    Sends product image inline for AI to integrate into scene.
 *
 * 2. TEXT-TO-IMAGE:
 *    For pure lifestyle scenes where product will be CSS overlaid.
 *    Generates scene with empty center zone for product placement.
 *
 * FALLBACK CHAIN (no fal.ai):
 * 1. Gemini → 2. Clean product image → 3. Original Shopify image
 *
 * // ALWAYS_UNIQUE: Every generation uses random seed + variation pools
 * // BRAND_DNA_WINS: Brand identity overrides category defaults
 * // GEMINI_NATIVE: Uses gemini-3.1-flash-image-preview model
 */

import type {
  Env,
  SceneGenerationResult,
  BrandDNA,
  ProductStyleProfile,
  AdVariant,
  StoreCategory,
  ImageProvider
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

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const MAX_RETRIES = 2;

// Cost per image generation (for logging)
// Model: gemini-3.1-flash-image-preview
const COST_PER_IMAGE_STANDARD = 0.067;
const COST_PER_IMAGE_BATCH = 0.034;

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
  costUsd?: number;
  imageProvider: ImageProvider;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Convert image URL to base64 for Gemini API inline_data.
 * Uses btoa() for Cloudflare Workers compatibility (not Buffer.from).
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('[GEMINI] Failed to fetch image:', response.status, imageUrl.substring(0, 100));
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64 using btoa (Cloudflare Workers compatible)
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // Determine MIME type from response headers or URL
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();

    return { data: base64, mimeType };
  } catch (error: any) {
    console.error('[GEMINI] Error converting image to base64:', error.message);
    return null;
  }
}

/**
 * Extract image from Gemini API response.
 * Returns base64 data and mime type if found.
 */
function extractImageFromResponse(response: any): { data: string; mimeType: string } | null {
  try {
    const candidates = response?.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('[GEMINI] No candidates in response');
      return null;
    }

    const content = candidates[0]?.content;
    if (!content?.parts) {
      console.error('[GEMINI] No content parts in response');
      return null;
    }

    // Find the image part in the response
    for (const part of content.parts) {
      if (part.inlineData) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }

    console.error('[GEMINI] No image found in response parts');
    return null;
  } catch (error: any) {
    console.error('[GEMINI] Error extracting image:', error.message);
    return null;
  }
}

/**
 * Convert base64 image data to ArrayBuffer for R2 storage.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Generate a scene for a variant using Google Gemini API.
 *
 * FALLBACK CHAIN (no fal.ai):
 * 1. Gemini generation
 * 2. Clean product image (background-removed)
 * 3. Original Shopify product image
 *
 * @param variant - A, B, or C
 * @param brandDna - Store's brand identity
 * @param productStyle - Product visual analysis
 * @param cleanProductImageUrl - Background-removed product image
 * @param originalProductImageUrl - Original Shopify product image
 * @param storeId - For R2 storage path
 * @param env - Environment with API keys
 * @param useBatch - Use batch mode for lower cost (autopilot)
 */
export async function generateScene(
  variant: AdVariant,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  cleanProductImageUrl: string | null,
  originalProductImageUrl: string | null,
  storeId: string,
  env: Env,
  useBatch: boolean = false
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

  // Determine which mode to use
  const useTextToImage = requiresTextToImage(variantType) || !cleanProductImageUrl;

  // Log generation attempt with correct pricing
  console.log('[SCENE_GEN]', {
    model: 'gemini-3.1-flash-image-preview',
    mode: useBatch ? 'batch' : 'standard',
    estimatedCost: useBatch ? 0.034 : 0.067,
    variant,
    variantType,
    category,
    atmosphere: variation.atmosphere,
    useTextToImage,
    seed
  });

  let result: { success: boolean; sceneUrl: string | null; base64Data?: string; mimeType?: string; error?: string };

  if (useTextToImage) {
    // Add center zone instruction for text-to-image
    prompt = `${prompt} ${CENTER_ZONE_INSTRUCTION}`;
    result = await generateWithGeminiTextToImage(prompt, seed, env);
  } else {
    // Use with product image for AI integration
    result = await generateWithGeminiEdit(
      prompt,
      cleanProductImageUrl!,
      seed,
      env
    );
  }

  // Retry logic (one retry)
  if (!result.success) {
    console.warn('[SCENE_GEN] First attempt failed, retrying...');
    const retrySeed = generateUniqueSeed();

    if (useTextToImage) {
      result = await generateWithGeminiTextToImage(prompt, retrySeed, env);
    } else {
      result = await generateWithGeminiEdit(prompt, cleanProductImageUrl!, retrySeed, env);
    }
  }

  // SUCCESS: Gemini generated image
  if (result.success && (result.sceneUrl || result.base64Data)) {
    let r2Url: string;

    if (result.base64Data && result.mimeType) {
      r2Url = await saveBase64ToR2(result.base64Data, result.mimeType, storeId, variant, env);
    } else if (result.sceneUrl) {
      r2Url = await saveSceneToR2(result.sceneUrl, storeId, variant, env);
    } else {
      r2Url = result.sceneUrl || '';
    }

    const costUsd = useBatch ? COST_PER_IMAGE_BATCH : COST_PER_IMAGE_STANDARD;
    console.log('[SCENE_GEN] Gemini success', {
      model: 'gemini-3.1-flash-image-preview',
      mode: useBatch ? 'batch' : 'standard',
      cost: costUsd
    });

    return {
      success: true,
      sceneUrl: r2Url,
      provider: 'gemini',
      prompt,
      variantType,
      variation,
      seed,
      promptHash,
      usedEditEndpoint: !useTextToImage,
      costUsd,
      imageProvider: useBatch ? 'GEMINI_BATCH' : 'GEMINI_PRO'
    };
  }

  // FALLBACK 1: Use clean product image (background-removed)
  if (cleanProductImageUrl) {
    console.log('[SCENE_GEN] Gemini failed — using clean product image as fallback');
    return {
      success: true,
      sceneUrl: cleanProductImageUrl,
      provider: 'gemini',
      prompt,
      variantType,
      variation,
      seed,
      promptHash,
      usedEditEndpoint: false,
      costUsd: 0,
      imageProvider: 'PRODUCT_ONLY'
    };
  }

  // FALLBACK 2: Use original Shopify product image
  if (originalProductImageUrl) {
    console.log('[SCENE_GEN] Using original Shopify image');
    return {
      success: true,
      sceneUrl: originalProductImageUrl,
      provider: 'gemini',
      prompt,
      variantType,
      variation,
      seed,
      promptHash,
      usedEditEndpoint: false,
      costUsd: 0,
      imageProvider: 'SHOPIFY_ORIGINAL'
    };
  }

  // COMPLETE FAILURE: No images available at all
  return {
    success: false,
    sceneUrl: null,
    provider: 'gemini',
    prompt,
    error: result.error || 'All generation attempts failed and no fallback images available',
    variantType,
    variation,
    seed,
    promptHash,
    usedEditEndpoint: !useTextToImage,
    costUsd: 0,
    imageProvider: 'GEMINI_PRO'
  };
}

// ===========================================
// GEMINI EDIT (WITH PRODUCT IMAGE)
// ===========================================

/**
 * Generate scene with product using Gemini API.
 * Sends product image inline for AI to integrate into scene.
 */
async function generateWithGeminiEdit(
  prompt: string,
  productImageUrl: string,
  seed: number,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; base64Data?: string; mimeType?: string; error?: string }> {
  if (!env.GEMINI_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No GEMINI API key' };
  }

  // Convert product image to base64
  const imageData = await imageUrlToBase64(productImageUrl);
  if (!imageData) {
    console.error('[GEMINI_EDIT] Failed to convert product image to base64');
    return { success: false, sceneUrl: null, error: 'Failed to process product image' };
  }

  console.log('[GEMINI_EDIT] Request:', {
    model: GEMINI_IMAGE_MODEL,
    productImageMimeType: imageData.mimeType,
    promptPreview: prompt.substring(0, 200) + '...',
    seed
  });

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        seed
      }
    };

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GEMINI_EDIT] API error:', response.status, errorText);
      return {
        success: false,
        sceneUrl: null,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const imageResult = extractImageFromResponse(data);

    if (!imageResult) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[GEMINI_EDIT] Generated successfully');
    return {
      success: true,
      sceneUrl: null,
      base64Data: imageResult.data,
      mimeType: imageResult.mimeType
    };
  } catch (error: any) {
    console.error('[GEMINI_EDIT] Error:', error);
    return {
      success: false,
      sceneUrl: null,
      error: error.message || 'Generation failed'
    };
  }
}

// ===========================================
// GEMINI TEXT-TO-IMAGE
// ===========================================

/**
 * Generate scene using text-to-image (for lifestyle scenes).
 * Product will be CSS overlaid onto the result.
 */
async function generateWithGeminiTextToImage(
  prompt: string,
  seed: number,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; base64Data?: string; mimeType?: string; error?: string }> {
  if (!env.GEMINI_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No GEMINI API key' };
  }

  console.log('[GEMINI_TEXT] Request:', {
    model: GEMINI_IMAGE_MODEL,
    promptPreview: prompt.substring(0, 200) + '...',
    seed
  });

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        seed
      }
    };

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GEMINI_TEXT] API error:', response.status, errorText);
      return {
        success: false,
        sceneUrl: null,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    const imageResult = extractImageFromResponse(data);

    if (!imageResult) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[GEMINI_TEXT] Generated successfully');
    return {
      success: true,
      sceneUrl: null,
      base64Data: imageResult.data,
      mimeType: imageResult.mimeType
    };
  } catch (error: any) {
    console.error('[GEMINI_TEXT] Error:', error);
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
 * Save base64 image data directly to R2.
 */
async function saveBase64ToR2(
  base64Data: string,
  mimeType: string,
  storeId: string,
  variant: AdVariant,
  env: Env
): Promise<string> {
  try {
    const buffer = base64ToArrayBuffer(base64Data);
    const timestamp = Date.now();
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const key = `scenes/${storeId}/${timestamp}-variant-${variant}.${extension}`;

    await env.R2.put(key, buffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000'
      }
    });

    console.log('[SCENE_GEN] Saved to R2:', key);
    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('[SCENE_GEN] R2 save failed:', error);
    // Return data URL as fallback
    return `data:${mimeType};base64,${base64Data}`;
  }
}

/**
 * Save scene image from URL to R2 for permanent storage.
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
  originalProductImageUrl: string | null,
  storeId: string,
  env: Env,
  useBatch: boolean = false
): Promise<Map<AdVariant, ExtendedSceneResult>> {
  console.log('[SCENE_GEN]', {
    action: 'parallel_generation_start',
    model: 'gemini-3.1-flash-image-preview',
    mode: useBatch ? 'batch' : 'standard',
    estimatedCostPerImage: useBatch ? 0.034 : 0.067,
    variantCount: variants.length
  });

  const results = await Promise.allSettled(
    variants.map(variant =>
      generateScene(variant, brandDna, productStyle, cleanProductImageUrl, originalProductImageUrl, storeId, env, useBatch)
        .then(result => ({ variant, result }))
    )
  );

  const sceneMap = new Map<AdVariant, ExtendedSceneResult>();
  let totalCost = 0;

  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled') {
      const { variant, result } = settledResult.value;
      sceneMap.set(variant, result);
      if (result.costUsd) {
        totalCost += result.costUsd;
      }
    } else {
      console.error('[SCENE_GEN] Scene generation failed:', settledResult.reason);
    }
  }

  console.log('[SCENE_GEN]', {
    action: 'parallel_generation_complete',
    model: 'gemini-3.1-flash-image-preview',
    successCount: sceneMap.size,
    totalCount: variants.length,
    totalCost
  });

  return sceneMap;
}
