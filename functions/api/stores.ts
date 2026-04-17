/**
 * Stores API - Multi-store management
 * GET /api/stores - List all connected stores with current selection
 * POST /api/stores - Switch current store or disconnect a store
 */

import {
  getCurrentStoreId,
  setStoreIdCookie,
  clearStoreIdCookie,
  getAllStores
} from '../lib/store-cookie';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

interface Store {
  id: string;
  shop_domain: string;
  store_name: string | null;
  store_email: string | null;
  currency: string | null;
  connected_at: string | null;
}

// GET /api/stores - List all stores
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const stores = await getAllStores(env.DB);
    const currentStoreId = getCurrentStoreId(request);

    // If no cookie but stores exist, set cookie to first store
    let setCookieHeader: string | null = null;
    let effectiveCurrentId = currentStoreId;

    if (!currentStoreId && stores.length > 0) {
      effectiveCurrentId = stores[0].id;
      setCookieHeader = setStoreIdCookie(effectiveCurrentId);
    } else if (currentStoreId && !stores.find((s: any) => s.id === currentStoreId)) {
      // Cookie has invalid store ID, reset to first store or clear
      if (stores.length > 0) {
        effectiveCurrentId = stores[0].id;
        setCookieHeader = setStoreIdCookie(effectiveCurrentId);
      } else {
        effectiveCurrentId = null;
        setCookieHeader = clearStoreIdCookie();
      }
    }

    const responseData = {
      success: true,
      stores: stores.map((s: any) => ({
        id: s.id,
        name: s.store_name || s.shop_domain?.replace('.myshopify.com', ''),
        domain: s.shop_domain,
        email: s.store_email,
        currency: s.currency || 'USD',
        connectedAt: s.connected_at,
        isCurrent: s.id === effectiveCurrentId,
      })),
      currentStoreId: effectiveCurrentId,
      totalStores: stores.length,
    };

    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (setCookieHeader) {
      headers.set('Set-Cookie', setCookieHeader);
    }

    return new Response(JSON.stringify(responseData), { headers });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST /api/stores - Switch store or disconnect
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const body = await request.json() as { action: string; storeId?: string };
    const { action, storeId } = body;

    if (action === 'switch') {
      if (!storeId) {
        return Response.json({ error: 'Store ID required' }, { status: 400 });
      }

      // Verify store exists
      const store = await env.DB.prepare(
        'SELECT id, shop_domain, store_name FROM stores WHERE id = ?'
      ).bind(storeId).first<Store>();

      if (!store) {
        return Response.json({ error: 'Store not found' }, { status: 404 });
      }

      // Set cookie and return success
      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.set('Set-Cookie', setStoreIdCookie(storeId));

      return new Response(
        JSON.stringify({
          success: true,
          currentStoreId: storeId,
          store: {
            id: store.id,
            name: store.store_name || store.shop_domain?.replace('.myshopify.com', ''),
            domain: store.shop_domain,
          },
        }),
        { headers }
      );
    }

    if (action === 'disconnect') {
      if (!storeId) {
        return Response.json({ error: 'Store ID required' }, { status: 400 });
      }

      // Delete products first (foreign key constraint)
      await env.DB.prepare('DELETE FROM products WHERE store_id = ?').bind(storeId).run();

      // Delete generated ads
      await env.DB.prepare('DELETE FROM generated_ads WHERE store_id = ?').bind(storeId).run();

      // Delete store
      await env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(storeId).run();

      // Check if this was the current store
      const currentStoreId = getCurrentStoreId(request);
      const headers = new Headers({ 'Content-Type': 'application/json' });

      if (currentStoreId === storeId) {
        // Get next available store
        const nextStore = await env.DB.prepare(
          'SELECT id FROM stores ORDER BY connected_at DESC LIMIT 1'
        ).first<{ id: string }>();

        if (nextStore) {
          headers.set('Set-Cookie', setStoreIdCookie(nextStore.id));
        } else {
          headers.set('Set-Cookie', clearStoreIdCookie());
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          disconnected: true,
          storeId,
        }),
        { headers }
      );
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in stores action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
