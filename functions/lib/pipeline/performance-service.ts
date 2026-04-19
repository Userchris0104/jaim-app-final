/**
 * Performance Sync Service
 *
 * Syncs performance data from platforms (TikTok, Meta) to our database.
 * Calculates derived metrics (ROAS, CTR, CPA) and aggregates by day/platform.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getPlatformProvider, type ProviderEnv, type AdPerformanceResponse } from '../providers';

// ===========================================
// TYPES
// ===========================================

interface PublishedAdRecord {
  id: string;
  store_id: string;
  ad_id: string;
  platform: 'tiktok' | 'meta';
  platform_ad_id: string;
  status: string;
}

interface PlatformConnectionRecord {
  id: string;
  store_id: string;
  platform: string;
  access_token: string;
  account_id: string | null;
  status: string;
}

interface SyncResult {
  platform: string;
  adsProcessed: number;
  recordsCreated: number;
  errors: string[];
}

interface PerformanceEnv extends ProviderEnv {
  DB: D1Database;
}

// ===========================================
// PERFORMANCE SERVICE
// ===========================================

export class PerformanceService {
  private db: D1Database;
  private env: PerformanceEnv;

  constructor(env: PerformanceEnv) {
    this.db = env.DB;
    this.env = env;
  }

  /**
   * Sync performance data for all active ads in a store.
   * Defaults to last 7 days if no date range specified.
   */
  async syncStore(params: {
    storeId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Default to last 7 days
    const endDate = params.endDate || new Date().toISOString().split('T')[0];
    const startDate = params.startDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    })();

    // Get platform connections
    const connections = await this.db.prepare(`
      SELECT * FROM platform_connections
      WHERE store_id = ? AND status = 'active'
    `).bind(params.storeId).all<PlatformConnectionRecord>();

    for (const connection of connections.results || []) {
      const result = await this.syncPlatform({
        storeId: params.storeId,
        platform: connection.platform as 'tiktok' | 'meta',
        accessToken: connection.access_token,
        adAccountId: connection.account_id || '',
        startDate,
        endDate,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Sync performance data for a specific platform.
   */
  async syncPlatform(params: {
    storeId: string;
    platform: 'tiktok' | 'meta';
    accessToken: string;
    adAccountId: string;
    startDate: string;
    endDate: string;
  }): Promise<SyncResult> {
    const result: SyncResult = {
      platform: params.platform,
      adsProcessed: 0,
      recordsCreated: 0,
      errors: [],
    };

    try {
      // Get published ads for this platform
      const publishedAds = await this.db.prepare(`
        SELECT * FROM published_ads
        WHERE store_id = ? AND platform = ? AND status IN ('active', 'paused')
      `).bind(params.storeId, params.platform).all<PublishedAdRecord>();

      if (!publishedAds.results?.length) {
        console.log(`[PERF_SYNC] No published ads for ${params.platform}`);
        return result;
      }

      const platformAdIds = publishedAds.results
        .map((ad: PublishedAdRecord) => ad.platform_ad_id)
        .filter(Boolean) as string[];

      if (!platformAdIds.length) {
        console.log(`[PERF_SYNC] No platform ad IDs for ${params.platform}`);
        return result;
      }

      // Get the provider
      const provider = getPlatformProvider(params.platform, this.env);

      // Fetch performance data
      const perfData = await provider.getAdPerformance({
        accessToken: params.accessToken,
        adAccountId: params.adAccountId,
        platformAdIds,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      // Map platform ad IDs to our published ad records
      const adIdMap = new Map<string, PublishedAdRecord>();
      for (const ad of publishedAds.results) {
        adIdMap.set(ad.platform_ad_id, ad);
      }

      // Process and store performance data
      for (const perf of perfData) {
        const publishedAd = adIdMap.get(perf.platformAdId);
        if (!publishedAd) continue;

        result.adsProcessed++;

        try {
          await this.upsertAdPerformance({
            publishedAdId: publishedAd.id,
            adId: publishedAd.ad_id,
            storeId: params.storeId,
            platform: params.platform,
            date: perf.date,
            spend: perf.spend,
            impressions: perf.impressions,
            clicks: perf.clicks,
            conversions: perf.conversions,
            revenue: perf.revenue,
            videoViews: perf.videoViews,
            videoWatchTime: perf.videoWatchTime,
          });
          result.recordsCreated++;
        } catch (error: any) {
          result.errors.push(`Ad ${publishedAd.id}: ${error.message}`);
        }
      }

      // Update platform daily aggregates
      await this.updateDailyAggregates({
        storeId: params.storeId,
        platform: params.platform,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      console.log(
        `[PERF_SYNC] ${params.platform}: ${result.adsProcessed} ads, ${result.recordsCreated} records`
      );
    } catch (error: any) {
      console.error(`[PERF_SYNC] Error syncing ${params.platform}:`, error);
      result.errors.push(error.message || 'Unknown error');
    }

    return result;
  }

  /**
   * Upsert a single ad performance record.
   * Calculates derived metrics (CTR, ROAS, CPA).
   */
  private async upsertAdPerformance(params: {
    publishedAdId: string;
    adId: string;
    storeId: string;
    platform: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    videoViews?: number;
    videoWatchTime?: number;
  }): Promise<void> {
    // Calculate derived metrics
    const ctr = params.impressions > 0 ? (params.clicks / params.impressions) * 100 : 0;
    const roas = params.spend > 0 ? params.revenue / params.spend : 0;
    const cpa = params.conversions > 0 ? params.spend / params.conversions : 0;
    const videoCompletionRate = params.videoViews && params.impressions > 0
      ? (params.videoViews / params.impressions) * 100
      : null;

    // Upsert record (SQLite UPSERT) - unique constraint is on (ad_id, date)
    await this.db.prepare(`
      INSERT INTO ad_performance (
        id, published_ad_id, ad_id, date, platform,
        spend, revenue, roas, impressions, clicks, ctr,
        conversions, cpa, video_views, video_watch_time, video_completion_rate,
        created_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        datetime('now')
      )
      ON CONFLICT (ad_id, date) DO UPDATE SET
        published_ad_id = excluded.published_ad_id,
        platform = excluded.platform,
        spend = excluded.spend,
        revenue = excluded.revenue,
        roas = excluded.roas,
        impressions = excluded.impressions,
        clicks = excluded.clicks,
        ctr = excluded.ctr,
        conversions = excluded.conversions,
        cpa = excluded.cpa,
        video_views = excluded.video_views,
        video_watch_time = excluded.video_watch_time,
        video_completion_rate = excluded.video_completion_rate
    `).bind(
      crypto.randomUUID(),
      params.publishedAdId,
      params.adId,
      params.date,
      params.platform,
      params.spend,
      params.revenue,
      roas,
      params.impressions,
      params.clicks,
      ctr,
      params.conversions,
      cpa,
      params.videoViews || null,
      params.videoWatchTime || null,
      videoCompletionRate
    ).run();
  }

  /**
   * Update daily platform aggregates from individual ad performance.
   */
  private async updateDailyAggregates(params: {
    storeId: string;
    platform: string;
    startDate: string;
    endDate: string;
  }): Promise<void> {
    // Aggregate ad performance by date
    const aggregates = await this.db.prepare(`
      SELECT
        date,
        SUM(spend) as total_spend,
        SUM(revenue) as total_revenue,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions
      FROM ad_performance
      WHERE published_ad_id IN (
        SELECT id FROM published_ads WHERE store_id = ? AND platform = ?
      )
      AND date BETWEEN ? AND ?
      GROUP BY date
    `).bind(
      params.storeId,
      params.platform,
      params.startDate,
      params.endDate
    ).all<{
      date: string;
      total_spend: number;
      total_revenue: number;
      total_impressions: number;
      total_clicks: number;
      total_conversions: number;
    }>();

    for (const agg of aggregates.results || []) {
      const ctr = agg.total_impressions > 0
        ? (agg.total_clicks / agg.total_impressions) * 100
        : 0;
      const roas = agg.total_spend > 0
        ? agg.total_revenue / agg.total_spend
        : 0;
      const cpa = agg.total_conversions > 0
        ? agg.total_spend / agg.total_conversions
        : 0;

      await this.db.prepare(`
        INSERT INTO analytics_platform_daily (
          id, store_id, platform, date,
          spend, revenue, roas, impressions, clicks, ctr,
          conversions, cpa, created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, datetime('now')
        )
        ON CONFLICT (store_id, platform, date) DO UPDATE SET
          spend = excluded.spend,
          revenue = excluded.revenue,
          roas = excluded.roas,
          impressions = excluded.impressions,
          clicks = excluded.clicks,
          ctr = excluded.ctr,
          conversions = excluded.conversions,
          cpa = excluded.cpa
      `).bind(
        crypto.randomUUID(),
        params.storeId,
        params.platform,
        agg.date,
        agg.total_spend,
        agg.total_revenue,
        roas,
        agg.total_impressions,
        agg.total_clicks,
        ctr,
        agg.total_conversions,
        cpa
      ).run();
    }
  }

  /**
   * Get performance summary for a store.
   */
  async getStoreSummary(params: {
    storeId: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    totalSpend: number;
    totalRevenue: number;
    totalRoas: number;
    totalImpressions: number;
    totalClicks: number;
    totalCtr: number;
    totalConversions: number;
    totalCpa: number;
    byPlatform: Record<string, {
      spend: number;
      revenue: number;
      roas: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }>;
  }> {
    const platformData = await this.db.prepare(`
      SELECT
        platform,
        SUM(spend) as spend,
        SUM(revenue) as revenue,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions
      FROM analytics_platform_daily
      WHERE store_id = ? AND date BETWEEN ? AND ?
      GROUP BY platform
    `).bind(
      params.storeId,
      params.startDate,
      params.endDate
    ).all<{
      platform: string;
      spend: number;
      revenue: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }>();

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    const byPlatform: Record<string, any> = {};

    for (const p of platformData.results || []) {
      totalSpend += p.spend;
      totalRevenue += p.revenue;
      totalImpressions += p.impressions;
      totalClicks += p.clicks;
      totalConversions += p.conversions;

      byPlatform[p.platform] = {
        spend: p.spend,
        revenue: p.revenue,
        roas: p.spend > 0 ? p.revenue / p.spend : 0,
        impressions: p.impressions,
        clicks: p.clicks,
        conversions: p.conversions,
      };
    }

    return {
      totalSpend,
      totalRevenue,
      totalRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      totalImpressions,
      totalClicks,
      totalCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalConversions,
      totalCpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      byPlatform,
    };
  }

  /**
   * Get daily performance trend for a store.
   */
  async getDailyTrend(params: {
    storeId: string;
    startDate: string;
    endDate: string;
    platform?: string;
  }): Promise<Array<{
    date: string;
    spend: number;
    revenue: number;
    roas: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>> {
    let query = `
      SELECT
        date,
        SUM(spend) as spend,
        SUM(revenue) as revenue,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(conversions) as conversions
      FROM analytics_platform_daily
      WHERE store_id = ? AND date BETWEEN ? AND ?
    `;

    const bindings: (string | number)[] = [params.storeId, params.startDate, params.endDate];

    if (params.platform) {
      query += ' AND platform = ?';
      bindings.push(params.platform);
    }

    query += ' GROUP BY date ORDER BY date ASC';

    interface DailyTrendRow {
      date: string;
      spend: number;
      revenue: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }

    const data = await this.db.prepare(query).bind(...bindings).all<DailyTrendRow>();

    return (data.results || []).map((row: DailyTrendRow) => ({
      date: row.date,
      spend: row.spend,
      revenue: row.revenue,
      roas: row.spend > 0 ? row.revenue / row.spend : 0,
      impressions: row.impressions,
      clicks: row.clicks,
      conversions: row.conversions,
    }));
  }
}
