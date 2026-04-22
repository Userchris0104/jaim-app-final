/**
 * Scene Generation - Nano Banana 2
 *
 * // NANO_BANANA_ONLY: Primary scene generator
 * // Uses aspect_ratio not image_size
 * // Natural language prompts only
 * // fal-ai/nano-banana-2
 *
 * // ZERO_HALLUCINATION: Product image always from Shopify.
 * // AI generates SCENE only. Empty center zone is explicit in every prompt.
 *
 * // FLUX_FALLBACK: FLUX is emergency fallback only if Nano Banana 2 fails after 2 retries.
 *
 * Generates background scenes with explicit empty center zones.
 * Product is NEVER generated - only the environment around it.
 */

import type {
  Env,
  SceneGenerationResult,
  BrandDNA,
  ProductStyleProfile,
  AdVariant
} from './types';
import { getSceneTemplate } from './brandDna';

// ===========================================
// CONSTANTS
// ===========================================

const FAL_API_URL = 'https://fal.run';
const NANO_BANANA_ENDPOINT = 'fal-ai/nano-banana-2';
const FLUX_FALLBACK_ENDPOINT = 'fal-ai/flux/dev';
const MAX_RETRIES = 2;

// Empty center zone instruction that MUST be in every prompt
const CENTER_ZONE_INSTRUCTION = `Leave a clearly empty rectangular space in the center of the frame approximately 60% of the composition. Do not generate any product, object, or physical item in that center zone. Generate only the background environment.`;

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Generate a scene background using Nano Banana 2.
 * The scene will have an empty center zone for product placement.
 */
export async function generateScene(
  variant: AdVariant,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  storeId: string,
  env: Env
): Promise<SceneGenerationResult> {
  // Get scene template from Brand DNA
  const template = getSceneTemplate(brandDna, variant);

  // Build the final prompt
  const prompt = buildScenePrompt(template.prompt, productStyle, brandDna);

  console.log('[SCENE_GEN] Generating scene for variant', variant);
  console.log('[SCENE_GEN] Prompt:', prompt.slice(0, 150) + '...');

  // Try Nano Banana 2 with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await generateWithNanoBanana(prompt, env);

    if (result.success && result.sceneUrl) {
      // Save to R2 for permanent storage
      const r2Url = await saveSceneToR2(result.sceneUrl, storeId, variant, env);

      return {
        success: true,
        sceneUrl: r2Url,
        provider: 'nano-banana-2',
        prompt
      };
    }

    console.warn(`[SCENE_GEN] Nano Banana attempt ${attempt} failed:`, result.error);

    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000));  // Wait 1s before retry
    }
  }

  // Fallback to FLUX
  console.log('[SCENE_GEN] Falling back to FLUX');
  const fluxResult = await generateWithFlux(prompt, env);

  if (fluxResult.success && fluxResult.sceneUrl) {
    const r2Url = await saveSceneToR2(fluxResult.sceneUrl, storeId, variant, env);

    return {
      success: true,
      sceneUrl: r2Url,
      provider: 'flux-fallback',
      prompt
    };
  }

  return {
    success: false,
    sceneUrl: null,
    provider: 'nano-banana-2',
    prompt,
    error: 'All scene generation attempts failed'
  };
}

// ===========================================
// NANO BANANA 2 GENERATION
// ===========================================

/**
 * Generate scene with Nano Banana 2.
 * Uses natural language prompts and aspect_ratio (not image_size).
 */
async function generateWithNanoBanana(
  prompt: string,
  env: Env
): Promise<{ success: boolean; sceneUrl: string | null; error?: string }> {
  if (!env.FAL_API_KEY) {
    return { success: false, sceneUrl: null, error: 'No FAL API key' };
  }

  try {
    const response = await fetch(`${FAL_API_URL}/${NANO_BANANA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: '1:1',  // CRITICAL: Use aspect_ratio not image_size
        resolution: '1K',
        limit_generations: true,
        safety_tolerance: '4'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NANO_BANANA] API error:', response.status, errorText);
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

    // Handle both array and single image response formats
    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      return {
        success: false,
        sceneUrl: null,
        error: 'No image in response'
      };
    }

    console.log('[NANO_BANANA] Generated successfully');
    return { success: true, sceneUrl: imageUrl };
  } catch (error: any) {
    console.error('[NANO_BANANA] Error:', error);
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

  // Add explicit negative prompt for FLUX
  const negativePrompt = [
    'product', 'item', 'object', 'merchandise', 'goods',
    'person', 'human', 'model', 'mannequin', 'face', 'hands',
    'text', 'watermark', 'logo', 'blurry', 'low quality'
  ].join(', ');

  try {
    const response = await fetch(`${FAL_API_URL}/${FLUX_FALLBACK_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        image_size: 'square',  // FLUX uses image_size
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
// PROMPT BUILDING
// ===========================================

/**
 * Build the final scene prompt with all context.
 * Ensures empty center zone instruction is always included.
 */
function buildScenePrompt(
  basePrompt: string,
  productStyle: ProductStyleProfile | null,
  brandDna: BrandDNA
): string {
  const parts: string[] = [];

  // Start with base prompt from Brand DNA
  parts.push(basePrompt);

  // Add product context if available
  if (productStyle) {
    const sceneHint = productStyle.compositing_hints.suggested_scene_style;
    if (sceneHint && !basePrompt.toLowerCase().includes(sceneHint.toLowerCase().slice(0, 20))) {
      parts.push(`Scene should complement: ${sceneHint}`);
    }

    // Add color harmony hint
    if (productStyle.compositing_hints.dominant_colors.length > 0) {
      const colors = productStyle.compositing_hints.dominant_colors.join(', ');
      parts.push(`Color palette that harmonizes with product colors: ${colors}`);
    }
  }

  // Ensure empty center zone instruction is present
  const prompt = parts.join('. ');
  if (!prompt.includes('empty') || !prompt.includes('center')) {
    return `${prompt}. ${CENTER_ZONE_INSTRUCTION}`;
  }

  return prompt;
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
      return imageUrl;  // Return original URL as fallback
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

    // Return the API URL for serving
    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('[SCENE_GEN] R2 save failed:', error);
    return imageUrl;  // Return original URL as fallback
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
  storeId: string,
  env: Env
): Promise<Map<AdVariant, SceneGenerationResult>> {
  console.log(`[SCENE_GEN] Generating ${variants.length} scenes in parallel...`);

  const results = await Promise.allSettled(
    variants.map(variant =>
      generateScene(variant, brandDna, productStyle, storeId, env)
        .then(result => ({ variant, result }))
    )
  );

  const sceneMap = new Map<AdVariant, SceneGenerationResult>();

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
