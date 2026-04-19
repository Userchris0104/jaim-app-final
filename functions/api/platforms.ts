/**
 * Platform Connections API - Manage ad platform integrations
 * GET /api/platforms - List connected platforms
 * POST /api/platforms - Initiate OAuth or update connection
 * DELETE /api/platforms - Disconnect platform
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

interface Env {
  DB: D1Database;
  TIKTOK_CLIENT_ID?: string;
  TIKTOK_CLIENT_SECRET?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
}

interface PlatformConnection {
  id: string;
  store_id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  account_id: string | null;
  account_name: string | null;
  business_id: string | null;
  status: string;
  last_error: string | null;
  scopes: string | null;
  connected_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

// GET /api/platforms - List connected platforms
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get all platform connections
    const connections = await env.DB.prepare(`
      SELECT * FROM platform_connections WHERE store_id = ?
    `).bind(store.id).all();

    // Get ad accounts for each connection
    const formattedConnections = await Promise.all(
      connections.results.map(async (conn: any) => {
        const adAccounts = await env.DB.prepare(`
          SELECT * FROM platform_ad_accounts WHERE connection_id = ?
        `).bind(conn.id).all();

        return {
          id: conn.id,
          platform: conn.platform,
          accountId: conn.account_id,
          accountName: conn.account_name,
          businessId: conn.business_id,
          status: conn.status,
          lastError: conn.last_error,
          scopes: conn.scopes ? JSON.parse(conn.scopes) : [],
          connectedAt: conn.connected_at,
          lastSyncedAt: conn.last_synced_at,
          adAccounts: adAccounts.results.map((acc: any) => ({
            id: acc.id,
            platformAccountId: acc.platform_account_id,
            name: acc.name,
            currency: acc.currency,
            status: acc.status,
            isPrimary: acc.is_primary === 1,
          })),
        };
      })
    );

    // Define available platforms
    const availablePlatforms = [
      {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Reach Gen Z and Millennials with short-form video ads',
        connected: formattedConnections.some((c: any) => c.platform === 'tiktok'),
        connection: formattedConnections.find((c: any) => c.platform === 'tiktok'),
      },
      {
        id: 'meta',
        name: 'Meta (Facebook & Instagram)',
        description: 'Advertise across Facebook, Instagram, and Messenger',
        connected: formattedConnections.some((c: any) => c.platform === 'meta'),
        connection: formattedConnections.find((c: any) => c.platform === 'meta'),
      },
      {
        id: 'google',
        name: 'Google Ads',
        description: 'Reach customers on Search, YouTube, and Display Network',
        connected: formattedConnections.some((c: any) => c.platform === 'google'),
        connection: formattedConnections.find((c: any) => c.platform === 'google'),
        comingSoon: true,
      },
    ];

    return Response.json({
      success: true,
      platforms: availablePlatforms,
      connections: formattedConnections,
    });
  } catch (error: any) {
    console.error('Error fetching platforms:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST /api/platforms - Initiate OAuth or update connection
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const body = await request.json() as {
      action: string;
      platform: string;
      code?: string;
      redirectUri?: string;
      adAccountId?: string;
    };

    const { action, platform, code, redirectUri, adAccountId } = body;

    switch (action) {
      case 'get_auth_url':
        return getAuthUrl(env, platform, store.id, redirectUri);

      case 'exchange_code':
        return exchangeCode(env, platform, store.id, code!, redirectUri!);

      case 'set_primary_account':
        return setPrimaryAdAccount(env.DB, store.id, platform, adAccountId!);

      case 'refresh_token':
        return refreshToken(env, store.id, platform);

      case 'sync':
        return syncPlatformData(env, store.id, platform);

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in platform action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// DELETE /api/platforms - Disconnect platform
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    if (!platform) {
      return Response.json({ error: 'Platform is required' }, { status: 400 });
    }

    // Get connection
    const connection = await env.DB.prepare(`
      SELECT id FROM platform_connections WHERE store_id = ? AND platform = ?
    `).bind(store.id, platform).first();

    if (!connection) {
      return Response.json({ error: 'Platform not connected' }, { status: 404 });
    }

    // Delete ad accounts
    await env.DB.prepare(`
      DELETE FROM platform_ad_accounts WHERE connection_id = ?
    `).bind(connection.id).run();

    // Delete published ads for this platform
    await env.DB.prepare(`
      DELETE FROM published_ads WHERE connection_id = ?
    `).bind(connection.id).run();

    // Delete connection
    await env.DB.prepare(`
      DELETE FROM platform_connections WHERE id = ?
    `).bind(connection.id).run();

    return Response.json({ success: true, disconnected: true });
  } catch (error: any) {
    console.error('Error disconnecting platform:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// Get OAuth URL for platform
async function getAuthUrl(env: Env, platform: string, storeId: string, redirectUri?: string) {
  const baseRedirectUri = redirectUri || 'https://jaim-final.pages.dev/auth/callback';

  switch (platform) {
    case 'tiktok':
      if (!env.TIKTOK_CLIENT_ID) {
        return Response.json({ error: 'TikTok not configured' }, { status: 500 });
      }
      const tiktokState = Buffer.from(JSON.stringify({ storeId, platform })).toString('base64');
      const tiktokUrl = `https://business-api.tiktok.com/portal/auth?app_id=${env.TIKTOK_CLIENT_ID}&state=${tiktokState}&redirect_uri=${encodeURIComponent(baseRedirectUri)}`;
      return Response.json({ success: true, authUrl: tiktokUrl });

    case 'meta':
      if (!env.META_APP_ID) {
        return Response.json({ error: 'Meta not configured' }, { status: 500 });
      }
      const metaState = Buffer.from(JSON.stringify({ storeId, platform })).toString('base64');
      const metaScopes = 'ads_management,ads_read,business_management,pages_read_engagement';
      const metaUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(baseRedirectUri)}&state=${metaState}&scope=${metaScopes}`;
      return Response.json({ success: true, authUrl: metaUrl });

    default:
      return Response.json({ error: 'Platform not supported' }, { status: 400 });
  }
}

// Exchange OAuth code for tokens
async function exchangeCode(env: Env, platform: string, storeId: string, code: string, redirectUri: string) {
  // This would make the actual OAuth token exchange
  // For now, return a placeholder - actual implementation depends on platform APIs
  return Response.json({
    success: false,
    error: 'OAuth exchange not implemented - requires platform API credentials',
    platform,
    storeId,
  });
}

// Set primary ad account
async function setPrimaryAdAccount(db: D1Database, storeId: string, platform: string, adAccountId: string) {
  const connection = await db.prepare(`
    SELECT id FROM platform_connections WHERE store_id = ? AND platform = ?
  `).bind(storeId, platform).first();

  if (!connection) {
    return Response.json({ error: 'Platform not connected' }, { status: 404 });
  }

  // Unset all primary accounts for this connection
  await db.prepare(`
    UPDATE platform_ad_accounts SET is_primary = 0 WHERE connection_id = ?
  `).bind(connection.id).run();

  // Set new primary
  await db.prepare(`
    UPDATE platform_ad_accounts SET is_primary = 1 WHERE id = ?
  `).bind(adAccountId).run();

  return Response.json({ success: true });
}

// Refresh OAuth token
async function refreshToken(env: Env, storeId: string, platform: string) {
  // Placeholder - actual implementation depends on platform APIs
  return Response.json({
    success: false,
    error: 'Token refresh not implemented',
  });
}

// Sync platform data (ad accounts, etc.)
async function syncPlatformData(env: Env, storeId: string, platform: string) {
  // Placeholder - would fetch ad accounts and other data from platform API
  return Response.json({
    success: false,
    error: 'Platform sync not implemented',
  });
}
