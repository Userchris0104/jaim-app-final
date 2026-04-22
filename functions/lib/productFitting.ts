/**
 * Product Fitting - Photoroom and Background Removal
 *
 * // BRIA_RMBG: Background removal only. fal-ai/bria/background/remove
 * // Cache result — never remove same image twice.
 *
 * // PHOTOROOM_FITTING: Optional but important. Graceful fallback if key missing.
 * // This is what makes ads look professional.
 *
 * Two-stage process:
 * 1. Remove background from product image (Bria RMBG 2.0)
 * 2. Fit clean product into scene (Photoroom API)
 *
 * Fallback: If Photoroom unavailable, use scene URL directly.
 */

import type {
  Env,
  BackgroundRemovalResult,
  ProductFittingResult,
  ProductRecord,
  AdVariant
} from './types';

// ===========================================
// CONSTANTS
// ===========================================

const BRIA_RMBG_ENDPOINT = 'fal-ai/bria/background/remove';
const FAL_API_URL = 'https://fal.run';
const PHOTOROOM_API_URL = 'https://image-api.photoroom.com/v2/edit';

// ===========================================
// BACKGROUND REMOVAL
// ===========================================

/**
 * Remove background from product image using Bria RMBG 2.0.
 * Results are cached in products.clean_image_url to avoid re-processing.
 */
export async function removeBackground(
  product: ProductRecord,
  env: Env
): Promise<BackgroundRemovalResult> {
  // Check cache first
  if (product.clean_image_url) {
    console.log('[RMBG] Using cached clean image for product:', product.id);
    return {
      success: true,
      cleanImageUrl: product.clean_image_url,
      cached: true
    };
  }

  // Get product image URL
  const imageUrl = getProductImageUrl(product);
  if (!imageUrl) {
    return {
      success: false,
      cleanImageUrl: null,
      cached: false,
      error: 'No product image available'
    };
  }

  // Call Bria RMBG
  const result = await removeBackgroundWithBria(imageUrl, env);

  if (result.success && result.cleanImageUrl) {
    // Save to R2 and cache in database
    const r2Url = await saveCleanImageToR2(
      result.cleanImageUrl,
      product.store_id,
      product.id,
      env
    );

    // Update database cache
    await cacheCleanImageUrl(product.id, r2Url, env);

    return {
      success: true,
      cleanImageUrl: r2Url,
      cached: false
    };
  }

  return result;
}

/**
 * Call Bria RMBG 2.0 API via fal.ai.
 */
async function removeBackgroundWithBria(
  imageUrl: string,
  env: Env
): Promise<BackgroundRemovalResult> {
  if (!env.FAL_API_KEY) {
    console.warn('[RMBG] No FAL API key');
    return {
      success: false,
      cleanImageUrl: null,
      cached: false,
      error: 'No FAL API key'
    };
  }

  try {
    console.log('[RMBG] Removing background from image...');

    const response = await fetch(`${FAL_API_URL}/${BRIA_RMBG_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RMBG] API error:', response.status, errorText);
      return {
        success: false,
        cleanImageUrl: null,
        cached: false,
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json() as {
      image?: { url: string };
      images?: Array<{ url: string }>;
    };

    const cleanUrl = data.image?.url || data.images?.[0]?.url;

    if (!cleanUrl) {
      return {
        success: false,
        cleanImageUrl: null,
        cached: false,
        error: 'No image in response'
      };
    }

    console.log('[RMBG] Background removed successfully');
    return {
      success: true,
      cleanImageUrl: cleanUrl,
      cached: false
    };
  } catch (error: any) {
    console.error('[RMBG] Error:', error);
    return {
      success: false,
      cleanImageUrl: null,
      cached: false,
      error: error.message || 'Background removal failed'
    };
  }
}

// ===========================================
// PRODUCT FITTING (PHOTOROOM)
// ===========================================

/**
 * Fit clean product into scene using Photoroom API.
 * Adds contact shadows and relighting for professional look.
 */
export async function fitProductIntoScene(
  cleanProductUrl: string,
  sceneUrl: string,
  photoroomConfig: {
    shadow_mode: string;
    lighting_mode: string;
    background_blur: number;
  },
  storeId: string,
  variant: AdVariant,
  env: Env
): Promise<ProductFittingResult> {
  // Check if Photoroom is available
  if (!env.PHOTOROOM_API_KEY) {
    console.warn('[PHOTOROOM] No API key - using scene URL directly as fallback');
    return {
      success: true,
      compositedImageUrl: sceneUrl,
      provider: 'fallback-overlay'
    };
  }

  try {
    console.log('[PHOTOROOM] Fitting product into scene...');

    // Download clean product image
    const productResponse = await fetch(cleanProductUrl);
    if (!productResponse.ok) {
      throw new Error(`Failed to download product image: ${productResponse.status}`);
    }
    const productBlob = await productResponse.blob();

    // Build form data for Photoroom API
    const formData = new FormData();
    formData.append('imageFile', productBlob, 'product.png');
    formData.append('background.imageUrl', sceneUrl);
    formData.append('shadow.mode', photoroomConfig.shadow_mode);
    formData.append('lighting.mode', photoroomConfig.lighting_mode);
    formData.append('outputSize', '1080x1080');
    formData.append('outputFormat', 'jpeg');
    formData.append('outputQuality', '95');

    if (photoroomConfig.background_blur > 0) {
      formData.append('background.blur', photoroomConfig.background_blur.toString());
    }

    const response = await fetch(PHOTOROOM_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': env.PHOTOROOM_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PHOTOROOM] API error:', response.status, errorText);

      // Graceful fallback
      console.log('[PHOTOROOM] Falling back to scene URL');
      return {
        success: true,
        compositedImageUrl: sceneUrl,
        provider: 'fallback-overlay'
      };
    }

    // Photoroom returns the image directly
    const imageBuffer = await response.arrayBuffer();

    // Save to R2
    const timestamp = Date.now();
    const key = `ads/${storeId}/composited-${timestamp}-${variant}.jpg`;

    await env.R2.put(key, imageBuffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    const r2Url = `/api/ads/image?key=${encodeURIComponent(key)}`;

    console.log('[PHOTOROOM] Composited successfully:', key);
    return {
      success: true,
      compositedImageUrl: r2Url,
      provider: 'photoroom'
    };
  } catch (error: any) {
    console.error('[PHOTOROOM] Error:', error);

    // Graceful fallback
    console.log('[PHOTOROOM] Falling back to scene URL');
    return {
      success: true,
      compositedImageUrl: sceneUrl,
      provider: 'fallback-overlay'
    };
  }
}

// ===========================================
// FULL COMPOSITING PIPELINE
// ===========================================

/**
 * Full compositing pipeline: remove background → fit into scene.
 */
export async function compositeProductIntoScene(
  product: ProductRecord,
  sceneUrl: string,
  photoroomConfig: {
    shadow_mode: string;
    lighting_mode: string;
    background_blur: number;
  },
  variant: AdVariant,
  env: Env
): Promise<ProductFittingResult> {
  // Step 1: Remove background
  const rmbgResult = await removeBackground(product, env);

  if (!rmbgResult.success || !rmbgResult.cleanImageUrl) {
    console.warn('[COMPOSITING] Background removal failed, using original image');

    // Try to use original image URL as fallback
    const originalUrl = getProductImageUrl(product);
    if (!originalUrl) {
      return {
        success: false,
        compositedImageUrl: null,
        provider: 'fallback-overlay',
        error: 'No product image available'
      };
    }

    // Fall back to scene URL (no product fitting)
    return {
      success: true,
      compositedImageUrl: sceneUrl,
      provider: 'fallback-overlay'
    };
  }

  // Step 2: Fit into scene
  return await fitProductIntoScene(
    rmbgResult.cleanImageUrl,
    sceneUrl,
    photoroomConfig,
    product.store_id,
    variant,
    env
  );
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
 * Save clean product image to R2.
 */
async function saveCleanImageToR2(
  imageUrl: string,
  storeId: string,
  productId: string,
  env: Env
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('[RMBG] Failed to download clean image:', response.status);
      return imageUrl;
    }

    const buffer = await response.arrayBuffer();
    const key = `products/${storeId}/${productId}/clean.png`;

    await env.R2.put(key, buffer, {
      httpMetadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000'
      }
    });

    console.log('[RMBG] Saved clean image to R2:', key);

    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('[RMBG] R2 save failed:', error);
    return imageUrl;
  }
}

/**
 * Cache clean image URL in database.
 */
async function cacheCleanImageUrl(
  productId: string,
  cleanUrl: string,
  env: Env
): Promise<void> {
  try {
    await env.DB.prepare(`
      UPDATE products
      SET clean_image_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(cleanUrl, productId).run();

    console.log('[RMBG] Cached clean image URL for product:', productId);
  } catch (error) {
    console.error('[RMBG] Failed to cache clean URL:', error);
  }
}

/**
 * Check if a product has a cached clean image.
 */
export function hasCleanImage(product: ProductRecord): boolean {
  return !!product.clean_image_url;
}

/**
 * Get clean image URL, fetching from cache or product record.
 */
export function getCleanImageUrl(product: ProductRecord): string | null {
  return product.clean_image_url || null;
}
