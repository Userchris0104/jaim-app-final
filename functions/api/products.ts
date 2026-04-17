/**
 * API endpoint for products
 * GET /api/products - Returns products from current store (cookie-based)
 * POST /api/products - Actions: sync, disconnect
 */

import {
  getStoreFromCookieOrFallback,
  setStoreIdCookie,
} from '../lib/store-cookie';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
}

// Shopify API version
const API_VERSION = '2024-01';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    // Get store from cookie or fall back to most recent
    const { store, storeId, usedFallback } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({
        connected: false,
        store: null,
        products: [],
        total: 0,
      });
    }

    // If we used fallback, set the cookie for future requests
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (usedFallback && storeId) {
      headers.set('Set-Cookie', setStoreIdCookie(storeId));
    }

    // Get products - ACTUAL schema: shopify_id, image_url, images, price_min, price_max, status
    const productsResult = await env.DB.prepare(`
      SELECT * FROM products
      WHERE store_id = ?
      ORDER BY synced_at DESC
      LIMIT ? OFFSET ?
    `).bind(store.id, limit, offset).all();

    // Get total count
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM products WHERE store_id = ?'
    ).bind(store.id).first<{ count: number }>();

    const responseData = {
      connected: true,
      store: {
        id: store.id,
        name: store.store_name,
        domain: store.shop_domain,
        email: store.store_email,
        currency: store.currency || 'USD',
        connectedAt: store.connected_at,
      },
      products: productsResult.results.map((p: any) => {
        // Parse images JSON array
        let images: string[] = [];
        try {
          images = p.images ? JSON.parse(p.images) : [];
        } catch { images = []; }

        // Use image_url as primary, fall back to first from images array
        const primaryImage = p.image_url || images[0] || null;

        return {
          id: p.id,
          shopifyId: p.shopify_id,
          title: p.title,
          description: p.description,
          vendor: p.vendor,
          productType: p.product_type,
          status: p.status || 'active',
          imageUrl: primaryImage,
          images: primaryImage ? [primaryImage, ...images.filter((i: string) => i !== primaryImage)] : images,
          priceMin: p.price_min,
          priceMax: p.price_max,
          tags: p.tags,
          syncedAt: p.synced_at,
        };
      }),
      total: countResult?.count || 0,
    };

    return new Response(JSON.stringify(responseData), { headers });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const formData = await request.formData();
    const action = formData.get("action");

    // Get store from cookie or fall back to most recent
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json(
        { error: "No store connected" },
        { status: 400 }
      );
    }

    if (action === "sync") {
      // Sync products from Shopify
      try {
        const result = await syncProducts(env.DB, store);
        return Response.json({
          success: true,
          synced: result.synced,
          errors: result.errors,
          debug: result.debug,
        });
      } catch (syncError: any) {
        console.error("Sync error:", syncError);
        return Response.json({
          success: false,
          error: syncError.message || "Sync failed",
          debug: { store: store.shop_domain }
        });
      }
    }

    if (action === "disconnect") {
      // Use /api/stores endpoint for proper disconnect with cookie handling
      // This endpoint is kept for backwards compatibility but redirects to stores API logic
      await env.DB.prepare('DELETE FROM products WHERE store_id = ?').bind(store.id).run();
      await env.DB.prepare('DELETE FROM generated_ads WHERE store_id = ?').bind(store.id).run();
      await env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(store.id).run();

      // Get next available store to set as current
      const nextStore = await env.DB.prepare(
        'SELECT id FROM stores ORDER BY connected_at DESC LIMIT 1'
      ).first<{ id: string }>();

      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (nextStore) {
        headers.set('Set-Cookie', setStoreIdCookie(nextStore.id));
      } else {
        // No stores left, clear cookie
        headers.set('Set-Cookie', 'current_store_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      }

      return new Response(
        JSON.stringify({ success: true, disconnected: true, nextStoreId: nextStore?.id || null }),
        { headers }
      );
    }

    return Response.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in products action:", error);
    return Response.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
};

/**
 * Sync products from Shopify to database
 */
async function syncProducts(
  db: D1Database,
  store: any
): Promise<{ synced: number; errors: number; debug?: any }> {
  let synced = 0;
  let errors = 0;
  let pageInfo: string | undefined;
  let hasNextPage = true;
  let debugInfo: any = {};

  // ACTUAL schema: shop_domain, access_token
  const cleanShop = store.shop_domain.replace('.myshopify.com', '');
  const shopDomain = `${cleanShop}.myshopify.com`;

  debugInfo.shopDomain = shopDomain;
  debugInfo.hasToken = !!store.access_token;
  debugInfo.tokenLength = store.access_token?.length;

  while (hasNextPage) {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (pageInfo) {
        params.set('page_info', pageInfo);
      }

      const url = `https://${shopDomain}/admin/api/${API_VERSION}/products.json?${params.toString()}`;
      debugInfo.fetchUrl = url;

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
      });

      debugInfo.responseStatus = response.status;
      debugInfo.responseOk = response.ok;

      if (!response.ok) {
        const errorText = await response.text();
        debugInfo.errorResponse = errorText;
        throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { products: any[] };
      debugInfo.productCount = data.products?.length || 0;

      for (const product of data.products) {
        try {
          await saveProduct(db, store.id, product);
          synced++;
        } catch (e: any) {
          console.error('Error saving product:', e);
          debugInfo.saveError = e.message;
          errors++;
        }
      }

      // Parse Link header for pagination
      const linkHeader = response.headers.get('Link');
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
          hasNextPage = true;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    } catch (e: any) {
      console.error('Error fetching products page:', e);
      debugInfo.fetchError = e.message;
      hasNextPage = false;
      errors++;
    }
  }

  return { synced, errors, debug: debugInfo };
}

/**
 * Save a single product to database - ACTUAL schema from migrations
 * Schema: id, store_id, shopify_id, title, description, vendor, product_type, handle, status, tags, image_url, images, variants, price_min, price_max, inventory_total, created_at, updated_at, synced_at
 */
async function saveProduct(
  db: D1Database,
  storeId: string,
  shopifyProduct: any
): Promise<void> {
  const id = crypto.randomUUID();

  // Extract prices from variants
  const prices = shopifyProduct.variants?.map((v: any) => parseFloat(v.price) || 0) || [0];
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);

  // Primary image URL
  const imageUrl = shopifyProduct.images?.[0]?.src || null;

  // Store all images as JSON array
  const images = JSON.stringify(
    shopifyProduct.images?.map((img: any) => img.src) || []
  );

  // Store variants as JSON
  const variants = JSON.stringify(shopifyProduct.variants || []);

  // Tags as comma-separated string
  const tags = shopifyProduct.tags || null;

  // Total inventory
  const inventoryTotal = shopifyProduct.variants?.reduce(
    (sum: number, v: any) => sum + (v.inventory_quantity || 0), 0
  ) || 0;

  // Check if product already exists
  const existing = await db.prepare(
    'SELECT id FROM products WHERE store_id = ? AND shopify_id = ?'
  ).bind(storeId, shopifyProduct.id.toString()).first();

  if (existing) {
    // Update existing product
    await db.prepare(`
      UPDATE products SET
        title = ?,
        description = ?,
        vendor = ?,
        product_type = ?,
        handle = ?,
        status = ?,
        tags = ?,
        image_url = ?,
        images = ?,
        variants = ?,
        price_min = ?,
        price_max = ?,
        inventory_total = ?,
        updated_at = datetime('now'),
        synced_at = datetime('now')
      WHERE id = ?
    `).bind(
      shopifyProduct.title,
      shopifyProduct.body_html || null,
      shopifyProduct.vendor || null,
      shopifyProduct.product_type || null,
      shopifyProduct.handle || null,
      shopifyProduct.status || 'active',
      tags,
      imageUrl,
      images,
      variants,
      priceMin,
      priceMax,
      inventoryTotal,
      existing.id
    ).run();
  } else {
    // Insert new product
    await db.prepare(`
      INSERT INTO products (
        id, store_id, shopify_id, title, description, vendor, product_type,
        handle, status, tags, image_url, images, variants, price_min, price_max,
        inventory_total, created_at, updated_at, synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `).bind(
      id,
      storeId,
      shopifyProduct.id.toString(),
      shopifyProduct.title,
      shopifyProduct.body_html || null,
      shopifyProduct.vendor || null,
      shopifyProduct.product_type || null,
      shopifyProduct.handle || null,
      shopifyProduct.status || 'active',
      tags,
      imageUrl,
      images,
      variants,
      priceMin,
      priceMax,
      inventoryTotal
    ).run();
  }
}
