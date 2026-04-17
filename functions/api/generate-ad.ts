/**
 * API endpoint for ad generation
 * POST /api/generate-ad - Generate an ad for a product
 * GET /api/generate-ad/:id - Get ad status
 */

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
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
  price_min: number | null;
  price_max: number | null;
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

// Detect creative strategy based on product
function detectCreativeStrategy(product: Product): string {
  const searchText = `${product.title} ${product.product_type || ''} ${product.tags || ''} ${product.description || ''}`.toLowerCase();

  for (const [keyword, strategy] of Object.entries(CREATIVE_STRATEGIES)) {
    if (keyword !== 'default' && searchText.includes(keyword)) {
      return strategy;
    }
  }

  return CREATIVE_STRATEGIES.default;
}

// Generate ad copy using OpenAI
async function generateAdCopy(
  product: Product,
  apiKey: string
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
Be concise, engaging, and focus on benefits. Use emotional triggers and clear calls to action.
Return JSON only with these exact fields: headline (max 40 chars), primaryText (max 125 chars), description (max 90 chars), cta (max 20 chars).`,
          },
          {
            role: 'user',
            content: `Create ad copy for this product:
Title: ${product.title}
Type: ${product.product_type || 'General'}
Description: ${product.description?.replace(/<[^>]*>/g, '').slice(0, 500) || 'No description'}
Price: $${product.price_min || 0}${product.price_max && product.price_max !== product.price_min ? ` - $${product.price_max}` : ''}
Brand: ${product.vendor || 'Unknown'}
Tags: ${product.tags || 'None'}`,
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

    return {
      headline: content.headline || `Discover ${product.title}`,
      primaryText: content.primaryText || content.primary_text || product.description?.slice(0, 125) || '',
      description: content.description || '',
      cta: content.cta || 'Shop Now',
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      headline: `Discover ${product.title}`,
      primaryText: product.description?.replace(/<[^>]*>/g, '').slice(0, 125) || `Check out our amazing ${product.title}`,
      description: `Shop now and experience the quality of ${product.vendor || 'our brand'}`,
      cta: 'Shop Now',
    };
  }
}

// Generate image prompt for Gemini
function generateImagePrompt(product: Product, strategy: string): string {
  const productName = product.title;
  const category = product.product_type || 'product';

  const strategyPrompts: Record<string, string> = {
    emotion_lifestyle: `Professional lifestyle photography of ${productName}. Show the product being used naturally by an attractive model in a beautiful, aspirational setting. Warm, inviting lighting. The product should be clearly visible and the hero of the shot. High-end editorial feel, shot on professional camera. ${category} photography.`,

    specs_focused: `Clean, professional product photography of ${productName} on a minimal white or gradient background. Sharp focus, perfect lighting to show product details. Studio quality, commercial photography style. The product fills 70% of the frame. No people, no distracting elements.`,

    styled_product: `Beautiful styled product photography of ${productName}. Elegant composition with complementary props and textures. Soft, directional lighting creating gentle shadows. The product is the clear hero. Interior design magazine aesthetic. No people.`,

    clean_product: `Minimalist product photography of ${productName} on a clean gradient background. Professional studio lighting, sharp focus on product details. Commercial e-commerce quality. Product centered, filling 60-70% of frame. No distractions.`,

    ugc_discovery: `Authentic user-generated content style photo of ${productName}. Real person's hand holding the product toward camera. Casual home or lifestyle background, natural lighting. iPhone quality aesthetic, genuine and relatable. The product is clearly visible.`,
  };

  return strategyPrompts[strategy] || strategyPrompts.clean_product;
}

// Generate image using Gemini
async function generateImage(
  prompt: string,
  apiKey: string,
  productImageUrl: string | null
): Promise<string | null> {
  // If no API key, return the product's original image
  if (!apiKey) {
    return productImageUrl;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'text/plain',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return productImageUrl;
    }

    const data = await response.json() as any;

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return productImageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    return productImageUrl;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const body = await context.request.json() as { productId: string };
    const { productId } = body;

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get the product
    const product = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(productId).first<Product>();

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create ad record with 'generating' status
    const adId = crypto.randomUUID();
    const strategy = detectCreativeStrategy(product);

    await env.DB.prepare(`
      INSERT INTO generated_ads (id, store_id, product_id, status, creative_strategy, created_at)
      VALUES (?, ?, ?, 'generating', ?, datetime('now'))
    `).bind(adId, product.store_id, productId, strategy).run();

    // Generate ad copy
    const adCopy = await generateAdCopy(product, env.OPENAI_API_KEY);

    // Generate image prompt and image
    const imagePrompt = generateImagePrompt(product, strategy);
    const imageUrl = await generateImage(imagePrompt, env.GEMINI_API_KEY, product.image_url);

    // Update ad with generated content
    await env.DB.prepare(`
      UPDATE generated_ads
      SET headline = ?, primary_text = ?, description = ?, call_to_action = ?,
          image_url = ?, image_prompt = ?, status = 'ready', updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      adCopy.headline,
      adCopy.primaryText,
      adCopy.description,
      adCopy.cta,
      imageUrl,
      imagePrompt,
      adId
    ).run();

    return Response.json({
      success: true,
      adId,
      status: 'ready',
      ad: {
        id: adId,
        productId,
        headline: adCopy.headline,
        primaryText: adCopy.primaryText,
        description: adCopy.description,
        cta: adCopy.cta,
        imageUrl,
        strategy,
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
  const { env } = context;
  const url = new URL(context.request.url);
  const adId = url.searchParams.get('id');

  if (!adId) {
    return Response.json({ error: 'Ad ID required' }, { status: 400 });
  }

  try {
    const ad = await env.DB.prepare(
      'SELECT * FROM generated_ads WHERE id = ?'
    ).bind(adId).first();

    if (!ad) {
      return Response.json({ error: 'Ad not found' }, { status: 404 });
    }

    return Response.json({ success: true, ad });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
