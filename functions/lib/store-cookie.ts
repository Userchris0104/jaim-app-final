/**
 * Store cookie utilities for multi-store support
 *
 * Cookie: current_store_id
 * - Stores the currently selected store ID
 * - HttpOnly for security
 * - 1 year expiry
 */

const COOKIE_NAME = 'current_store_id';
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

/**
 * Get current store ID from request cookies
 */
export function getCurrentStoreId(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map(c => c.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      const value = cookie.substring(COOKIE_NAME.length + 1);
      // Validate it looks like a UUID
      if (value && /^[0-9a-f-]{36}$/i.test(value)) {
        return value;
      }
    }
  }

  return null;
}

/**
 * Generate Set-Cookie header value to set the current store
 */
export function setStoreIdCookie(storeId: string): string {
  return `${COOKIE_NAME}=${storeId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

/**
 * Generate Set-Cookie header value to clear the current store cookie
 */
export function clearStoreIdCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Get store by ID or fall back to most recent store
 * Returns the store and whether a fallback was used
 */
export async function getStoreFromCookieOrFallback(
  db: D1Database,
  request: Request
): Promise<{ store: any | null; storeId: string | null; usedFallback: boolean }> {
  const cookieStoreId = getCurrentStoreId(request);

  if (cookieStoreId) {
    // Try to get store by cookie ID
    const store = await db.prepare(
      'SELECT * FROM stores WHERE id = ?'
    ).bind(cookieStoreId).first();

    if (store) {
      return { store, storeId: cookieStoreId, usedFallback: false };
    }
    // Cookie has invalid store ID - will fall back
  }

  // Fallback: get most recent store
  const fallbackStore = await db.prepare(
    'SELECT * FROM stores ORDER BY connected_at DESC LIMIT 1'
  ).first();

  if (fallbackStore) {
    return {
      store: fallbackStore,
      storeId: (fallbackStore as any).id,
      usedFallback: true
    };
  }

  return { store: null, storeId: null, usedFallback: false };
}

/**
 * Get all stores for listing
 */
export async function getAllStores(db: D1Database): Promise<any[]> {
  const result = await db.prepare(
    'SELECT id, shop_domain, store_name, store_email, currency, connected_at FROM stores ORDER BY connected_at DESC'
  ).all();

  return result.results || [];
}
