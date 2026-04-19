/**
 * Platform Provider Interface
 *
 * Abstract interface that all platform providers (TikTok, Meta, etc.) must implement.
 * This enables the provider pattern where mock and real implementations are swappable.
 */

import type {
  Platform,
  PublishRequest,
  PublishResult,
  AdPerformance,
  PlatformConnection,
  AdAccount,
  AdTargeting,
} from '../pipeline/types';

// ===========================================
// PROVIDER INTERFACE
// ===========================================

export interface PlatformProvider {
  /**
   * Platform identifier
   */
  readonly platform: 'tiktok' | 'meta';

  /**
   * Check if the provider is using mock mode
   */
  readonly isMock: boolean;

  // ===========================================
  // AUTHENTICATION
  // ===========================================

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(params: {
    redirectUri: string;
    state: string;
    scopes?: string[];
  }): string;

  /**
   * Exchange authorization code for access tokens
   */
  exchangeCode(params: {
    code: string;
    redirectUri: string;
  }): Promise<TokenResponse>;

  /**
   * Refresh an expired access token
   */
  refreshToken(refreshToken: string): Promise<TokenResponse>;

  /**
   * Validate if a token is still valid
   */
  validateToken(accessToken: string): Promise<boolean>;

  // ===========================================
  // AD ACCOUNTS
  // ===========================================

  /**
   * Fetch all ad accounts for the authenticated user
   */
  getAdAccounts(accessToken: string): Promise<AdAccount[]>;

  /**
   * Get details for a specific ad account
   */
  getAdAccount(accessToken: string, accountId: string): Promise<AdAccount | null>;

  // ===========================================
  // AD PUBLISHING
  // ===========================================

  /**
   * Create and publish an ad to the platform
   */
  publishAd(params: {
    accessToken: string;
    adAccountId: string;
    creative: AdCreativePayload;
    targeting?: AdTargeting;
    budget?: { type: 'daily' | 'lifetime'; amount: number };
    campaignName?: string;
  }): Promise<PublishResult>;

  /**
   * Pause a published ad
   */
  pauseAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }>;

  /**
   * Resume a paused ad
   */
  resumeAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }>;

  /**
   * Delete/archive an ad
   */
  deleteAd(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<{ success: boolean; error?: string }>;

  /**
   * Get ad status and review status
   */
  getAdStatus(params: {
    accessToken: string;
    adAccountId: string;
    platformAdId: string;
  }): Promise<AdStatusResponse>;

  // ===========================================
  // PERFORMANCE DATA
  // ===========================================

  /**
   * Fetch performance metrics for ads
   */
  getAdPerformance(params: {
    accessToken: string;
    adAccountId: string;
    platformAdIds: string[];
    startDate: string;
    endDate: string;
  }): Promise<AdPerformanceResponse[]>;

  /**
   * Fetch account-level performance metrics
   */
  getAccountPerformance(params: {
    accessToken: string;
    adAccountId: string;
    startDate: string;
    endDate: string;
  }): Promise<AccountPerformanceResponse>;
}

// ===========================================
// RESPONSE TYPES
// ===========================================

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;          // seconds
  tokenType: string;
  scopes: string[];
}

export interface AdCreativePayload {
  headline: string;
  primaryText: string;
  description?: string;
  callToAction: string;
  imageUrl: string;
  landingPageUrl: string;
  format: 'square' | 'portrait' | 'landscape' | 'story';
}

export interface AdStatusResponse {
  platformAdId: string;
  status: 'active' | 'paused' | 'deleted' | 'pending' | 'rejected';
  reviewStatus: 'pending_review' | 'approved' | 'rejected' | 'in_review';
  rejectionReason?: string;
  deliveryStatus?: 'delivering' | 'not_delivering' | 'limited';
}

export interface AdPerformanceResponse {
  platformAdId: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  videoViews?: number;
  videoWatchTime?: number;
}

export interface AccountPerformanceResponse {
  date: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
}

// ===========================================
// ERROR TYPES
// ===========================================

export class PlatformApiError extends Error {
  constructor(
    public platform: string,
    public code: string,
    message: string,
    public statusCode?: number,
    public rawResponse?: any
  ) {
    super(`[${platform}] ${code}: ${message}`);
    this.name = 'PlatformApiError';
  }
}

export class TokenExpiredError extends PlatformApiError {
  constructor(platform: string) {
    super(platform, 'TOKEN_EXPIRED', 'Access token has expired');
    this.name = 'TokenExpiredError';
  }
}

export class RateLimitError extends PlatformApiError {
  constructor(platform: string, public retryAfter?: number) {
    super(platform, 'RATE_LIMITED', `Rate limited${retryAfter ? `, retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}

export class AdRejectedError extends PlatformApiError {
  constructor(platform: string, public reason: string) {
    super(platform, 'AD_REJECTED', `Ad rejected: ${reason}`);
    this.name = 'AdRejectedError';
  }
}
