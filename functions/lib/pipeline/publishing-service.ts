/**
 * Publishing Service
 *
 * Handles publishing ads to platforms (TikTok, Meta).
 * Uses the provider pattern to abstract platform-specific logic.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { PublishRequest, PublishResult, AdTargeting, Platform } from './types';
import { getPlatformProvider, type ProviderEnv, type AdCreativePayload } from '../providers';

// ===========================================
// TYPES
// ===========================================

interface PublishJobRecord {
  id: string;
  store_id: string;
  ad_id: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

interface GeneratedAdRecord {
  id: string;
  store_id: string;
  product_id: string;
  headline: string;
  primary_text: string;
  description: string | null;
  call_to_action: string;
  image_url: string | null;
  platform: string;
  format: string;
}

interface PlatformConnectionRecord {
  id: string;
  store_id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
  status: string;
}

interface PublishingEnv extends ProviderEnv {
  DB: D1Database;
}

// ===========================================
// PUBLISHING SERVICE
// ===========================================

export class PublishingService {
  private db: D1Database;
  private env: PublishingEnv;

  constructor(env: PublishingEnv) {
    this.db = env.DB;
    this.env = env;
  }

  /**
   * Queue an ad for publishing to a platform.
   * Creates a publish job record that will be processed async.
   */
  async queuePublish(params: {
    adId: string;
    storeId: string;
    platform: 'tiktok' | 'meta';
    adAccountId?: string;
    budget?: { type: 'daily' | 'lifetime'; amount: number };
    targeting?: AdTargeting;
    campaignName?: string;
  }): Promise<{ jobId: string; status: 'queued' }> {
    const jobId = crypto.randomUUID();

    await this.db.prepare(`
      INSERT INTO publish_jobs (
        id, store_id, ad_id, platform, status, attempts, max_attempts, created_at
      ) VALUES (?, ?, ?, ?, 'pending', 0, 3, datetime('now'))
    `).bind(
      jobId,
      params.storeId,
      params.adId,
      params.platform
    ).run();

    console.log(`[PUBLISH] Queued job ${jobId} for ad ${params.adId} on ${params.platform}`);

    return { jobId, status: 'queued' };
  }

  /**
   * Process a single publish job.
   * Called by the job processor or can be called directly for immediate publishing.
   */
  async processJob(jobId: string): Promise<PublishResult> {
    // Get the job
    const job = await this.db.prepare(
      'SELECT * FROM publish_jobs WHERE id = ?'
    ).bind(jobId).first<PublishJobRecord>();

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status === 'completed') {
      return { success: true, publishedAdId: jobId };
    }

    // Mark as processing
    await this.db.prepare(`
      UPDATE publish_jobs
      SET status = 'processing', attempts = attempts + 1
      WHERE id = ?
    `).bind(jobId).run();

    try {
      // Get the ad
      const ad = await this.db.prepare(
        'SELECT * FROM generated_ads WHERE id = ?'
      ).bind(job.ad_id).first<GeneratedAdRecord>();

      if (!ad) {
        throw new Error('Ad not found');
      }

      // Get platform connection
      const connection = await this.db.prepare(`
        SELECT * FROM platform_connections
        WHERE store_id = ? AND platform = ? AND status = 'active'
      `).bind(job.store_id, job.platform).first<PlatformConnectionRecord>();

      if (!connection) {
        throw new Error(`No active ${job.platform} connection found`);
      }

      // Get the provider
      const provider = getPlatformProvider(job.platform as 'tiktok' | 'meta', this.env);

      // Build creative payload
      const creative: AdCreativePayload = {
        headline: ad.headline,
        primaryText: ad.primary_text,
        description: ad.description || undefined,
        callToAction: ad.call_to_action,
        imageUrl: ad.image_url || '',
        landingPageUrl: '', // TODO: Get from product or campaign
        format: (ad.format as 'square' | 'portrait' | 'landscape' | 'story') || 'square',
      };

      // Publish to platform
      const result = await provider.publishAd({
        accessToken: connection.access_token,
        adAccountId: connection.account_id || '',
        creative,
        // TODO: Get these from the job metadata
        // targeting: params.targeting,
        // budget: params.budget,
        // campaignName: params.campaignName,
      });

      if (result.success) {
        // Update job status
        await this.db.prepare(`
          UPDATE publish_jobs
          SET status = 'completed', processed_at = datetime('now')
          WHERE id = ?
        `).bind(jobId).run();

        // Create published_ads record
        await this.db.prepare(`
          INSERT INTO published_ads (
            id, store_id, ad_id, connection_id, ad_account_id,
            platform, platform_ad_id, platform_adset_id,
            platform_campaign_id, status, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
        `).bind(
          result.publishedAdId || crypto.randomUUID(),
          job.store_id,
          job.ad_id,
          connection.id,
          connection.account_id || null,
          job.platform,
          result.platformAdId || null,
          result.platformAdsetId || null,
          result.platformCampaignId || null
        ).run();

        // Update ad status
        await this.db.prepare(`
          UPDATE generated_ads SET status = 'published', updated_at = datetime('now')
          WHERE id = ?
        `).bind(job.ad_id).run();

        console.log(`[PUBLISH] Successfully published ad ${job.ad_id} to ${job.platform}`);
      }

      return result;
    } catch (error: any) {
      console.error(`[PUBLISH] Failed to process job ${jobId}:`, error);

      // Update job with error
      const shouldRetry = job.attempts < job.max_attempts;

      await this.db.prepare(`
        UPDATE publish_jobs
        SET status = ?, last_error = ?, processed_at = datetime('now')
        WHERE id = ?
      `).bind(
        shouldRetry ? 'pending' : 'failed',
        error.message || 'Unknown error',
        jobId
      ).run();

      return {
        success: false,
        error: error.message || 'Publishing failed',
      };
    }
  }

  /**
   * Process all pending jobs for a store.
   * Returns the number of jobs processed.
   */
  async processPendingJobs(storeId?: string): Promise<{ processed: number; succeeded: number; failed: number }> {
    let query = 'SELECT id FROM publish_jobs WHERE status = \'pending\'';
    const bindings: string[] = [];

    if (storeId) {
      query += ' AND store_id = ?';
      bindings.push(storeId);
    }

    query += ' ORDER BY created_at ASC LIMIT 10';

    const jobs = await this.db.prepare(query).bind(...bindings).all<{ id: string }>();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs.results || []) {
      processed++;
      const result = await this.processJob(job.id);
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    console.log(`[PUBLISH] Processed ${processed} jobs: ${succeeded} succeeded, ${failed} failed`);

    return { processed, succeeded, failed };
  }

  /**
   * Get the status of a publish job.
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    attempts: number;
    lastError: string | null;
    processedAt: string | null;
  } | null> {
    const job = await this.db.prepare(
      'SELECT status, attempts, last_error, processed_at FROM publish_jobs WHERE id = ?'
    ).bind(jobId).first<PublishJobRecord>();

    if (!job) {
      return null;
    }

    return {
      status: job.status,
      attempts: job.attempts,
      lastError: job.last_error,
      processedAt: job.processed_at,
    };
  }

  /**
   * Pause a published ad.
   */
  async pauseAd(publishedAdId: string): Promise<{ success: boolean; error?: string }> {
    // Join published_ads with platform_connections to get everything in one query
    const data = await this.db.prepare(`
      SELECT
        pa.*,
        pc.access_token,
        pc.account_id as connection_account_id
      FROM published_ads pa
      JOIN platform_connections pc ON pa.connection_id = pc.id
      WHERE pa.id = ? AND pc.status = 'active'
    `).bind(publishedAdId).first<any>();

    if (!data) {
      return { success: false, error: 'Published ad or active connection not found' };
    }

    const provider = getPlatformProvider(data.platform, this.env);

    const result = await provider.pauseAd({
      accessToken: data.access_token,
      adAccountId: data.ad_account_id || data.connection_account_id || '',
      platformAdId: data.platform_ad_id,
    });

    if (result.success) {
      await this.db.prepare(`
        UPDATE published_ads SET status = 'paused', updated_at = datetime('now')
        WHERE id = ?
      `).bind(publishedAdId).run();
    }

    return result;
  }

  /**
   * Resume a paused ad.
   */
  async resumeAd(publishedAdId: string): Promise<{ success: boolean; error?: string }> {
    // Join published_ads with platform_connections to get everything in one query
    const data = await this.db.prepare(`
      SELECT
        pa.*,
        pc.access_token,
        pc.account_id as connection_account_id
      FROM published_ads pa
      JOIN platform_connections pc ON pa.connection_id = pc.id
      WHERE pa.id = ? AND pc.status = 'active'
    `).bind(publishedAdId).first<any>();

    if (!data) {
      return { success: false, error: 'Published ad or active connection not found' };
    }

    const provider = getPlatformProvider(data.platform, this.env);

    const result = await provider.resumeAd({
      accessToken: data.access_token,
      adAccountId: data.ad_account_id || data.connection_account_id || '',
      platformAdId: data.platform_ad_id,
    });

    if (result.success) {
      await this.db.prepare(`
        UPDATE published_ads SET status = 'active', updated_at = datetime('now')
        WHERE id = ?
      `).bind(publishedAdId).run();
    }

    return result;
  }
}
