/**
 * Product Compositing Service
 *
 * Handles compositing the real Shopify product image into generated scenes.
 *
 * Since Sharp is not available in Cloudflare Workers, we use a CSS overlay
 * approach where both images are stored separately and the frontend handles
 * the visual compositing.
 *
 * Future enhancement: Use Cloudflare Image Resizing or external service
 * for true server-side compositing.
 */

interface Env {
  R2: R2Bucket;
}

export interface CompositingResult {
  success: boolean;
  sceneImageUrl: string | null;
  productImageUrl: string | null;
  compositedImageUrl: string | null;
  compositingMethod: 'css_overlay' | 'server_composite';
  error?: string;
}

/**
 * Process images for compositing.
 *
 * Current implementation (CSS overlay):
 * 1. Download scene image from fal.ai
 * 2. Upload scene image to R2 for permanence
 * 3. Store both URLs for frontend compositing
 *
 * The frontend will overlay the product image on the scene using CSS.
 */
export async function compositeProductIntoScene(
  sceneImageUrl: string,
  productImageUrl: string,
  storeId: string,
  adId: string,
  env: Env
): Promise<CompositingResult> {
  try {
    // Download scene image from fal.ai (temporary URL)
    const sceneResponse = await fetch(sceneImageUrl);
    if (!sceneResponse.ok) {
      throw new Error(`Failed to download scene image: ${sceneResponse.status}`);
    }

    const sceneBlob = await sceneResponse.arrayBuffer();
    const contentType = sceneResponse.headers.get('content-type') || 'image/jpeg';

    // Upload scene to R2 for permanent storage
    const sceneKey = `ads/${storeId}/${adId}/scene.jpg`;
    await env.R2.put(sceneKey, sceneBlob, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`[COMPOSITING] Stored scene image: ${sceneKey}`);

    // For CSS overlay approach, we return both URLs
    // The frontend will handle the visual compositing
    return {
      success: true,
      sceneImageUrl: `/api/ads/image?key=${encodeURIComponent(sceneKey)}`,
      productImageUrl, // Keep original Shopify URL
      compositedImageUrl: null, // No server-side compositing yet
      compositingMethod: 'css_overlay',
    };
  } catch (error: any) {
    console.error('[COMPOSITING] Error:', error);
    return {
      success: false,
      sceneImageUrl: null,
      productImageUrl,
      compositedImageUrl: null,
      compositingMethod: 'css_overlay',
      error: error.message || 'Compositing failed',
    };
  }
}

/**
 * Download and store product image to R2 (if needed for processing).
 */
export async function storeProductImage(
  productImageUrl: string,
  storeId: string,
  adId: string,
  env: Env
): Promise<string | null> {
  try {
    const response = await fetch(productImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download product image: ${response.status}`);
    }

    const blob = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const key = `ads/${storeId}/${adId}/product.jpg`;
    await env.R2.put(key, blob, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`[COMPOSITING] Stored product image: ${key}`);
    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (error: any) {
    console.error('[COMPOSITING] Failed to store product image:', error);
    return null;
  }
}

/**
 * Generate CSS for frontend compositing.
 * Returns inline styles for overlaying product on scene.
 */
export function getCompositingStyles(): {
  container: Record<string, string>;
  scene: Record<string, string>;
  product: Record<string, string>;
} {
  return {
    container: {
      position: 'relative',
      width: '100%',
      aspectRatio: '1/1',
      overflow: 'hidden',
      borderRadius: '8px',
    },
    scene: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    product: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '55%',
      height: 'auto',
      objectFit: 'contain',
      // Add subtle shadow for depth
      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
    },
  };
}

/**
 * Check if true server-side compositing is available.
 * Returns false in standard Cloudflare Workers (no Sharp).
 */
export function isServerCompositeAvailable(): boolean {
  // Sharp is not available in Cloudflare Workers
  // Cloudflare Image Resizing requires specific subscription
  return false;
}
