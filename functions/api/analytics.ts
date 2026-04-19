/**
 * Analytics API - Performance metrics
 * GET /api/analytics - Get store analytics summary
 * GET /api/analytics/daily - Get daily breakdown
 * GET /api/analytics/platforms - Get platform breakdown
 * GET /api/analytics/ads - Get ad performance
 * GET /api/analytics/campaigns - Get campaign performance
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

interface Env {
  DB: D1Database;
}

// GET /api/analytics
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '30');
  const type = url.searchParams.get('type') || 'summary';
  const platform = url.searchParams.get('platform');
  const campaignId = url.searchParams.get('campaign');
  const adId = url.searchParams.get('ad');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    switch (type) {
      case 'daily':
        return getDailyAnalytics(env.DB, store.id, startDateStr, platform);

      case 'platforms':
        return getPlatformAnalytics(env.DB, store.id, startDateStr);

      case 'ads':
        return getAdAnalytics(env.DB, store.id, startDateStr, adId);

      case 'campaigns':
        return getCampaignAnalytics(env.DB, store.id, startDateStr, campaignId);

      default:
        return getSummaryAnalytics(env.DB, store.id, startDateStr, days);
    }
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// Summary analytics
async function getSummaryAnalytics(db: D1Database, storeId: string, startDate: string, days: number) {
  // Get aggregated metrics
  const summary = await db.prepare(`
    SELECT
      COALESCE(SUM(spend), 0) as total_spend,
      COALESCE(SUM(revenue), 0) as total_revenue,
      COALESCE(SUM(impressions), 0) as total_impressions,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(conversions), 0) as total_conversions,
      COALESCE(SUM(orders), 0) as total_orders
    FROM analytics_daily
    WHERE store_id = ? AND date >= ?
  `).bind(storeId, startDate).first();

  const totalSpend = (summary as any)?.total_spend || 0;
  const totalRevenue = (summary as any)?.total_revenue || 0;
  const totalImpressions = (summary as any)?.total_impressions || 0;
  const totalClicks = (summary as any)?.total_clicks || 0;
  const totalConversions = (summary as any)?.total_conversions || 0;

  // Calculate derived metrics
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const profit = totalRevenue - totalSpend;

  // Get previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const prevEndDate = startDate;

  const prevSummary = await db.prepare(`
    SELECT
      COALESCE(SUM(spend), 0) as total_spend,
      COALESCE(SUM(revenue), 0) as total_revenue,
      COALESCE(SUM(conversions), 0) as total_conversions
    FROM analytics_daily
    WHERE store_id = ? AND date >= ? AND date < ?
  `).bind(storeId, prevStartDate.toISOString().split('T')[0], prevEndDate).first();

  const prevRevenue = (prevSummary as any)?.total_revenue || 0;
  const prevConversions = (prevSummary as any)?.total_conversions || 0;

  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const conversionsChange = prevConversions > 0 ? ((totalConversions - prevConversions) / prevConversions) * 100 : 0;

  return Response.json({
    success: true,
    period: { days, startDate },
    metrics: {
      spend: totalSpend,
      revenue: totalRevenue,
      profit,
      roas: Math.round(roas * 100) / 100,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: Math.round(ctr * 100) / 100,
      conversions: totalConversions,
      cpa: Math.round(cpa * 100) / 100,
      orders: (summary as any)?.total_orders || 0,
    },
    changes: {
      revenue: Math.round(revenueChange * 10) / 10,
      conversions: Math.round(conversionsChange * 10) / 10,
    },
  });
}

// Daily breakdown
async function getDailyAnalytics(db: D1Database, storeId: string, startDate: string, platform?: string | null) {
  let query: string;
  let params: any[];

  if (platform) {
    query = `
      SELECT date, spend, revenue, roas, impressions, clicks, ctr, conversions, cpa
      FROM analytics_platform_daily
      WHERE store_id = ? AND platform = ? AND date >= ?
      ORDER BY date ASC
    `;
    params = [storeId, platform, startDate];
  } else {
    query = `
      SELECT date, spend, revenue, roas, impressions, clicks, ctr, conversions, cpa, orders
      FROM analytics_daily
      WHERE store_id = ? AND date >= ?
      ORDER BY date ASC
    `;
    params = [storeId, startDate];
  }

  const result = await db.prepare(query).bind(...params).all();

  return Response.json({
    success: true,
    platform: platform || 'all',
    dailyData: result.results.map((row: any) => ({
      date: row.date,
      spend: row.spend,
      revenue: row.revenue,
      roas: row.roas,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      conversions: row.conversions,
      cpa: row.cpa,
      orders: row.orders,
    })),
  });
}

// Platform breakdown
async function getPlatformAnalytics(db: D1Database, storeId: string, startDate: string) {
  const result = await db.prepare(`
    SELECT
      platform,
      COALESCE(SUM(spend), 0) as spend,
      COALESCE(SUM(revenue), 0) as revenue,
      COALESCE(SUM(impressions), 0) as impressions,
      COALESCE(SUM(clicks), 0) as clicks,
      COALESCE(SUM(conversions), 0) as conversions
    FROM analytics_platform_daily
    WHERE store_id = ? AND date >= ?
    GROUP BY platform
    ORDER BY revenue DESC
  `).bind(storeId, startDate).all();

  const totalRevenue = result.results.reduce((sum: number, r: any) => sum + r.revenue, 0);

  return Response.json({
    success: true,
    platforms: result.results.map((row: any) => ({
      platform: row.platform,
      spend: row.spend,
      revenue: row.revenue,
      roas: row.spend > 0 ? Math.round((row.revenue / row.spend) * 100) / 100 : 0,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 10000) / 100 : 0,
      conversions: row.conversions,
      cpa: row.conversions > 0 ? Math.round((row.spend / row.conversions) * 100) / 100 : 0,
      percentage: totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0,
    })),
  });
}

// Ad performance
async function getAdAnalytics(db: D1Database, storeId: string, startDate: string, adId?: string | null) {
  let query: string;
  let params: any[];

  if (adId) {
    // Single ad performance over time
    query = `
      SELECT ap.date, ap.spend, ap.revenue, ap.roas, ap.impressions, ap.clicks, ap.ctr, ap.conversions, ap.cpa
      FROM ad_performance ap
      JOIN generated_ads ga ON ap.ad_id = ga.id
      WHERE ga.store_id = ? AND ap.ad_id = ? AND ap.date >= ?
      ORDER BY ap.date ASC
    `;
    params = [storeId, adId, startDate];
  } else {
    // Top performing ads
    query = `
      SELECT
        ga.id,
        ga.headline,
        ga.image_url,
        ga.platform,
        ga.status,
        COALESCE(SUM(ap.spend), 0) as spend,
        COALESCE(SUM(ap.revenue), 0) as revenue,
        COALESCE(SUM(ap.impressions), 0) as impressions,
        COALESCE(SUM(ap.clicks), 0) as clicks,
        COALESCE(SUM(ap.conversions), 0) as conversions
      FROM generated_ads ga
      LEFT JOIN ad_performance ap ON ga.id = ap.ad_id AND ap.date >= ?
      WHERE ga.store_id = ?
      GROUP BY ga.id
      ORDER BY revenue DESC
      LIMIT 20
    `;
    params = [startDate, storeId];
  }

  const result = await db.prepare(query).bind(...params).all();

  if (adId) {
    return Response.json({
      success: true,
      adId,
      dailyData: result.results,
    });
  }

  return Response.json({
    success: true,
    ads: result.results.map((row: any) => ({
      id: row.id,
      headline: row.headline,
      imageUrl: row.image_url,
      platform: row.platform,
      status: row.status,
      spend: row.spend,
      revenue: row.revenue,
      roas: row.spend > 0 ? Math.round((row.revenue / row.spend) * 100) / 100 : 0,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 10000) / 100 : 0,
      conversions: row.conversions,
    })),
  });
}

// Campaign performance
async function getCampaignAnalytics(db: D1Database, storeId: string, startDate: string, campaignId?: string | null) {
  let query: string;
  let params: any[];

  if (campaignId) {
    // Single campaign performance over time
    query = `
      SELECT date, spend, revenue, roas, impressions, clicks, ctr, conversions, cpa
      FROM campaign_performance
      WHERE campaign_id = ? AND date >= ?
      ORDER BY date ASC
    `;
    params = [campaignId, startDate];
  } else {
    // All campaigns summary
    query = `
      SELECT
        c.id,
        c.name,
        c.status,
        c.platforms,
        COALESCE(SUM(cp.spend), 0) as spend,
        COALESCE(SUM(cp.revenue), 0) as revenue,
        COALESCE(SUM(cp.impressions), 0) as impressions,
        COALESCE(SUM(cp.clicks), 0) as clicks,
        COALESCE(SUM(cp.conversions), 0) as conversions
      FROM campaigns c
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id AND cp.date >= ?
      WHERE c.store_id = ?
      GROUP BY c.id
      ORDER BY revenue DESC
    `;
    params = [startDate, storeId];
  }

  const result = await db.prepare(query).bind(...params).all();

  if (campaignId) {
    return Response.json({
      success: true,
      campaignId,
      dailyData: result.results,
    });
  }

  return Response.json({
    success: true,
    campaigns: result.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      platforms: row.platforms ? JSON.parse(row.platforms) : [],
      spend: row.spend,
      revenue: row.revenue,
      roas: row.spend > 0 ? Math.round((row.revenue / row.spend) * 100) / 100 : 0,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 10000) / 100 : 0,
      conversions: row.conversions,
    })),
  });
}
