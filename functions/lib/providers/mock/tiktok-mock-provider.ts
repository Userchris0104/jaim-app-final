/**
 * Mock TikTok Provider
 *
 * Simulates TikTok Ads API responses for local development.
 * Implements the same interface as the real provider so switching
 * between mock and real is a one-line config change.
 */

import type {
  PlatformProvider,
  TokenResponse,
  AdCreativePayload,
  AdStatusResponse,
  AdPerformanceResponse,
  AccountPerformanceResponse,
} from '../platform-provider';
import type { AdAccount, AdTargeting, PublishResult } from '../../pipeline/types';

// ===========================================
// MOCK DATA GENERATORS
// ===========================================

function generateMockId(prefix: string): string {
  return `${prefix}_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

// Simulate network delay
async function simulateLatency(minMs = 100, maxMs = 500): Promise<void> {
  const delay = randomBetween(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// ===========================================
// MOCK TIKTOK PROVIDER
// ===========================================

export class TikTokMockProvider implements PlatformProvider {
  readonly platform = 'tiktok' as const;
  readonly isMock = true;

  // Track mock state for consistent responses
  private mockAds: Map<string, { status: AdStatusResponse['status']; reviewStatus: AdStatusResponse['reviewStatus'] }> = new Map();

  // ===========================================
  // AUTHENTICATION
  // ===========================================

  getAuthUrl(params: {
    redirectUri: string;
    state: string;
    scopes?: string[];
  }): string {
    const scopes = params.scopes?.join(',') || 'ad.read,ad.write,analytics.read';
    return `https://business-api.tiktok.com/portal/auth?app_id=mock_app_id&redirect_uri=${encodeURIComponent(params.redirectUri)}&state=${params.state}&scope=${scopes}`;
  }

  async exchangeCode(params: {
    code: string;
    redirectUri: string;
  }): Promise<TokenResponse> {
    await simulateLatency(200, 400);

    // Simulate successful token exchange
    return {
      accessToken: `tiktok_mock_access_${Date.now()}`,
      refreshToken: `tiktok_mock_refresh_${Date.now()}`,
      expiresIn: 86400, // 24 hours
      tokenType: 'Bearer',
      scopes: ['ad.read', 'ad.write', 'analytics.read'],
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    await simulateLatency(150, 300);

    return {
      accessToken: `tiktok_mock_access_refreshed_${Date.now()}`,
      refreshToken: `tiktok_mock_refresh_${Date.now()}`,
      expiresIn: 86400,
      tokenType: 'Bearer',
      scopes: ['ad.read', 'ad.write', 'analytics.read'],
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    await simulateLatency(50, 150);

    // Mock tokens starting with 'tiktok_mock_' are always valid
    return accessToken.startsWith('tiktok_mock_');
  }

  // ===========================================
  // AD ACCOUNTS
  // ===========================================

  async getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    await simulateLatency(200, 400);

    // Return mock ad accounts
    return [
      {
        id: 'tiktok_acc_1',
        platformAccountId: '7123456789012345678',
        name: 'Main TikTok Ads Account',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        status: 'active',
        isPrimary: true,
      },
      {
        id: 'tiktok_acc_2',
        platformAccountId: '7234567890123456789',
        name: 'Secondary TikTok Account',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'active',
        isPrimary: false,
      },
    ];
  }

  async getAdAccount(accessToken: string, accountId: string): Promise<AdAccount | null> {
    await simulateLatency(100, 200);

    const accounts = await this.getAdAccounts(accessToken);
    return accounts.find((a) => a.id === accountId || a.platformAccountId === accountId) || null;
  }

  // ===========================================
  // AD PUBLISHING
  // ===========================================

  async publishAd(params: {
    accessToken: string;
    adAccountId: string;
    creative: AdCreativePayload;
    targeting?: AdTargeting;
    budget?: { type: 'daily' | 'lifetime'; amount: number };
    campaignName?: string;
  }): Promise<PublishResult> {
    await simulateLatency(500, 1000);

    // Generate mock IDs
    const platformCampaignId = generateMockId('campaign');
    const platformAdsetId = generateMockId('adgroup');
    const platformAdId = generateMockId('ad');

    // Store mock ad state
    this.mockAds.set(platformAdId, {
      status: 'pending',
      reviewStatus: 'pending_review',
    });

    // Simulate review approval after a delay (in real usage, would be a webhook)
    setTimeout(() => {
      const ad = this.mockAds.get(platformAdId);
      if (ad) {
        ad.status = 'active';
        ad.reviewStatus = 'approved';
      }
    }, 5000);

    console.log(`[MOCK_TIKTOK] Published ad: ${platformAdId}`);
    console.log(`[MOCK_TIKTOK] Campaign: ${params.campaignName || 'Untitled'}`);
    console.log(`[MOCK_TIKTOK] Budget: ${params.budget?.type} $${params.budget?.amount || 0}`);

    return {
      success: true,
      publishedAdId: generateMockId('published'),
      platformAdId,
      platformAdsetId,
      platformCampaignId,
      reviewStatus: 'pending_review',
    };
  }

  async pauseAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }> {
    await simulateLatency(200, 400);

    const ad = this.mockAds.get(params.platformAdId);
    if (ad) {
      ad.status = 'paused';
    }

    console.log(`[MOCK_TIKTOK] Paused ad: ${params.platformAdId}`);
    return { success: true };
  }

  async resumeAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }> {
    await simulateLatency(200, 400);

    const ad = this.mockAds.get(params.platformAdId);
    if (ad) {
      ad.status = 'active';
    }

    console.log(`[MOCK_TIKTOK] Resumed ad: ${params.platformAdId}`);
    return { success: true };
  }

  async deleteAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }> {
    await simulateLatency(200, 400);

    const ad = this.mockAds.get(params.platformAdId);
    if (ad) {
      ad.status = 'deleted';
    }

    console.log(`[MOCK_TIKTOK] Deleted ad: ${params.platformAdId}`);
    return { success: true };
  }

  async getAdStatus(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<AdStatusResponse> {
    await simulateLatency(100, 200);

    const ad = this.mockAds.get(params.platformAdId);

    if (ad) {
      return {
        platformAdId: params.platformAdId,
        status: ad.status,
        reviewStatus: ad.reviewStatus,
        deliveryStatus: ad.status === 'active' ? 'delivering' : 'not_delivering',
      };
    }

    // Default for unknown ads
    return {
      platformAdId: params.platformAdId,
      status: 'active',
      reviewStatus: 'approved',
      deliveryStatus: 'delivering',
    };
  }

  // ===========================================
  // PERFORMANCE DATA
  // ===========================================

  async getAdPerformance(params: {
    accessToken: string;
    adAccountId: string;
    platformAdIds: string[];
    startDate: string;
    endDate: string;
  }): Promise<AdPerformanceResponse[]> {
    await simulateLatency(300, 600);

    const results: AdPerformanceResponse[] = [];

    // Generate mock performance data for each ad and date
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    for (const adId of params.platformAdIds) {
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];

        // Generate realistic-ish metrics
        const impressions = randomBetween(1000, 50000);
        const clicks = Math.floor(impressions * randomFloat(0.01, 0.05));
        const conversions = Math.floor(clicks * randomFloat(0.02, 0.15));
        const spend = randomFloat(10, 200);
        const revenue = conversions * randomFloat(20, 100);

        results.push({
          platformAdId: adId,
          date: dateStr,
          spend,
          impressions,
          clicks,
          conversions,
          revenue,
          videoViews: Math.floor(impressions * randomFloat(0.3, 0.7)),
          videoWatchTime: randomBetween(1000, 10000),
        });

        current.setDate(current.getDate() + 1);
      }
    }

    console.log(`[MOCK_TIKTOK] Generated ${results.length} performance records`);
    return results;
  }

  async getAccountPerformance(params: {
    accessToken: string;
    adAccountId: string;
    startDate: string;
    endDate: string;
  }): Promise<AccountPerformanceResponse> {
    await simulateLatency(200, 400);

    // Generate aggregate metrics
    const impressions = randomBetween(50000, 500000);
    const clicks = Math.floor(impressions * randomFloat(0.01, 0.04));
    const conversions = Math.floor(clicks * randomFloat(0.02, 0.12));
    const spend = randomFloat(500, 5000);
    const revenue = conversions * randomFloat(25, 80);

    return {
      date: params.startDate,
      totalSpend: spend,
      totalImpressions: impressions,
      totalClicks: clicks,
      totalConversions: conversions,
      totalRevenue: revenue,
    };
  }
}

// Export singleton instance
export const tikTokMockProvider = new TikTokMockProvider();
