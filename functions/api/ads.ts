/**
 * API endpoint for listing ads
 * GET /api/ads - Returns all ads for current store with mock performance data
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

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

    // Fetch all ads for this store
    const result = await env.DB.prepare(`
      SELECT
        ga.*,
        p.title as product_title,
        p.image_url as product_image
      FROM generated_ads ga
      LEFT JOIN products p ON ga.product_id = p.id
      WHERE ga.store_id = ?
      ORDER BY ga.created_at DESC
    `).bind(store.id).all();

    // Transform ads with mock data
    const ads = result.results.map((ad: any) => {
      const mockData = generateMockMetrics(ad.id);

      // Map status - the API uses 'inbox' but we need to show meaningful statuses
      let displayStatus = ad.status;
      if (ad.status === 'inbox') displayStatus = 'ready';

      return {
        id: ad.id,
        storeId: ad.store_id,
        productId: ad.product_id,
        title: ad.title || ad.ad_headline || 'Untitled Ad',
        headline: ad.ad_headline,
        primaryText: ad.ad_primary_text,
        description: ad.ad_description,
        cta: ad.ad_cta_button,
        imageUrl: ad.thumbnail_url || ad.product_image,
        status: displayStatus,
        format: ad.video_style === 'static_image' ? 'static' : 'carousel',
        creativeStrategy: ad.creative_strategy,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at,
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
