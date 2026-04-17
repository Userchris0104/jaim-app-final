/**
 * API endpoint for products
 * GET /api/products - Returns products from connected store
 * POST /api/products - Actions: sync, disconnect
 */

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
}

// Shopify API version
const API_VERSION = '2024-01';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    // Get connected store
    const store = await env.DB.prepare(
      'SELECT * FROM stores ORDER BY connected_at DESC LIMIT 1'
    ).first();

    if (!store) {
      return Response.json({
        connected: false,
        store: null,
        products: [],
        total: 0,
      });
    }

    // Get products
    const productsResult = await env.DB.prepare(`
      SELECT * FROM products
      WHERE store_id = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(store.id, limit, offset).all();

    // Get total count
    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM products WHERE store_id = ?'
    ).bind(store.id).first<{ count: number }>();

    return Response.json({
      connected: true,
      store: {
        id: store.id,
        name: store.store_name,
        domain: store.shop_domain,
        email: store.store_email,
        currency: store.currency,
        plan: store.plan_name,
        connectedAt: store.connected_at,
      },
      products: productsResult.results.map((p: any) => ({
        id: p.id,
        shopifyId: p.shopify_id,
        title: p.title,
        description: p.description,
        vendor: p.vendor,
        productType: p.product_type,  // For category detection
        handle: p.handle,
        status: p.status,
        imageUrl: p.image_url,
        images: p.images ? JSON.parse(p.images) : [],  // All product images
        variants: p.variants ? JSON.parse(p.variants) : [],  // Size/color variants (helps detect gender)
        priceMin: p.price_min,
        priceMax: p.price_max,
        inventory: p.inventory_total,
        tags: p.tags,  // For category, gender, age, species detection
        syncedAt: p.synced_at,
      })),
      total: countResult?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const formData = await context.request.formData();
    const action = formData.get("action");

    // Get connected store
    const store = await env.DB.prepare(
      'SELECT * FROM stores ORDER BY connected_at DESC LIMIT 1'
    ).first<any>();

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
      // Delete products first (foreign key)
      await env.DB.prepare('DELETE FROM products WHERE store_id = ?').bind(store.id).run();
      // Delete store
      await env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(store.id).run();
      return Response.json({ success: true, disconnected: true });
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
 * Save a single product to database
 */
async function saveProduct(
  db: D1Database,
  storeId: string,
  shopifyProduct: any
): Promise<void> {
  const id = crypto.randomUUID();

  // Extract price range from variants
  const prices = shopifyProduct.variants?.map((v: any) => parseFloat(v.price)) || [0];
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);

  // Calculate total inventory
  const inventoryTotal = shopifyProduct.variants?.reduce(
    (sum: number, v: any) => sum + (v.inventory_quantity || 0),
    0
  ) || 0;

  // Get primary image
  const imageUrl = shopifyProduct.image?.src || shopifyProduct.images?.[0]?.src || null;

  // Store images as JSON
  const images = JSON.stringify(
    shopifyProduct.images?.map((img: any) => img.src) || []
  );

  // Store variants as JSON
  const variants = JSON.stringify(
    shopifyProduct.variants?.map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
    })) || []
  );

  await db.prepare(`
    INSERT INTO products (
      id, store_id, shopify_id, title, description, vendor, product_type,
      handle, status, tags, image_url, images, variants, price_min, price_max,
      inventory_total, synced_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(store_id, shopify_id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      vendor = excluded.vendor,
      product_type = excluded.product_type,
      handle = excluded.handle,
      status = excluded.status,
      tags = excluded.tags,
      image_url = excluded.image_url,
      images = excluded.images,
      variants = excluded.variants,
      price_min = excluded.price_min,
      price_max = excluded.price_max,
      inventory_total = excluded.inventory_total,
      updated_at = datetime('now'),
      synced_at = datetime('now')
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
    shopifyProduct.tags || null,
    imageUrl,
    images,
    variants,
    priceMin,
    priceMax,
    inventoryTotal
  ).run();
}
