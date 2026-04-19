/**
 * Mock Meta Provider
 *
 * Simulates Meta (Facebook/Instagram) Ads API responses for local development.
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
// MOCK META PROVIDER
// ===========================================

export class MetaMockProvider implements PlatformProvider {
  readonly platform = 'meta' as const;
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
    const scopes = params.scopes?.join(',') || 'ads_management,ads_read,business_management';
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=mock_app_id&redirect_uri=${encodeURIComponent(params.redirectUri)}&state=${params.state}&scope=${scopes}`;
  }

  async exchangeCode(params: {
    code: string;
    redirectUri: string;
  }): Promise<TokenResponse> {
    await simulateLatency(200, 400);

    // Simulate successful token exchange
    return {
      accessToken: `meta_mock_access_${Date.now()}`,
      refreshToken: undefined, // Meta uses long-lived tokens, no refresh token
      expiresIn: 5184000, // 60 days for long-lived token
      tokenType: 'Bearer',
      scopes: ['ads_management', 'ads_read', 'business_management'],
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    await simulateLatency(150, 300);

    // Meta doesn't use refresh tokens - exchange for new long-lived token
    return {
      accessToken: `meta_mock_access_extended_${Date.now()}`,
      expiresIn: 5184000,
      tokenType: 'Bearer',
      scopes: ['ads_management', 'ads_read', 'business_management'],
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    await simulateLatency(50, 150);

    // Mock tokens starting with 'meta_mock_' are always valid
    return accessToken.startsWith('meta_mock_');
  }

  // ===========================================
  // AD ACCOUNTS
  // ===========================================

  async getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    await simulateLatency(200, 400);

    // Return mock ad accounts (Meta-style IDs are numeric)
    return [
      {
        id: 'meta_acc_1',
        platformAccountId: 'act_123456789012345',
        name: 'Primary Business Ad Account',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        status: 'active',
        isPrimary: true,
      },
      {
        id: 'meta_acc_2',
        platformAccountId: 'act_234567890123456',
        name: 'E-commerce Ad Account',
        currency: 'USD',
        timezone: 'America/New_York',
        status: 'active',
        isPrimary: false,
      },
      {
        id: 'meta_acc_3',
        platformAccountId: 'act_345678901234567',
        name: 'Instagram Promotions',
        currency: 'EUR',
        timezone: 'Europe/London',
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

    // Generate mock IDs (Meta uses numeric IDs)
    const platformCampaignId = `${randomBetween(100000000000, 999999999999)}`;
    const platformAdsetId = `${randomBetween(100000000000, 999999999999)}`;
    const platformAdId = `${randomBetween(100000000000, 999999999999)}`;

    // Store mock ad state
    this.mockAds.set(platformAdId, {
      status: 'pending',
      reviewStatus: 'pending_review',
    });

    // Simulate review approval after a delay
    setTimeout(() => {
      const ad = this.mockAds.get(platformAdId);
      if (ad) {
        // Meta usually approves faster than TikTok
        ad.status = 'active';
        ad.reviewStatus = 'approved';
      }
    }, 3000);

    console.log(`[MOCK_META] Published ad: ${platformAdId}`);
    console.log(`[MOCK_META] Campaign: ${params.campaignName || 'Untitled'}`);
    console.log(`[MOCK_META] Budget: ${params.budget?.type} $${params.budget?.amount || 0}`);
    console.log(`[MOCK_META] Targeting: ${JSON.stringify(params.targeting || {})}`);

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

    console.log(`[MOCK_META] Paused ad: ${params.platformAdId}`);
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

    console.log(`[MOCK_META] Resumed ad: ${params.platformAdId}`);
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

    console.log(`[MOCK_META] Archived ad: ${params.platformAdId}`);
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

        // Meta typically has higher impression volumes and lower CPMs
        const impressions = randomBetween(2000, 100000);
        const clicks = Math.floor(impressions * randomFloat(0.008, 0.035));
        const conversions = Math.floor(clicks * randomFloat(0.015, 0.12));
        const spend = randomFloat(15, 300);
        const revenue = conversions * randomFloat(25, 120);

        results.push({
          platformAdId: adId,
          date: dateStr,
          spend,
          impressions,
          clicks,
          conversions,
          revenue,
          // Meta doesn't have video views in the same way unless it's a video ad
          videoViews: undefined,
          videoWatchTime: undefined,
        });

        current.setDate(current.getDate() + 1);
      }
    }

    console.log(`[MOCK_META] Generated ${results.length} performance records`);
    return results;
  }

  async getAccountPerformance(params: {
    accessToken: string;
    adAccountId: string;
    startDate: string;
    endDate: string;
  }): Promise<AccountPerformanceResponse> {
    await simulateLatency(200, 400);

    // Generate aggregate metrics (Meta typically has higher volume)
    const impressions = randomBetween(100000, 1000000);
    const clicks = Math.floor(impressions * randomFloat(0.01, 0.03));
    const conversions = Math.floor(clicks * randomFloat(0.02, 0.10));
    const spend = randomFloat(1000, 10000);
    const revenue = conversions * randomFloat(30, 100);

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
export const metaMockProvider = new MetaMockProvider();
