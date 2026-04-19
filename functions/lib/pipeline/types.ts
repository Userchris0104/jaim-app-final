/**
 * Pipeline Types
 * Core interfaces and types for the ad generation and publishing pipeline
 */

// ===========================================
// AD COPY TYPES
// ===========================================

export interface AdCopy {
  headline: string;          // max 40 chars
  primaryText: string;       // max 125 chars
  description: string;       // max 90 chars
  callToAction: CallToAction;
  hashtags?: string[];       // max 5 tags, no hash symbol
  platformVariants?: {
    tiktok?: string;         // max 100 chars, casual
    instagram?: string;      // max 125 chars, aspirational
    facebook?: string;       // max 200 chars, informative
  };
}

export type CallToAction =
  | 'Shop Now'
  | 'Learn More'
  | 'Get Yours'
  | 'Buy Now'
  | 'Discover'
  | 'Order Now';

// ===========================================
// AD CREATIVE TYPES
// ===========================================

export interface AdCreative {
  id: string;
  storeId: string;
  productId: string;

  // Copy
  copy: AdCopy;

  // Image
  imageUrl: string;
  imagePrompt: string;

  // Metadata
  platform: Platform;
  format: AdFormat;
  creativeStrategy: CreativeStrategy;
  status: AdStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'meta_feed' | 'meta_stories';
export type AdFormat = 'square' | 'portrait' | 'landscape' | 'story';
export type CreativeStrategy =
  | 'emotion_lifestyle'
  | 'specs_focused'
  | 'styled_product'
  | 'clean_product'
  | 'ugc_discovery';
export type AdStatus = 'generating' | 'ready' | 'approved' | 'rejected' | 'published';

// ===========================================
// PRODUCT TYPES
// ===========================================

export interface Product {
  id: string;
  storeId: string;
  shopifyId: string;
  title: string;
  description: string | null;
  vendor: string | null;
  productType: string | null;
  handle: string | null;
  status: string;
  tags: string | null;
  imageUrl: string | null;
  images: string[];           // Parsed from JSON
  variants: ProductVariant[];
  priceMin: number | null;
  priceMax: number | null;
  inventoryTotal: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  sku: string | null;
  inventoryQuantity: number;
}

// ===========================================
// BRAND STYLE TYPES
// ===========================================

export interface BrandStyle {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

// ===========================================
// PUBLISHING TYPES
// ===========================================

export interface PublishRequest {
  adId: string;
  campaignId?: string;
  platform: Platform;
  adAccountId: string;
  budget?: {
    type: 'daily' | 'lifetime';
    amount: number;
  };
  targeting?: AdTargeting;
  schedule?: {
    startDate: string;
    endDate?: string;
  };
}

export interface AdTargeting {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'all')[];
  locations?: string[];       // Country codes
  interests?: string[];
  customAudiences?: string[];
}

export interface PublishResult {
  success: boolean;
  publishedAdId?: string;     // Our internal ID
  platformAdId?: string;      // ID returned by platform
  platformAdsetId?: string;
  platformCampaignId?: string;
  reviewStatus?: 'pending_review' | 'approved' | 'rejected';
  error?: string;
}

// ===========================================
// PERFORMANCE TYPES
// ===========================================

export interface AdPerformance {
  adId: string;
  publishedAdId?: string;
  date: string;              // YYYY-MM-DD

  // Spend & Revenue
  spend: number;
  revenue: number;
  roas: number;

  // Engagement
  impressions: number;
  clicks: number;
  ctr: number;

  // Conversions
  conversions: number;
  cpa: number;

  // Video metrics (optional)
  videoViews?: number;
  videoWatchTime?: number;
  videoCompletionRate?: number;
}

export interface PlatformMetrics {
  platform: Platform;
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
}

// ===========================================
// PLATFORM CONNECTION TYPES
// ===========================================

export interface PlatformConnection {
  id: string;
  storeId: string;
  platform: 'tiktok' | 'meta' | 'google';
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  accountId?: string;
  accountName?: string;
  businessId?: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  scopes: string[];
  connectedAt: string;
  lastSyncedAt?: string;
}

export interface AdAccount {
  id: string;
  platformAccountId: string;
  name: string;
  currency: string;
  timezone?: string;
  status: 'active' | 'disabled';
  isPrimary: boolean;
}

// ===========================================
// JOB TYPES
// ===========================================

export interface PublishJob {
  id: string;
  storeId: string;
  adId: string;
  platform: Platform;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SyncJob {
  id: string;
  storeId: string;
  platform: Platform;
  type: 'performance' | 'ads' | 'accounts';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  lastSyncedAt?: string;
  createdAt: string;
}
