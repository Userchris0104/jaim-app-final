/**
 * API endpoint for ad generation - Modular Compositing Pipeline
 *
 * POST /api/generate-ad - Generate ad variants for a product
 * GET /api/generate-ad?id=<adId> - Get ad status
 * GET /api/generate-ad?abGroup=<groupId> - Get all variants in group
 * DELETE /api/generate-ad?id=<adId> - Delete single ad
 * DELETE /api/generate-ad?abGroup=<groupId> - Delete all variants in group
 * DELETE /api/generate-ad?productId=<productId> - Delete all ads for product
 *
 * PROVIDER RULES ENFORCED:
 *
 * // GEMINI_ONLY: Google Gemini is the only image generation provider
 * // Model: gemini-3.1-flash-image-preview
 * // Cost: $0.067/image standard, $0.034/image batch
 *
 * // NO_FAL: fal.ai completely removed from pipeline
 * // No Bria RMBG, no FLUX, no Nano Banana
 *
 * // NO_BACKGROUND_REMOVAL: Gemini handles product integration natively
 * // Using original Shopify product images directly
 *
 * // ZERO_HALLUCINATION: Product image always from Shopify.
 * // AI generates SCENE only. Empty center zone is explicit in every prompt.
 *
 * // CLAUDE_COPY: All copy and Brand DNA via Claude Sonnet 4.6.
 * // Raw HTTP fetch only. No Anthropic SDK — Cloudflare Workers.
 *
 * // GPT_VISION_ONLY: OpenAI GPT-4o-mini used ONLY for product image to JSON analysis.
 * // detail: low, strict JSON schema mode.
 *
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads.
 * // Before that always 3 variants, no exceptions.
 *
 * // PARALLEL: Image gen and copy gen always run in parallel via Promise.allSettled.
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';
import { runPipeline } from '../lib/pipeline';
import type { Env, ProductRecord, GenerateAdRequest } from '../lib/types';

// ===========================================
// POST HANDLER - GENERATE ADS
// ===========================================

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const body = await request.json() as GenerateAdRequest;
    const { productId, forceRegenerate } = body;

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get store from cookie or fallback
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get product from database
    const product = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ? AND store_id = ?'
    ).bind(productId, store.id).first<ProductRecord>();

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('[API] Starting ad generation for:', {
      productId: product.id,
      title: product.title,
      storeId: store.id
    });

    // Run the modular compositing pipeline
    const result = await runPipeline(product, env);

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Pipeline failed' },
        { status: 500 }
      );
    }

    console.log('[API] Generation complete:', {
      variants: result.variants.length,
      phase: result.phase,
      abGroup: result.abGroup
    });

    return Response.json(result);

  } catch (error: any) {
    console.error('[API] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate ad' },
      { status: 500 }
    );
  }
};

// ===========================================
// GET HANDLER - GET AD STATUS
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
      const result = await env.DB.prepare(`
        SELECT
          id, store_id, product_id, status,
          headline, primary_text, description, call_to_action,
          image_url, scene_image_url, product_image_url, composited_image_url,
          compositing_method, platform, format,
          ab_variant, ab_group,
          ai_rationale, is_challenger, generation_phase, confidence_level, brand_dna_version,
          created_at, updated_at
        FROM generated_ads
        WHERE ab_group = ? AND store_id = ?
        ORDER BY ab_variant
      `).bind(abGroup, store.id).all();

      return Response.json({
        success: true,
        abGroup,
        variants: result.results?.map(formatAdResponse) || []
      });
    }

    // Single ad lookup
    if (!adId) {
      return Response.json({ error: 'Ad ID or abGroup required' }, { status: 400 });
    }

    const ad = await env.DB.prepare(`
      SELECT
        id, store_id, product_id, status,
        headline, primary_text, description, call_to_action,
        image_url, scene_image_url, product_image_url, composited_image_url,
        compositing_method, platform, format,
        ab_variant, ab_group,
        ai_rationale, is_challenger, generation_phase, confidence_level, brand_dna_version,
        created_at, updated_at
      FROM generated_ads
      WHERE id = ? AND store_id = ?
    `).bind(adId, store.id).first();

    if (!ad) {
      return Response.json({ error: 'Ad not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      ad: formatAdResponse(ad)
    });

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// ===========================================
// DELETE HANDLER - DELETE ADS
// ===========================================

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const adId = url.searchParams.get('id');
  const abGroup = url.searchParams.get('abGroup');
  const productId = url.searchParams.get('productId');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Delete by A/B group (all variants)
    if (abGroup) {
      const ads = await env.DB.prepare(
        'SELECT id, scene_image_url, composited_image_url FROM generated_ads WHERE ab_group = ? AND store_id = ?'
      ).bind(abGroup, store.id).all();

      if (!ads.results?.length) {
        return Response.json({ error: 'No ads found in group' }, { status: 404 });
      }

      // Delete from database
      await env.DB.prepare(
        'DELETE FROM generated_ads WHERE ab_group = ? AND store_id = ?'
      ).bind(abGroup, store.id).run();

      // Clean up R2 images
      await deleteAdImages(ads.results, env);

      console.log('[API] Deleted A/B group:', abGroup, 'count:', ads.results.length);

      return Response.json({
        success: true,
        message: `Deleted ${ads.results.length} ads in group ${abGroup}`,
        deletedCount: ads.results.length
      });
    }

    // Delete all ads for a product
    if (productId) {
      const ads = await env.DB.prepare(
        'SELECT id, scene_image_url, composited_image_url FROM generated_ads WHERE product_id = ? AND store_id = ?'
      ).bind(productId, store.id).all();

      if (!ads.results?.length) {
        return Response.json({ error: 'No ads found for product' }, { status: 404 });
      }

      // Delete from database
      await env.DB.prepare(
        'DELETE FROM generated_ads WHERE product_id = ? AND store_id = ?'
      ).bind(productId, store.id).run();

      // Clean up R2 images
      await deleteAdImages(ads.results, env);

      console.log('[API] Deleted ads for product:', productId, 'count:', ads.results.length);

      return Response.json({
        success: true,
        message: `Deleted ${ads.results.length} ads for product`,
        deletedCount: ads.results.length
      });
    }

    // Delete single ad by ID
    if (!adId) {
      return Response.json({ error: 'Ad ID, abGroup, or productId required' }, { status: 400 });
    }

    const ad = await env.DB.prepare(
      'SELECT id, scene_image_url, composited_image_url FROM generated_ads WHERE id = ? AND store_id = ?'
    ).bind(adId, store.id).first();

    if (!ad) {
      return Response.json({ error: 'Ad not found' }, { status: 404 });
    }

    // Delete from database
    await env.DB.prepare(
      'DELETE FROM generated_ads WHERE id = ? AND store_id = ?'
    ).bind(adId, store.id).run();

    // Clean up R2 images
    await deleteAdImages([ad], env);

    console.log('[API] Deleted ad:', adId);

    return Response.json({
      success: true,
      message: `Deleted ad ${adId}`,
      deletedCount: 1
    });

  } catch (error: any) {
    console.error('[API] Delete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

/**
 * Delete ad images from R2 storage.
 */
async function deleteAdImages(ads: any[], env: Env): Promise<void> {
  const keysToDelete: string[] = [];

  for (const ad of ads) {
    // Extract R2 keys from URLs
    if (ad.scene_image_url?.includes('key=')) {
      const key = decodeURIComponent(ad.scene_image_url.split('key=')[1]);
      keysToDelete.push(key);
    }
    if (ad.composited_image_url?.includes('key=') && ad.composited_image_url !== ad.scene_image_url) {
      const key = decodeURIComponent(ad.composited_image_url.split('key=')[1]);
      keysToDelete.push(key);
    }
  }

  // Delete from R2 in parallel
  if (keysToDelete.length > 0) {
    await Promise.allSettled(
      keysToDelete.map(key => env.R2.delete(key))
    );
    console.log('[API] Deleted', keysToDelete.length, 'images from R2');
  }
}

// ===========================================
// RESPONSE FORMATTING
// ===========================================

/**
 * Format database record to API response format.
 */
function formatAdResponse(record: any): any {
  return {
    id: record.id,
    storeId: record.store_id,
    productId: record.product_id,
    status: record.status,
    headline: record.headline,
    primaryText: record.primary_text,
    description: record.description,
    callToAction: record.call_to_action,
    imageUrl: record.image_url,
    sceneImageUrl: record.scene_image_url,
    productImageUrl: record.product_image_url,
    compositedImageUrl: record.composited_image_url,
    compositingMethod: record.compositing_method,
    platform: record.platform,
    format: record.format,
    variant: record.ab_variant,
    abGroup: record.ab_group,
    aiRationale: record.ai_rationale,
    isChallenger: !!record.is_challenger,
    generationPhase: record.generation_phase,
    confidenceLevel: record.confidence_level,
    brandDnaVersion: record.brand_dna_version,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}
