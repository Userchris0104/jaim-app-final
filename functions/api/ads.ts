/**
 * API endpoint for listing ads
 * GET /api/ads - Returns all ads for current store with mock performance data
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';
import { getTemplateById } from '../lib/fashionTemplates';

interface Env {
  DB: D1Database;
}

// Mock campaigns for demo
const MOCK_CAMPAIGNS = [
  { id: 'camp_1', name: 'Summer Sale 2024' },
  { id: 'camp_2', name: 'New Arrivals' },
  { id: 'camp_3', name: 'Holiday Promo' },
  { id: 'camp_4', name: 'Flash Sale' },
  { id: 'camp_5', name: 'Brand Awareness' },
];

// Mock platforms
const PLATFORMS = ['tiktok', 'instagram', 'facebook'] as const;

// Generate mock performance metrics
function generateMockMetrics(adId: string) {
  // Use adId as seed for consistent random values
  const seed = adId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * (min + 1)) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const roas = random(0.5, 6.5);
  const revenue = random(100, 15000);
  const clicks = Math.floor(random(50, 5000));
  const impressions = clicks * random(15, 40);
  const ctr = (clicks / impressions) * 100;

  // Assign 1-3 random platforms
  const numPlatforms = Math.floor(random(1, 4));
  const shuffledPlatforms = [...PLATFORMS].sort(() => random(0, 1) - 0.5);
  const platforms = shuffledPlatforms.slice(0, numPlatforms);

  // Assign a random campaign
  const campaign = MOCK_CAMPAIGNS[Math.floor(random(0, MOCK_CAMPAIGNS.length))];

  return {
    roas: Math.round(roas * 10) / 10,
    revenue: Math.round(revenue * 100) / 100,
    clicks,
    ctr: Math.round(ctr * 100) / 100,
    impressions: Math.floor(impressions),
    platforms,
    campaign,
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    // Get current store from cookie
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({
        success: true,
        ads: [],
        total: 0,
        campaigns: [],
      });
    }

    // Get full store record with colors
    const storeRecord = await env.DB.prepare(
      'SELECT store_name, primary_color, accent_color FROM stores WHERE id = ?'
    ).bind(store.id).first<{ store_name: string | null; primary_color: string | null; accent_color: string | null }>();

    const storeName = storeRecord?.store_name || store.store_name || 'Brand';
    const primaryColor = storeRecord?.primary_color || '#1a1a1a';
    const accentColor = storeRecord?.accent_color || '#1a1a1a';

    // Fetch all ads for this store
    const result = await env.DB.prepare(`
      SELECT
        ga.*,
        p.title as product_title,
        p.image_url as product_image,
        p.clean_image_url as clean_product_image
      FROM generated_ads ga
      LEFT JOIN products p ON ga.product_id = p.id
      WHERE ga.store_id = ?
      ORDER BY ga.created_at DESC
    `).bind(store.id).all();

    // Transform ads with mock data
    const ads = result.results.map((ad: any) => {
      const mockData = generateMockMetrics(ad.id);

      // Map status - normalize various status values
      let displayStatus = ad.status;
      if (ad.status === 'inbox') displayStatus = 'ready';
      if (ad.status === 'generating') displayStatus = 'processing';

      // Handle both old schema (ad_headline, thumbnail_url) and new schema (headline, image_url)
      const headline = ad.headline || ad.ad_headline || 'Untitled Ad';
      const imageUrl = ad.image_url || ad.thumbnail_url || ad.product_image;
      const format = ad.format === 'square' || ad.video_style === 'static_image' ? 'static' : 'carousel';

      // Build text overlay data from template
      let textOverlay = null;
      if (ad.template_id) {
        const template = getTemplateById(ad.template_id);
        if (template?.textConfig) {
          textOverlay = {
            brandName: storeName,
            headline: headline,
            cta: ad.call_to_action || 'Shop Now',
            theme: template.textConfig.overlayTheme || 'light-on-dark',
            primaryColor: primaryColor,
            accentColor: accentColor,
          };
        }
      }

      return {
        id: ad.id,
        storeId: ad.store_id,
        productId: ad.product_id,
        title: ad.product_title || headline,
        headline: headline,
        primaryText: ad.primary_text || ad.ad_primary_text,
        description: ad.description || ad.ad_description,
        cta: ad.call_to_action || ad.ad_cta_button,
        imageUrl: imageUrl,
        // Compositing data for CSS overlay
        sceneImageUrl: ad.scene_image_url,
        // Use clean (background-removed) product image for CSS overlay when available
        productImageUrl: ad.clean_product_image || ad.product_image_url,
        compositedImageUrl: ad.composited_image_url,
        compositingMethod: ad.compositing_method || 'none',
        // A/B Testing
        abVariant: ad.ab_variant || null,
        abGroup: ad.ab_group || null,
        status: displayStatus,
        format: format,
        creativeStrategy: ad.creative_strategy,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at,
        // Creative evolution metadata
        aiRationale: ad.ai_rationale || null,
        isChallenger: ad.is_challenger === 1,
        generationPhase: ad.generation_phase || null,
        confidenceLevel: ad.confidence_level || null,
        variantType: ad.variant_type_used || null,
        atmosphereUsed: ad.atmosphere_used || null,
        surfaceUsed: ad.surface_used || null,
        isStyleRotation: ad.is_style_rotation === 1,
        isStyleExperiment: ad.is_style_experiment === 1,
        // Text overlay for client-side rendering
        textOverlay,
        // Mock performance data
        ...mockData,
      };
    });

    // Extract unique campaigns from ads
    const uniqueCampaigns = Array.from(
      new Map(ads.map((ad: any) => [ad.campaign.id, ad.campaign])).values()
    );

    return Response.json({
      success: true,
      ads,
      total: ads.length,
      campaigns: uniqueCampaigns,
    });
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch ads' },
      { status: 500 }
    );
  }
};
