/**
 * API endpoint for ad generation
 * POST /api/generate-ad - Generate an ad for a product
 * GET /api/generate-ad/:id - Get ad status
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';
import { generateAdImage } from '../lib/image/fal-client';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  FAL_API_KEY: string;
  USE_MOCK_PLATFORMS: string;
}

interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  product_type: string | null;
  image_urls: string | null;  // JSON array of image URLs
  price: number | null;
}

interface BrandStyleProfile {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

// Creative strategies based on product type
const CREATIVE_STRATEGIES = {
  fashion: 'emotion_lifestyle',
  beauty: 'emotion_lifestyle',
  skincare: 'emotion_lifestyle',
  jewelry: 'styled_product',
  electronics: 'specs_focused',
  tech: 'specs_focused',
  home: 'styled_product',
  pet: 'emotion_lifestyle',
  food: 'styled_product',
  default: 'clean_product',
} as const;

// Get first image from product
function getProductImage(product: Product): string | null {
  if (!product.image_urls) return null;
  try {
    const images = JSON.parse(product.image_urls);
    return images[0] || null;
  } catch {
    return null;
  }
}

// Detect creative strategy based on product
function detectCreativeStrategy(product: Product): string {
  const searchText = `${product.title} ${product.product_type || ''} ${product.description || ''}`.toLowerCase();

  for (const [keyword, strategy] of Object.entries(CREATIVE_STRATEGIES)) {
    if (keyword !== 'default' && searchText.includes(keyword)) {
      return strategy;
    }
  }

  return CREATIVE_STRATEGIES.default;
}

// Generate ad copy using Claude (primary) with OpenAI fallback
async function generateAdCopy(
  product: Product,
  env: Env,
  brandStyle?: BrandStyleProfile | null
): Promise<{ headline: string; primaryText: string; description: string; cta: string }> {

  // Try Claude first
  if (env.ANTHROPIC_API_KEY) {
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
- Emotionally resonant — speaks to how the customer FEELS wearing/using it, not just what it is
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

Return ONLY valid JSON with no preamble:
{
  "headline": "max 40 chars — hook, not description",
  "primaryText": "max 125 chars — desire/problem focused",
  "description": "max 90 chars — social proof or urgency",
  "cta": "Shop Now"
}

---

PRODUCT TO WRITE COPY FOR:

Name: ${product.title}
Category: ${product.product_type || 'Fashion'}
Price: $${product.price || 0}
Brand: ${product.vendor || 'Independent brand'}
Brand mood: ${brandStyle?.mood || 'contemporary'}
Brand tone: ${brandStyle?.visualTone || 'modern'}

Raw product description (use for CONTEXT ONLY, do not paraphrase this):
${product.description?.replace(/<[^>]*>/g, '').slice(0, 400) || 'No description provided'}

---

COPY DIRECTION:
Think about WHO buys this product and WHY. What problem does it solve? What desire does it fulfil? What would make someone stop scrolling and click?

Write for someone who has never heard of this product but would love it if they saw it.

Examples of BAD headlines (do not write like this):
- "Discover our Classic Men's Shirt"
- "High quality organic cotton shirt"
- "Shop our latest collection"

Examples of GOOD headlines for a men's shirt:
- "The shirt you'll wear everywhere"
- "Why is everyone buying this shirt?"
- "Finally. A shirt that fits right"
- "100% organic. Zero compromises"

Be bold and creative. Surprise me with an angle I haven't seen before.`
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

      // Parse JSON response (handle potential markdown wrapping)
      let jsonStr = copyText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
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
      console.warn('[COPY_GEN] Using OpenAI fallback');
    }
  }

  // Fallback to OpenAI
  return generateAdCopyOpenAI(product, env.OPENAI_API_KEY, brandStyle);
}

// OpenAI fallback for ad copy generation
async function generateAdCopyOpenAI(
  product: Product,
  apiKey: string,
  brandStyle?: BrandStyleProfile | null
): Promise<{ headline: string; primaryText: string; description: string; cta: string }> {
  // If no API key, return placeholder copy
  if (!apiKey) {
    return {
      headline: `Discover ${product.title}`,
      primaryText: product.description?.replace(/<[^>]*>/g, '').slice(0, 125) || `Check out our amazing ${product.title}`,
      description: `Shop now and experience the quality of ${product.vendor || 'our brand'}`,
      cta: 'Shop Now',
    };
  }

  // Build brand context if available
  let brandContext = '';
  if (brandStyle) {
    brandContext = `\nBrand tone: ${brandStyle.mood}. Match this voice in the copy.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert ad copywriter. Generate compelling ad copy for social media ads.
Be concise, engaging, and focus on benefits. Use emotional triggers and clear calls to action.${brandContext}
Return JSON only with these exact fields: headline (max 40 chars), primaryText (max 125 chars), description (max 90 chars), cta (max 20 chars).`,
          },
          {
            role: 'user',
            content: `Create ad copy for this product:
Title: ${product.title}
Type: ${product.product_type || 'General'}
Description: ${product.description?.replace(/<[^>]*>/g, '').slice(0, 500) || 'No description'}
Price: $${product.price || 0}
Brand: ${product.vendor || 'Unknown'}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = JSON.parse(data.choices[0].message.content);

    console.log('[COPY_GEN] Provider: OpenAI fallback');
    return {
      headline: content.headline || `Discover ${product.title}`,
      primaryText: content.primaryText || content.primary_text || product.description?.slice(0, 125) || '',
      description: content.description || '',
      cta: content.cta || 'Shop Now',
    };
  } catch (error) {
    console.error('[COPY_GEN] OpenAI fallback also failed:', error);
    return {
      headline: `Discover ${product.title}`,
      primaryText: product.description?.replace(/<[^>]*>/g, '').slice(0, 125) || `Check out our amazing ${product.title}`,
      description: `Shop now and experience the quality of ${product.vendor || 'our brand'}`,
      cta: 'Shop Now',
    };
  }
}

// Fetch brand style profile for a store
async function getBrandStyleProfile(db: D1Database, storeId: string): Promise<BrandStyleProfile | null> {
  try {
    const store = await db.prepare(
      'SELECT brand_style_profile FROM stores WHERE id = ?'
    ).bind(storeId).first<{ brand_style_profile: string | null }>();

    if (store?.brand_style_profile) {
      return JSON.parse(store.brand_style_profile);
    }
  } catch (error) {
    console.error('Error fetching brand style:', error);
  }
  return null;
}

// Build brand style context for prompt injection
function buildBrandStyleContext(brandStyle: BrandStyleProfile): string {
  const colorList = brandStyle.colors.map(c => c.hex).join(', ');

  return `
BRAND STYLE REQUIREMENTS - Apply these characteristics:
- Visual tone: ${brandStyle.visualTone}
- Content style: ${brandStyle.contentStyle}
- Mood: ${brandStyle.mood}
- Color palette: ${colorList}
- Key patterns: ${brandStyle.keyPatterns}
Match this brand identity while keeping the product as the hero of the ad.
`;
}

// Generate image prompt for Gemini
function generateImagePrompt(product: Product, strategy: string, brandStyle?: BrandStyleProfile | null): string {
  const productName = product.title;
  const category = product.product_type || 'product';

  const strategyPrompts: Record<string, string> = {
    emotion_lifestyle: `Professional lifestyle photography of ${productName}. Show the product being used naturally by an attractive model in a beautiful, aspirational setting. Warm, inviting lighting. The product should be clearly visible and the hero of the shot. High-end editorial feel, shot on professional camera. ${category} photography.`,

    specs_focused: `Clean, professional product photography of ${productName} on a minimal white or gradient background. Sharp focus, perfect lighting to show product details. Studio quality, commercial photography style. The product fills 70% of the frame. No people, no distracting elements.`,

    styled_product: `Beautiful styled product photography of ${productName}. Elegant composition with complementary props and textures. Soft, directional lighting creating gentle shadows. The product is the clear hero. Interior design magazine aesthetic. No people.`,

    clean_product: `Minimalist product photography of ${productName} on a clean gradient background. Professional studio lighting, sharp focus on product details. Commercial e-commerce quality. Product centered, filling 60-70% of frame. No distractions.`,

    ugc_discovery: `Authentic user-generated content style photo of ${productName}. Real person's hand holding the product toward camera. Casual home or lifestyle background, natural lighting. iPhone quality aesthetic, genuine and relatable. The product is clearly visible.`,
  };

  let prompt = strategyPrompts[strategy] || strategyPrompts.clean_product;

  // Inject brand style context if available
  if (brandStyle) {
    prompt = buildBrandStyleContext(brandStyle) + '\n' + prompt;
  }

  return prompt;
}

// Image generation is handled by ../lib/image/fal-client.ts
// Uses fal.ai FLUX as primary, Gemini as fallback

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const body = await request.json() as { productId: string };
    const { productId } = body;

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get current store from cookie
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get the product and validate it belongs to the current store
    const product = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ? AND store_id = ?'
    ).bind(productId, store.id).first<Product>();

    if (!product) {
      return Response.json({ error: 'Product not found or belongs to different store' }, { status: 404 });
    }

    // Create ad record with 'DRAFT' status using production schema
    const adId = crypto.randomUUID();
    const strategy = detectCreativeStrategy(product);
    const productImageUrl = getProductImage(product);

    // Fetch brand style profile (optional - ad generation works without it)
    const brandStyle = await getBrandStyleProfile(env.DB, product.store_id);

    // Generate ad copy (with brand style if available)
    const adCopy = await generateAdCopy(product, env, brandStyle);

    // Generate image prompt and image (with brand style if available)
    // Uses fal.ai FLUX as primary, Gemini as fallback
    const imagePrompt = generateImagePrompt(product, strategy, brandStyle);
    const format = 'square' as const; // TODO: Make configurable based on platform
    const imageUrl = await generateAdImage({
      prompt: imagePrompt,
      format,
      falApiKey: env.FAL_API_KEY,
      geminiApiKey: env.GEMINI_API_KEY,
      fallbackImageUrl: productImageUrl,
    });

    // Insert using actual database schema
    await env.DB.prepare(`
      INSERT INTO generated_ads (
        id, store_id, product_id, status,
        headline, primary_text, description, call_to_action,
        image_url, image_prompt, platform, format, creative_strategy,
        created_at, updated_at
      )
      VALUES (?, ?, ?, 'generating', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      adId,
      product.store_id,
      productId,
      adCopy.headline,      // headline
      adCopy.primaryText,   // primary_text
      adCopy.description,   // description
      adCopy.cta,           // call_to_action
      imageUrl,             // image_url
      imagePrompt,          // image_prompt
      'meta_feed',          // platform
      'square',             // format
      strategy              // creative_strategy
    ).run();

    return Response.json({
      success: true,
      adId,
      status: 'generating',
      ad: {
        id: adId,
        productId,
        headline: adCopy.headline,
        primaryText: adCopy.primaryText,
        description: adCopy.description,
        callToAction: adCopy.cta,
        imageUrl,
        imagePrompt,
        platform: 'meta_feed',
        format: 'square',
        creativeStrategy: strategy,
      },
    });
  } catch (error: any) {
    console.error('Error generating ad:', error);
    return Response.json(
      { error: error.message || 'Failed to generate ad' },
      { status: 500 }
    );
  }
};

// GET endpoint to check ad status
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const adId = url.searchParams.get('id');

  if (!adId) {
    return Response.json({ error: 'Ad ID required' }, { status: 400 });
  }

  try {
    // Get current store from cookie
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get ad and validate it belongs to the current store
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
