/**
 * API endpoint for ad generation
 * POST /api/generate-ad - Generate 3 A/B variants for a product
 * GET /api/generate-ad/:id - Get ad status
 *
 * CRITICAL RULES:
 * - STYLE_PROFILES: Both brand_style_profile and product_style_profile must be
 *   passed to every provider. Never generate without them if available.
 * - ZERO_HALLUCINATION: Product image always comes from Shopify. AI generates scene only.
 * - NEUTRAL_NO_FASHN: NEUTRAL gender never calls FASHN. Routed to Bria instead.
 * - AB_TESTING: Always generate 3 variants. Never generate a single ad in isolation.
 * - SMART_ASSIGNMENT: 1 model variant (FASHN) + 2 product variants (Bria).
 *   JAIM decides which variant gets the model based on product/brand analysis.
 * - PARALLEL_EXECUTION: Image and copy generation always run in parallel.
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';
import {
  generateAdImage,
  type Gender,
  type BrandStyleProfile,
  type ProductStyleProfile,
  type SceneRules,
  type ImageGenerationResult
} from '../lib/image/providers';
import {
  generateAllVariants,
  createAbGroup,
  getSceneRulesForVariant,
  getCopyPromptForVariant,
  type AdVariant,
  type VariantResult
} from '../lib/image/variants';

// ===========================================
// ENV AND TYPES
// ===========================================

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  FAL_API_KEY: string;
  FASHNAI_API_KEY: string;
  R2_PUBLIC_URL: string;
  USE_MOCK_PLATFORMS: string;
}

interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  product_type: string | null;
  tags: string | null;
  image_url: string | null;
  images: string | null;
  price: number | null;
}

interface Store {
  id: string;
  store_category: string | null;
  brand_style_profile: string | null;
}

// ===========================================
// GENDER DETECTION
// ===========================================

const MALE_KEYWORDS = [
  'men', 'mens', "men's", 'male', 'boy', 'boys', 'him', 'his',
  'gentleman', 'masculine'
];

const FEMALE_KEYWORDS = [
  'women', 'womens', "women's", 'female', 'girl', 'girls', 'her', 'hers',
  'lady', 'ladies', 'feminine'
];

function detectGender(product: Product): Gender {
  const searchText = `${product.title} ${product.product_type || ''} ${product.tags || ''} ${product.description || ''}`.toLowerCase();

  // Use word boundary regex to avoid "men" matching inside "women"
  const matchesKeyword = (keywords: string[]) =>
    keywords.some(k => new RegExp(`\\b${k}\\b`).test(searchText));

  const hasMale = matchesKeyword(MALE_KEYWORDS);
  const hasFemale = matchesKeyword(FEMALE_KEYWORDS);

  console.log('[GENDER_DETECT] hasMale:', hasMale, 'hasFemale:', hasFemale);

  if (hasMale && !hasFemale) return 'MALE';
  if (hasFemale && !hasMale) return 'FEMALE';
  return 'NEUTRAL';
}

// ===========================================
// SMART VARIANT ASSIGNMENT
// ===========================================

/**
 * JAIM intelligently selects which variant gets the model image
 * Based on product characteristics, brand style, and strategic rotation
 *
 * Logic:
 * - Lifestyle brands → Model on B (emotion/lifestyle)
 * - Bold/edgy brands → Model on C (pattern interrupt)
 * - Clean/minimal brands → Model on A (benefit focused)
 * - Premium/luxury → Model on B or C (aspirational)
 * - Default: Rotate based on product hash for variety
 */
function selectModelVariant(
  product: Product,
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null
): AdVariant {
  const mood = brandStyle?.mood?.toLowerCase() || '';
  const visualTone = brandStyle?.visualTone?.toLowerCase() || '';
  const contentStyle = brandStyle?.contentStyle?.toLowerCase() || '';
  const suggestedStyle = productStyle?.suggestedAdStyle?.toLowerCase() || '';

  // Bold, edgy, or high-contrast brands → Model on C (pattern interrupt)
  if (
    mood.includes('bold') ||
    mood.includes('edgy') ||
    visualTone.includes('dramatic') ||
    visualTone.includes('high contrast') ||
    suggestedStyle.includes('bold')
  ) {
    console.log('[VARIANT_SELECT] Bold brand detected → Model on C');
    return 'C';
  }

  // Lifestyle, aspirational, or emotional brands → Model on B (lifestyle)
  if (
    contentStyle.includes('lifestyle') ||
    mood.includes('aspirational') ||
    mood.includes('warm') ||
    mood.includes('inviting') ||
    suggestedStyle.includes('lifestyle')
  ) {
    console.log('[VARIANT_SELECT] Lifestyle brand detected → Model on B');
    return 'B';
  }

  // Minimal, clean, or professional brands → Model on A (clean/minimal)
  if (
    visualTone.includes('minimal') ||
    visualTone.includes('clean') ||
    mood.includes('professional') ||
    mood.includes('sophisticated') ||
    suggestedStyle.includes('minimal')
  ) {
    console.log('[VARIANT_SELECT] Minimal brand detected → Model on A');
    return 'A';
  }

  // Default: Rotate based on product ID hash for variety
  const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants: AdVariant[] = ['A', 'B', 'C'];
  const selected = variants[hash % 3];
  console.log('[VARIANT_SELECT] Default rotation → Model on', selected);
  return selected;
}

// Creative placement configurations for each variant
const VARIANT_PLACEMENTS: Record<AdVariant, {
  placement: 'center_horizontal' | 'right_center' | 'left_center' | 'bottom_center' | 'upper_center';
  dynamicAngle: boolean;
  imageIndex: number;  // Which product image to use (0, 1, 2...)
}> = {
  A: { placement: 'center_horizontal', dynamicAngle: false, imageIndex: 0 },  // Clean, centered
  B: { placement: 'right_center', dynamicAngle: true, imageIndex: 1 },        // Lifestyle, dynamic right
  C: { placement: 'left_center', dynamicAngle: true, imageIndex: 2 },         // Bold, dynamic left
};

/**
 * Get all product images from Shopify data
 */
function getAllProductImages(product: Product): string[] {
  const images: string[] = [];

  // Try parsing images array
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        images.push(...parsed);
      }
    } catch {
      // Not JSON, might be a single URL
      if (typeof product.images === 'string' && product.images.startsWith('http')) {
        images.push(product.images);
      }
    }
  }

  // Add primary image if not already included
  if (product.image_url && !images.includes(product.image_url)) {
    images.unshift(product.image_url);
  }

  return images.filter(Boolean);
}

/**
 * Generate image for a specific variant with model/product mode control
 * Uses different product photos and placements for each variant
 */
async function generateAdImageForVariant(
  product: Product,
  gender: Gender,
  sceneRules: SceneRules,
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null,
  env: Env,
  useModel: boolean,
  variant: AdVariant
): Promise<ImageGenerationResult> {
  // Import the providers dynamically to avoid circular deps
  const {
    generateWithFashn,
    generateWithBria,
    generateFluxBackground,
    saveToR2
  } = await import('../lib/image/providers');

  // Get ALL product images
  const allImages = getAllProductImages(product);

  if (allImages.length === 0) {
    return {
      finalImageUrl: null,
      sceneImageUrl: null,
      productImageUrl: null,
      method: 'shopify_only'
    };
  }

  // Select image based on variant (cycle through available images)
  const variantConfig = VARIANT_PLACEMENTS[variant];
  const imageIndex = variantConfig.imageIndex % allImages.length;
  const productImageUrl = allImages[imageIndex];

  console.log(`[IMAGE_GEN] Variant ${variant}: Using image ${imageIndex + 1}/${allImages.length}`);

  const adId = crypto.randomUUID();

  // MODEL MODE: Use FASHN for model generation
  if (useModel && gender !== 'NEUTRAL' && env.FASHNAI_API_KEY) {
    console.log('[IMAGE_GEN] Mode: FASHN model (selected variant)');

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
    console.warn('[IMAGE_GEN] FASHN failed, falling back to Bria');
  }

  // PRODUCT MODE: Use Bria for engaging product shots
  if (env.FAL_API_KEY && productImageUrl) {
    console.log(`[IMAGE_GEN] Mode: Bria product shot (${variantConfig.placement}, dynamic: ${variantConfig.dynamicAngle})`);

    const briaUrl = await generateWithBria(
      productImageUrl,
      sceneRules.environment,
      brandStyle,
      productStyle,
      env,
      {
        placement: variantConfig.placement,
        dynamicAngle: variantConfig.dynamicAngle
      }
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
    console.warn('[IMAGE_GEN] Bria failed, falling back to FLUX');
  }

  // FALLBACK: FLUX + CSS overlay
  console.log('[IMAGE_GEN] Mode: FLUX + CSS overlay fallback');

  const backgroundPrompt = [
    sceneRules.environment,
    brandStyle?.visualTone ? `${brandStyle.visualTone} aesthetic` : '',
    brandStyle?.mood ? `${brandStyle.mood} mood` : '',
    'Empty background only. No products, no objects, no people, no text.'
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
  return {
    finalImageUrl: productImageUrl,
    sceneImageUrl: null,
    productImageUrl: productImageUrl,
    method: 'shopify_only'
  };
}

// ===========================================
// STYLE PROFILE FETCHERS
// ===========================================

async function getBrandStyleProfile(
  db: D1Database,
  storeId: string
): Promise<BrandStyleProfile | null> {
  try {
    const store = await db.prepare(
      'SELECT brand_style_profile FROM stores WHERE id = ?'
    ).bind(storeId).first<{ brand_style_profile: string | null }>();

    if (store?.brand_style_profile) {
      return JSON.parse(store.brand_style_profile);
    }
  } catch (error) {
    console.error('[STYLE] Error fetching brand style:', error);
  }
  return null;
}

async function getProductStyleProfile(
  db: D1Database,
  productId: string
): Promise<ProductStyleProfile | null> {
  try {
    const product = await db.prepare(
      'SELECT product_style_profile FROM products WHERE id = ?'
    ).bind(productId).first<{ product_style_profile: string | null }>();

    if (product?.product_style_profile) {
      return JSON.parse(product.product_style_profile);
    }
  } catch (error) {
    console.error('[STYLE] Error fetching product style:', error);
  }
  return null;
}

async function getStoreCategory(
  db: D1Database,
  storeId: string
): Promise<string | null> {
  try {
    const store = await db.prepare(
      'SELECT store_category FROM stores WHERE id = ?'
    ).bind(storeId).first<{ store_category: string | null }>();

    return store?.store_category || null;
  } catch (error) {
    console.error('[STYLE] Error fetching store category:', error);
  }
  return null;
}

// ===========================================
// AD COPY GENERATION
// ===========================================

async function generateAdCopy(
  product: Product,
  env: Env,
  brandStyle: BrandStyleProfile | null,
  productStyle: ProductStyleProfile | null,
  variantPrompt: string
): Promise<{ headline: string; primaryText: string; description: string; cta: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    return generateAdCopyFallback(product);
  }

  try {
    const claudeResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a senior performance marketing copywriter with 10 years experience writing viral ecommerce ads for TikTok, Instagram, and Facebook.

Your copy is known for being:
- Specific to the actual product — never generic
- Emotionally resonant — speaks to how the customer FEELS wearing/using it
- Platform-native — TikTok copy feels like TikTok, not a billboard
- Conversion-focused — every word earns its place

STRICT RULES — violating these makes the copy bad:
1. NEVER paraphrase the product description
2. NEVER start with the product name
3. NEVER use: amazing, incredible, perfect, high quality, best in class, game-changing, premium, luxury, elevate, discover
4. The headline must be a hook — a question, a bold claim, or an unexpected angle
5. Primary text must speak to the customer's desire or problem — not the product's features
6. Write AS IF you already know this product sells well — confident, not pushy
7. EVERY field must be a COMPLETE sentence or phrase — never cut off mid-word

---

BRAND VISUAL IDENTITY:
Visual tone: ${brandStyle?.visualTone || 'modern'}
Content style: ${brandStyle?.contentStyle || 'lifestyle'}
Mood: ${brandStyle?.mood || 'professional'}

PRODUCT VISUAL CHARACTERISTICS:
Color tone: ${productStyle?.colorTone || 'not specified'}
Product mood: ${productStyle?.productMood || 'not specified'}
Suggested style: ${productStyle?.suggestedAdStyle || 'not specified'}

Write copy that matches this visual identity and feels native to these characteristics.

---

${variantPrompt}

---

PRODUCT TO WRITE COPY FOR:

Name: ${product.title}
Category: ${product.product_type || 'Fashion'}
Price: $${product.price || 0}
Brand: ${product.vendor || 'Independent brand'}

Raw product description (use for CONTEXT ONLY, do not paraphrase this):
${product.description?.replace(/<[^>]*>/g, '').slice(0, 400) || 'No description provided'}

---

Return ONLY valid JSON with no preamble:
{
  "headline": "max 40 chars — hook, not description",
  "primaryText": "max 125 chars — desire/problem focused",
  "description": "max 90 chars — social proof or urgency",
  "cta": "Shop Now"
}`
          }]
        })
      }
    );

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json() as any;
    const copyText = claudeData.content?.[0]?.text;

    if (!copyText) {
      throw new Error('No content in Claude response');
    }

    let jsonStr = copyText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.headline || !parsed.primaryText || !parsed.cta) {
      throw new Error('Missing required fields in Claude response');
    }

    console.log('[COPY_GEN] Provider: Claude Sonnet');
    return {
      headline: parsed.headline,
      primaryText: parsed.primaryText,
      description: parsed.description || '',
      cta: parsed.cta,
    };
  } catch (error) {
    console.error('[COPY_GEN] Claude failed:', error);
    return generateAdCopyFallback(product);
  }
}

function generateAdCopyFallback(product: Product): {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
} {
  return {
    headline: `The ${product.title.split(' ').slice(0, 3).join(' ')} you need`,
    primaryText: product.description?.replace(/<[^>]*>/g, '').slice(0, 125) || `Check out ${product.title}`,
    description: `From ${product.vendor || 'our collection'}`,
    cta: 'Shop Now',
  };
}

// ===========================================
// MAIN POST HANDLER - GENERATE 3 VARIANTS
// ===========================================

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const body = await request.json() as { productId: string };
    const { productId } = body;

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const product = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ? AND store_id = ?'
    ).bind(productId, store.id).first<Product>();

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch style profiles
    const [brandStyle, productStyle, storeCategory] = await Promise.all([
      getBrandStyleProfile(env.DB, product.store_id),
      getProductStyleProfile(env.DB, productId),
      getStoreCategory(env.DB, product.store_id)
    ]);

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

    // Detect gender for provider routing
    const gender = detectGender(product);
    console.log('[AD_GEN] Detected gender:', gender);

    // Create A/B group to link variants
    const abGroup = createAbGroup(productId);

    // Generate copy function for variants
    const generateCopyFn = async (
      prod: Product,
      e: Env,
      bs: BrandStyleProfile | null,
      variantPrompt: string
    ) => {
      return generateAdCopy(prod, e, bs, productStyle, variantPrompt);
    };

    // AB_TESTING: Generate 3 variants with smart image assignment
    // 1 model variant (FASHN for fashion) + 2 product variants (Bria)
    console.log('[AD_GEN] Generating 3 A/B variants with smart assignment...');

    const variants: AdVariant[] = ['A', 'B', 'C'];
    const isWearableFashion = gender !== 'NEUTRAL' && env.FASHNAI_API_KEY;

    // JAIM decides which variant gets the model based on product analysis
    const modelVariant = isWearableFashion
      ? selectModelVariant(product, brandStyle, productStyle)
      : null;

    console.log('[AD_GEN] Model variant assignment:', modelVariant || 'none (all product shots)');

    // Generate all variants in parallel
    const results = await Promise.allSettled(
      variants.map(async (variant) => {
        const sceneRules = getSceneRulesForVariant(variant, brandStyle);
        const copyPrompt = getCopyPromptForVariant(variant);
        const useModel = variant === modelVariant;

        console.log(`[AD_GEN] Starting variant ${variant}... (${useModel ? 'MODEL' : 'PRODUCT'})`);

        // PARALLEL_EXECUTION: Image and copy run together
        const [imageResult, copyResult] = await Promise.all([
          generateAdImageForVariant(
            product,
            gender,
            sceneRules,
            brandStyle,
            productStyle,
            env,
            useModel,
            variant
          ),
          generateAdCopy(product, env, brandStyle, productStyle, copyPrompt)
        ]);

        return { variant, imageResult, copyResult };
      })
    );

    // Process results and save to database
    const savedAds: any[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const variant = variants[i];

      if (result.status === 'rejected') {
        console.error(`[AD_GEN] Variant ${variant} failed:`, result.reason);
        continue;
      }

      const { imageResult, copyResult } = result.value;
      const adId = crypto.randomUUID();

      // Log generation details
      console.log('[AD_GENERATION]', {
        productId: product.id,
        storeCategory,
        gender,
        provider: imageResult.method,
        variant,
        brandStyleUsed: !!brandStyle,
        productStyleUsed: !!productStyle,
        brandMood: brandStyle?.mood || 'none'
      });

      // Insert into database
      await env.DB.prepare(`
        INSERT INTO generated_ads (
          id, store_id, product_id, status,
          headline, primary_text, description, call_to_action,
          image_url, image_prompt, platform, format, creative_strategy,
          scene_image_url, product_image_url, compositing_method,
          ab_variant, ab_group,
          created_at, updated_at
        )
        VALUES (?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        adId,
        product.store_id,
        productId,
        copyResult.headline,
        copyResult.primaryText,
        copyResult.description,
        copyResult.cta,
        imageResult.finalImageUrl,
        `Variant ${variant} - ${imageResult.method}`,
        'meta_feed',
        'square',
        `variant_${variant.toLowerCase()}`,
        imageResult.sceneImageUrl,
        imageResult.productImageUrl,
        imageResult.method,
        variant,
        abGroup
      ).run();

      savedAds.push({
        id: adId,
        variant,
        productId,
        headline: copyResult.headline,
        primaryText: copyResult.primaryText,
        description: copyResult.description,
        callToAction: copyResult.cta,
        imageUrl: imageResult.finalImageUrl,
        sceneImageUrl: imageResult.sceneImageUrl,
        productImageUrl: imageResult.productImageUrl,
        compositingMethod: imageResult.method,
        platform: 'meta_feed',
        format: 'square',
        abGroup
      });
    }

    if (savedAds.length === 0) {
      return Response.json({ error: 'All variants failed to generate' }, { status: 500 });
    }

    console.log(`[AD_GEN] Generated ${savedAds.length} variants successfully`);

    return Response.json({
      success: true,
      message: `${savedAds.length} ad variants created for ${product.title}`,
      abGroup,
      variants: savedAds
    });

  } catch (error: any) {
    console.error('Error generating ad:', error);
    return Response.json(
      { error: error.message || 'Failed to generate ad' },
      { status: 500 }
    );
  }
};

// ===========================================
// GET HANDLER - CHECK AD STATUS
// ===========================================

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const adId = url.searchParams.get('id');
  const abGroup = url.searchParams.get('abGroup');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // If abGroup provided, return all variants in the group
    if (abGroup) {
      const result = await env.DB.prepare(
        'SELECT * FROM generated_ads WHERE ab_group = ? AND store_id = ? ORDER BY ab_variant'
      ).bind(abGroup, store.id).all();

      return Response.json({
        success: true,
        abGroup,
        variants: result.results
      });
    }

    // Single ad lookup
    if (!adId) {
      return Response.json({ error: 'Ad ID or abGroup required' }, { status: 400 });
    }

    const ad = await env.DB.prepare(
      'SELECT * FROM generated_ads WHERE id = ? AND store_id = ?'
    ).bind(adId, store.id).first();

    if (!ad) {
      return Response.json({ error: 'Ad not found' }, { status: 404 });
    }

    return Response.json({ success: true, ad });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
