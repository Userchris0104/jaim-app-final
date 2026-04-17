/**
 * Brand Style API
 * POST /api/brand-style - Upload images and analyze brand style
 * GET /api/brand-style - Get current brand style profile
 * DELETE /api/brand-style - Remove brand style profile
 */

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
}

interface BrandStyleProfile {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

// GET - Fetch current brand style
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Get active store
    const store = await env.DB.prepare(
      'SELECT id, brand_style_profile, brand_reference_images, brand_style_updated_at FROM stores WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<any>();

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Parse stored JSON
    let profile = null;
    let referenceImages: string[] = [];

    if (store.brand_style_profile) {
      try {
        profile = JSON.parse(store.brand_style_profile);
      } catch {}
    }

    if (store.brand_reference_images) {
      try {
        referenceImages = JSON.parse(store.brand_reference_images);
      } catch {}
    }

    return Response.json({
      success: true,
      hasProfile: !!profile,
      profile,
      referenceImages,
      updatedAt: store.brand_style_updated_at,
    });
  } catch (error: any) {
    console.error('Error fetching brand style:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST - Upload images and analyze brand style
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    // Get active store
    const store = await env.DB.prepare(
      'SELECT * FROM stores WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<any>();

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Handle image upload
    if (action === 'upload') {
      const file = formData.get('file') as File;
      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return Response.json({ error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' }, { status: 400 });
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 });
      }

      // Generate unique key for R2
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `brand-style/${store.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      // Upload to R2
      const arrayBuffer = await file.arrayBuffer();
      await env.R2.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      });

      // Get current reference images
      let referenceImages: string[] = [];
      if (store.brand_reference_images) {
        try {
          referenceImages = JSON.parse(store.brand_reference_images);
        } catch {}
      }

      // Add new image (max 5)
      if (referenceImages.length >= 5) {
        return Response.json({ error: 'Maximum 5 images allowed. Remove one first.' }, { status: 400 });
      }

      referenceImages.push(key);

      // Update store
      await env.DB.prepare(
        'UPDATE stores SET brand_reference_images = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(JSON.stringify(referenceImages), store.id).run();

      return Response.json({
        success: true,
        key,
        images: referenceImages,
      });
    }

    // Handle image removal
    if (action === 'remove') {
      const key = formData.get('key') as string;
      if (!key) {
        return Response.json({ error: 'No key provided' }, { status: 400 });
      }

      // Delete from R2
      await env.R2.delete(key);

      // Get current reference images and remove
      let referenceImages: string[] = [];
      if (store.brand_reference_images) {
        try {
          referenceImages = JSON.parse(store.brand_reference_images);
        } catch {}
      }

      referenceImages = referenceImages.filter(img => img !== key);

      // Update store
      await env.DB.prepare(
        'UPDATE stores SET brand_reference_images = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(JSON.stringify(referenceImages), store.id).run();

      return Response.json({
        success: true,
        images: referenceImages,
      });
    }

    // Handle brand style analysis
    if (action === 'analyze') {
      const includeShopifyImages = formData.get('includeShopifyImages') === 'true';

      // Get uploaded reference images
      let referenceImages: string[] = [];
      if (store.brand_reference_images) {
        try {
          referenceImages = JSON.parse(store.brand_reference_images);
        } catch {}
      }

      if (referenceImages.length === 0) {
        return Response.json({ error: 'Upload at least one brand image first' }, { status: 400 });
      }

      // Collect all image URLs for analysis
      const imageUrls: string[] = [];

      // Add uploaded brand images (from R2)
      for (const key of referenceImages) {
        // Get R2 object and convert to base64
        const obj = await env.R2.get(key);
        if (obj) {
          const buffer = await obj.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          const contentType = obj.httpMetadata?.contentType || 'image/jpeg';
          imageUrls.push(`data:${contentType};base64,${base64}`);
        }
      }

      // Add Shopify product images if enabled
      if (includeShopifyImages) {
        const products = await env.DB.prepare(
          'SELECT image_urls FROM products WHERE store_id = ? AND is_active = 1 ORDER BY synced_at DESC LIMIT 3'
        ).bind(store.id).all<{ image_urls: string }>();

        for (const product of products.results) {
          if (product.image_urls) {
            try {
              const urls = JSON.parse(product.image_urls);
              if (urls[0]) {
                imageUrls.push(urls[0]); // First image from each product
              }
            } catch {}
          }
        }
      }

      if (imageUrls.length === 0) {
        return Response.json({ error: 'No images available for analysis' }, { status: 400 });
      }

      // Analyze with OpenAI GPT-4o Vision
      const profile = await analyzeBrandStyle(imageUrls, env.OPENAI_API_KEY, includeShopifyImages);

      // Save to database
      await env.DB.prepare(
        'UPDATE stores SET brand_style_profile = ?, brand_style_updated_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
      ).bind(JSON.stringify(profile), store.id).run();

      return Response.json({
        success: true,
        profile,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in brand style API:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// DELETE - Remove brand style profile
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const store = await env.DB.prepare(
      'SELECT * FROM stores WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<any>();

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Delete all R2 images
    if (store.brand_reference_images) {
      try {
        const images = JSON.parse(store.brand_reference_images);
        for (const key of images) {
          await env.R2.delete(key);
        }
      } catch {}
    }

    // Clear database columns
    await env.DB.prepare(
      'UPDATE stores SET brand_style_profile = NULL, brand_reference_images = NULL, brand_style_updated_at = NULL, updated_at = datetime("now") WHERE id = ?'
    ).bind(store.id).run();

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

/**
 * Analyze brand style using OpenAI GPT-4o Vision
 */
async function analyzeBrandStyle(
  imageUrls: string[],
  apiKey: string,
  includesProductImages: boolean
): Promise<BrandStyleProfile> {
  // Default profile if no API key
  if (!apiKey) {
    return {
      colors: [
        { hex: '#6366F1', label: 'Primary Purple' },
        { hex: '#F9FAFB', label: 'Light Background' },
        { hex: '#111827', label: 'Dark Text' },
      ],
      visualTone: 'Modern and clean',
      contentStyle: 'Product-focused photography',
      mood: 'Professional, approachable',
      keyPatterns: 'Clean backgrounds with centered product placement',
      conflicts: null,
    };
  }

  try {
    // Build image content for GPT-4o
    const imageContent = imageUrls.map(url => ({
      type: 'image_url' as const,
      image_url: {
        url: url,
        detail: 'low' as const, // Use low detail to reduce tokens
      },
    }));

    const contextNote = includesProductImages
      ? 'Some images are from the brand\'s social media, others are product photos from their e-commerce store.'
      : 'These images are from the brand\'s social media presence.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a brand strategist analyzing visual identity. ${contextNote}

Analyze these images and extract the brand's visual identity. Return ONLY a valid JSON object with these exact fields:
{
  "colors": [{"hex": "#XXXXXX", "label": "Color name"}] (extract 3-5 dominant colors),
  "visualTone": "one short phrase describing the overall aesthetic",
  "contentStyle": "one short phrase describing the photography/content style",
  "mood": "2-3 adjectives describing the brand feeling",
  "keyPatterns": "one sentence describing common composition, lighting, or styling patterns",
  "conflicts": "describe any style conflict between social images and product images, or null if consistent"
}

Return valid JSON only. No markdown, no explanation, no preamble.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze these brand images and extract the visual identity:',
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    // Parse JSON response (handle potential markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const profile = JSON.parse(jsonStr) as BrandStyleProfile;

    // Validate required fields
    if (!profile.colors || !profile.visualTone || !profile.contentStyle || !profile.mood || !profile.keyPatterns) {
      throw new Error('Invalid profile structure');
    }

    return profile;
  } catch (error) {
    console.error('Brand style analysis error:', error);
    // Return default profile on error
    return {
      colors: [
        { hex: '#6366F1', label: 'Primary Purple' },
        { hex: '#F9FAFB', label: 'Light Background' },
        { hex: '#111827', label: 'Dark Text' },
      ],
      visualTone: 'Modern and clean',
      contentStyle: 'Product-focused photography',
      mood: 'Professional, approachable',
      keyPatterns: 'Clean backgrounds with centered product placement',
      conflicts: null,
    };
  }
}
