/**
 * Image Generation Providers
 *
 * THREE GENERATION MODES based on product type and gender:
 *
 * MODE 1 - FASHN.ai: Model with wearable product (clothing/fashion)
 *          Used when product is wearable AND gender is MALE or FEMALE
 *
 * MODE 2 - Bria AI via fal.ai: Product into lifestyle scene
 *          Used for non-wearable products or NEUTRAL gender
 *
 * MODE 3 - FLUX via fal.ai: Background only + CSS overlay fallback
 *          Used when FASHN and Bria fail, or for UGC scroll-stopper format
 *
 * CRITICAL RULES:
 * - STYLE_PROFILES: Both brand_style_profile and product_style_profile must be
 *   passed to every provider. Never generate without them if available.
 * - ZERO_HALLUCINATION: Product image always comes from Shopify. AI generates scene only.
 *   FASHN and Bria handle compositing natively.
 * - NEUTRAL_NO_FASHN: NEUTRAL gender never calls FASHN. Routed to Bria instead.
 */

// ===========================================
// TYPES
// ===========================================

export type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export type StoreCategory =
  | 'fashion'
  | 'beauty'
  | 'home'
  | 'tech'
  | 'food'
  | 'pets'
  | 'jewelry'
  | 'general';

export interface BrandStyleProfile {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

export interface ProductStyleProfile {
  lighting: string;
  composition: string;
  background: string;
  colorTone: string;
  productMood: string;
  suggestedAdStyle: string;
  modelStyle?: string;  // For fashion products
}

export interface ImageGenerationResult {
  finalImageUrl: string | null;
  sceneImageUrl: string | null;
  productImageUrl: string | null;
  method: 'fashn_model' | 'bria_product_shot' | 'css_overlay' | 'shopify_only';
}

export interface SceneRules {
  environment: string;
  lighting: string;
  specialInstructions: string;
  negativePromptAdditions: string[];
}

interface Env {
  FASHNAI_API_KEY?: string;
  FAL_API_KEY?: string;
  R2: R2Bucket;
  R2_PUBLIC_URL?: string;
}

// ===========================================
// WEARABLE DETECTION
// ===========================================

const WEARABLE_KEYWORDS = [
  'clothing', 'apparel', 'shirt', 'jacket', 'pants', 'dress',
  'shoes', 'tops', 'bottoms', 'outerwear', 'fashion', 'jeans',
  'sweater', 'hoodie', 'coat', 'blouse', 'skirt', 'shorts',
  't-shirt', 'tee', 'blazer', 'cardigan', 'vest', 'suit',
  'jumpsuit', 'romper', 'leggings', 'trousers', 'polo', 'tank',
  'bodysuit', 'lingerie', 'swimwear', 'bikini', 'underwear',
  'activewear', 'sportswear', 'athleisure', 'loungewear'
];

export function isWearableProduct(
  productType: string | null,
  title?: string | null,
  tags?: string | null
): boolean {
  // Check all available fields
  const searchText = [productType, title, tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!searchText) return false;
  return WEARABLE_KEYWORDS.some(w => searchText.includes(w));
}

// ===========================================
// MODE 1: FASHN.ai (Model with product)
// ===========================================

/**
 * Generate image using FASHN.ai Product-to-Model
 * Used for wearable fashion products with MALE or FEMALE gender
 * Generates a model wearing the product directly from the product image
 */
export async function generateWithFashn(
  productImageUrl: string,
  gender: 'MALE' | 'FEMALE',
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null,
  env: Env
): Promise<string | null> {
  if (!env.FASHNAI_API_KEY) {
    console.warn('[FASHN] No API key configured');
    return null;
  }

  // Build prompt for the model appearance and setting
  const prompt = [
    `${gender === 'MALE' ? 'Male' : 'Female'} model`,
    `${brandStyle?.contentStyle || 'lifestyle'} photoshoot`,
    `${brandStyle?.mood || 'contemporary'} mood`,
    productStyle?.modelStyle || '',
    brandStyle?.visualTone || 'professional',
    'fashion editorial, high quality, well-lit'
  ].filter(Boolean).join(', ');

  console.log('[FASHN] Generating with prompt:', prompt);

  try {
    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.FASHNAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_name: 'product-to-model',
        inputs: {
          product_image: productImageUrl,
          prompt: prompt,
          aspect_ratio: '4:5',
          resolution: '1k',
          generation_mode: 'balanced',
          output_format: 'png',
          return_base64: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FASHN] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as { id: string; error?: string };

    if (data.error) {
      console.error('[FASHN] API returned error:', data.error);
      return null;
    }

    console.log('[FASHN] Job started:', data.id);

    return await pollFashnResult(data.id, env);
  } catch (error) {
    console.error('[FASHN] Generation error:', error);
    return null;
  }
}

/**
 * Poll FASHN.ai for job completion
 */
async function pollFashnResult(
  predictionId: string,
  env: Env,
  maxAttempts = 30
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    try {
      const response = await fetch(
        `https://api.fashn.ai/v1/status/${predictionId}`,
        {
          headers: {
            'Authorization': `Bearer ${env.FASHNAI_API_KEY}`
          }
        }
      );

      const data = await response.json() as {
        status: string;
        output?: string[];
        error?: string;
      };

      if (data.status === 'completed') {
        console.log('[FASHN] Job completed');
        return data.output?.[0] || null;
      }

      if (data.status === 'failed') {
        console.error('[FASHN] Job failed:', data.error);
        return null;
      }

      console.log('[FASHN] Polling attempt', i + 1, '- status:', data.status);
    } catch (error) {
      console.error('[FASHN] Polling error:', error);
    }
  }

  console.error('[FASHN] Polling timeout');
  return null;
}

// ===========================================
// MODE 2: Bria AI via fal.ai (Product shot)
// ===========================================

// Creative placement options for dynamic product positioning
export type ProductPlacement =
  | 'center_horizontal'
  | 'center_vertical'
  | 'upper_left'
  | 'upper_right'
  | 'bottom_left'
  | 'bottom_right'
  | 'right_center'
  | 'left_center'
  | 'upper_center'
  | 'bottom_center';

export interface BriaOptions {
  placement?: ProductPlacement;
  dynamicAngle?: boolean;  // Adds dynamic angle instructions to prompt
}

/**
 * Generate product shot using Bria AI via fal.ai
 * Creates engaging, dynamic product visuals with creative positioning
 */
export async function generateWithBria(
  productImageUrl: string,
  sceneDescription: string,
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null,
  env: Env,
  options?: BriaOptions
): Promise<string | null> {
  if (!env.FAL_API_KEY) {
    console.warn('[BRIA] No fal.ai API key configured');
    return null;
  }

  // Build engaging scene description
  const dynamicInstructions = options?.dynamicAngle
    ? 'Dynamic angle, product appears alive and engaging, professional commercial photography, '
    : '';

  const fullSceneDescription = [
    dynamicInstructions + sceneDescription,
    'High-end product photography',
    'Sharp focus on product details',
    brandStyle?.visualTone ? `${brandStyle.visualTone} aesthetic` : '',
    brandStyle?.mood ? `${brandStyle.mood} atmosphere` : '',
    brandStyle?.colors?.length ? `Color harmony with ${brandStyle.colors.map(c => c.label || c.hex).join(', ')}` : '',
    productStyle?.lighting ? `${productStyle.lighting} lighting` : 'Professional studio lighting',
    productStyle?.background ? `${productStyle.background} background` : '',
    'Editorial quality, magazine-worthy composition'
  ].filter(Boolean).join('. ');

  const placement = options?.placement || 'center_horizontal';

  console.log('[BRIA] Generating with placement:', placement);
  console.log('[BRIA] Scene:', fullSceneDescription.slice(0, 150) + '...');

  try {
    const response = await fetch('https://fal.run/fal-ai/bria/product-shot', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: productImageUrl,
        scene_description: fullSceneDescription,
        placement_type: 'manual_placement',
        manual_placement_selection: placement,
        num_results: 1,
        fast: false,
        optimize_description: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BRIA] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      images?: Array<{ url: string }>;
    };

    if (data.images?.[0]?.url) {
      console.log('[BRIA] Generated successfully');
      return data.images[0].url;
    }

    console.warn('[BRIA] No image in response');
    return null;
  } catch (error) {
    console.error('[BRIA] Generation error:', error);
    return null;
  }
}

// ===========================================
// MODE 3: FLUX via fal.ai (Background only)
// ===========================================

/**
 * Generate background using FLUX via fal.ai
 * Used as fallback when FASHN and Bria fail
 */
export async function generateFluxBackground(
  prompt: string,
  negativePromptAdditions: string[],
  env: Env
): Promise<string | null> {
  if (!env.FAL_API_KEY) {
    console.warn('[FLUX] No fal.ai API key configured');
    return null;
  }

  const baseNegatives = [
    'product', 'item', 'object', 'merchandise',
    'person', 'human', 'model', 'mannequin',
    'text', 'watermark', 'logo', 'blurry'
  ];

  const negativePrompt = [...baseNegatives, ...negativePromptAdditions].join(', ');

  console.log('[FLUX] Generating background...');

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        image_size: 'square',
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FLUX] API error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      images?: Array<{ url: string }>;
    };

    if (data.images?.[0]?.url) {
      console.log('[FLUX] Generated successfully');
      return data.images[0].url;
    }

    console.warn('[FLUX] No image in response');
    return null;
  } catch (error) {
    console.error('[FLUX] Generation error:', error);
    return null;
  }
}

// ===========================================
// SAVE TO R2 HELPER
// ===========================================

export async function saveToR2(
  imageUrl: string,
  storeId: string,
  adId: string,
  suffix: string,
  env: Env
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('[R2] Failed to download image:', response.status);
      return imageUrl;
    }

    const buffer = await response.arrayBuffer();
    const key = `ads/${storeId}/${adId}/${suffix}-${Date.now()}.jpg`;

    await env.R2.put(key, buffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });

    console.log('[R2] Saved:', key);

    // Return the API URL for serving
    return `/api/ads/image?key=${encodeURIComponent(key)}`;
  } catch (err) {
    console.error('[R2] Save failed:', err);
    return imageUrl;
  }
}

// ===========================================
// UNIFIED IMAGE GENERATION
// ===========================================

/**
 * Main image generation function with provider fallback chain
 *
 * PARALLEL_EXECUTION: Image generation and copy generation always run in parallel.
 * Never await image before starting copy.
 */
export async function generateAdImage(
  product: {
    id: string;
    store_id: string;
    title: string;
    product_type: string | null;
    tags: string | null;
    images: string | null;
    image_url: string | null;
  },
  gender: Gender,
  sceneRules: SceneRules,
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null,
  env: Env
): Promise<ImageGenerationResult> {
  // Get product image URL
  let productImageUrl: string | null = product.image_url;
  if (!productImageUrl && product.images) {
    try {
      const images = JSON.parse(product.images);
      productImageUrl = images[0] || null;
    } catch {
      productImageUrl = null;
    }
  }

  if (!productImageUrl) {
    console.warn('[IMAGE_GEN] No product image available');
    return {
      finalImageUrl: null,
      sceneImageUrl: null,
      productImageUrl: null,
      method: 'shopify_only'
    };
  }

  // Log style profiles
  console.log('[STYLE_PROFILES]', {
    hasBrandStyle: !!brandStyle,
    hasProductStyle: !!productStyle,
    brandMood: brandStyle?.mood || 'none',
    productSuggestedStyle: productStyle?.suggestedAdStyle || 'none'
  });

  if (!brandStyle) {
    console.warn('[STYLE_PROFILES] No brand style — using category defaults.');
  }
  if (!productStyle) {
    console.warn('[STYLE_PROFILES] No product style — using defaults.');
  }

  const isWearable = isWearableProduct(product.product_type, product.title, product.tags);
  const adId = crypto.randomUUID();

  // MODE 1: FASHN for wearable fashion with gendered model
  // NEUTRAL_NO_FASHN: NEUTRAL gender never calls FASHN
  if (isWearable && gender !== 'NEUTRAL' && env.FASHNAI_API_KEY) {
    console.log('[IMAGE_GEN] Mode: FASHN model');

    const fashnUrl = await generateWithFashn(
      productImageUrl,
      gender,
      brandStyle,
      productStyle,
      env
    );

    if (fashnUrl) {
      const r2Url = await saveToR2(fashnUrl, product.store_id, adId, 'fashn', env);
      return {
        finalImageUrl: r2Url,
        sceneImageUrl: null,
        productImageUrl: productImageUrl,
        method: 'fashn_model'
      };
    }

    console.warn('[IMAGE_GEN] FASHN failed, trying Bria');
  }

  // MODE 2: Bria for product shots
  if (env.FAL_API_KEY && productImageUrl) {
    console.log('[IMAGE_GEN] Mode: Bria product shot');

    const briaUrl = await generateWithBria(
      productImageUrl,
      sceneRules.environment,
      brandStyle,
      productStyle,
      env
    );

    if (briaUrl) {
      const r2Url = await saveToR2(briaUrl, product.store_id, adId, 'bria', env);
      return {
        finalImageUrl: r2Url,
        sceneImageUrl: null,
        productImageUrl: productImageUrl,
        method: 'bria_product_shot'
      };
    }

    console.warn('[IMAGE_GEN] Bria failed, trying FLUX + CSS overlay');
  }

  // MODE 3: FLUX + CSS overlay
  console.log('[IMAGE_GEN] Mode: FLUX + CSS overlay');

  const backgroundPrompt = [
    sceneRules.environment,
    brandStyle?.visualTone ? `${brandStyle.visualTone} aesthetic` : '',
    brandStyle?.mood ? `${brandStyle.mood} mood` : '',
    brandStyle?.colors?.length
      ? `Colors inspired by: ${brandStyle.colors.map(c => c.hex).join(', ')}`
      : 'neutral color palette',
    productStyle?.lighting
      ? `Lighting: ${productStyle.lighting}`
      : `Lighting: ${sceneRules.lighting}`,
    sceneRules.specialInstructions,
    'Empty background only.',
    'No products, no objects, no people, no text.'
  ].filter(Boolean).join('. ');

  const fluxUrl = await generateFluxBackground(
    backgroundPrompt,
    sceneRules.negativePromptAdditions,
    env
  );

  if (fluxUrl) {
    const r2SceneUrl = await saveToR2(fluxUrl, product.store_id, adId, 'scene', env);
    const r2ProductUrl = await saveToR2(productImageUrl, product.store_id, adId, 'product', env);

    return {
      finalImageUrl: r2SceneUrl,
      sceneImageUrl: r2SceneUrl,
      productImageUrl: r2ProductUrl,
      method: 'css_overlay'
    };
  }

  // Ultimate fallback
  console.warn('[IMAGE_GEN] All providers failed');
  return {
    finalImageUrl: productImageUrl,
    sceneImageUrl: null,
    productImageUrl: productImageUrl,
    method: 'shopify_only'
  };
}
