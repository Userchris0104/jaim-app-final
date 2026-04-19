/**
 * Platform Provider Factory
 *
 * Returns the appropriate provider implementation based on:
 * 1. The platform (tiktok, meta)
 * 2. Whether mock mode is enabled (USE_MOCK_PLATFORMS env var)
 *
 * Usage:
 *   const provider = getPlatformProvider('tiktok', env);
 *   const accounts = await provider.getAdAccounts(accessToken);
 */

import type { PlatformProvider } from './platform-provider';
import { TikTokMockProvider } from './mock/tiktok-mock-provider';
import { MetaMockProvider } from './mock/meta-mock-provider';

// Re-export types
export * from './platform-provider';
export type { PlatformProvider };

// ===========================================
// PROVIDER INSTANCES
// ===========================================

// Mock providers (always available)
const tikTokMockProvider = new TikTokMockProvider();
const metaMockProvider = new MetaMockProvider();

// Real providers will be added here when implemented
// import { TikTokProvider } from './real/tiktok-provider';
// import { MetaProvider } from './real/meta-provider';
// const tikTokProvider = new TikTokProvider();
// const metaProvider = new MetaProvider();

// ===========================================
// FACTORY FUNCTION
// ===========================================

export interface ProviderEnv {
  USE_MOCK_PLATFORMS?: string;
  // Real provider credentials (when implemented)
  TIKTOK_APP_ID?: string;
  TIKTOK_APP_SECRET?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
}

/**
 * Get the appropriate platform provider based on platform and environment.
 *
 * @param platform - 'tiktok' or 'meta'
 * @param env - Environment variables including USE_MOCK_PLATFORMS flag
 * @returns The platform provider implementation
 */
export function getPlatformProvider(
  platform: 'tiktok' | 'meta',
  env: ProviderEnv
): PlatformProvider {
  const useMock = env.USE_MOCK_PLATFORMS === 'true';

  if (platform === 'tiktok') {
    if (useMock) {
      console.log('[PROVIDER] Using mock TikTok provider');
      return tikTokMockProvider;
    }

    // Real TikTok provider (not yet implemented)
    // if (env.TIKTOK_APP_ID && env.TIKTOK_APP_SECRET) {
    //   console.log('[PROVIDER] Using real TikTok provider');
    //   return tikTokProvider;
    // }

    // Fallback to mock if no credentials
    console.warn('[PROVIDER] No TikTok credentials, falling back to mock');
    return tikTokMockProvider;
  }

  if (platform === 'meta') {
    if (useMock) {
      console.log('[PROVIDER] Using mock Meta provider');
      return metaMockProvider;
    }

    // Real Meta provider (not yet implemented)
    // if (env.META_APP_ID && env.META_APP_SECRET) {
    //   console.log('[PROVIDER] Using real Meta provider');
    //   return metaProvider;
    // }

    // Fallback to mock if no credentials
    console.warn('[PROVIDER] No Meta credentials, falling back to mock');
    return metaMockProvider;
  }

  throw new Error(`Unknown platform: ${platform}`);
}

/**
 * Check if a provider is available for a platform.
 * Returns true if either mock mode is enabled or real credentials exist.
 */
export function isProviderAvailable(
  platform: 'tiktok' | 'meta',
  env: ProviderEnv
): boolean {
  const useMock = env.USE_MOCK_PLATFORMS === 'true';

  if (useMock) {
    return true; // Mock providers always available
  }

  if (platform === 'tiktok') {
    return Boolean(env.TIKTOK_APP_ID && env.TIKTOK_APP_SECRET);
  }

  if (platform === 'meta') {
    return Boolean(env.META_APP_ID && env.META_APP_SECRET);
  }

  return false;
}

/**
 * Get all available platform providers.
 */
export function getAvailableProviders(env: ProviderEnv): PlatformProvider[] {
  const providers: PlatformProvider[] = [];

  if (isProviderAvailable('tiktok', env)) {
    providers.push(getPlatformProvider('tiktok', env));
  }

  if (isProviderAvailable('meta', env)) {
    providers.push(getPlatformProvider('meta', env));
  }

  return providers;
}

/**
 * Validate that required credentials exist for a platform in production.
 * Throws an error if USE_MOCK_PLATFORMS is false and credentials are missing.
 */
export function validatePlatformCredentials(
  platform: 'tiktok' | 'meta',
  env: ProviderEnv
): void {
  const useMock = env.USE_MOCK_PLATFORMS === 'true';

  if (useMock) {
    return; // No validation needed in mock mode
  }

  if (platform === 'tiktok') {
    if (!env.TIKTOK_APP_ID || !env.TIKTOK_APP_SECRET) {
      throw new Error(
        'TikTok credentials required. Set TIKTOK_APP_ID and TIKTOK_APP_SECRET, or enable USE_MOCK_PLATFORMS=true'
      );
    }
  }

  if (platform === 'meta') {
    if (!env.META_APP_ID || !env.META_APP_SECRET) {
      throw new Error(
        'Meta credentials required. Set META_APP_ID and META_APP_SECRET, or enable USE_MOCK_PLATFORMS=true'
      );
    }
  }
}
