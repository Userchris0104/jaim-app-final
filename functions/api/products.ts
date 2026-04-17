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
    // Get connected store - using production schema (shopify_domain, shop_name, etc.)
    const store = await env.DB.prepare(
      'SELECT * FROM stores WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).first<any>();

    if (!store) {
      return Response.json({
        connected: false,
        store: null,
        products: [],
        total: 0,
      });
    }

    // Get products - using production schema
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

    return Response.json({
      connected: true,
      store: {
        id: store.id,
        name: store.shop_name,
        domain: store.shopify_domain,
        email: store.shop_email,
        currency: 'USD',
        connectedAt: store.created_at,
      },
      products: productsResult.results.map((p: any) => {
        // Parse image_urls JSON array
        let images: string[] = [];
        try {
          images = p.image_urls ? JSON.parse(p.image_urls) : [];
        } catch { images = []; }

        return {
          id: p.id,
          shopifyId: p.shopify_product_id,
          title: p.title,
          description: p.description,
          vendor: p.vendor,
          productType: p.product_type,
          status: p.is_active ? 'active' : 'inactive',
          imageUrl: images[0] || null,
          images,
          priceMin: p.price,
          priceMax: p.price,
          tags: null,
          syncedAt: p.synced_at,
        };
      }),
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

    // Get connected store - using production schema
    const store = await env.DB.prepare(
      'SELECT * FROM stores WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
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
          debug: { store: store.shopify_domain }
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

  // Use production schema: shopify_domain, shopify_access_token
  const cleanShop = store.shopify_domain.replace('.myshopify.com', '');
  const shopDomain = `${cleanShop}.myshopify.com`;

  debugInfo.shopDomain = shopDomain;
  debugInfo.hasToken = !!store.shopify_access_token;
  debugInfo.tokenLength = store.shopify_access_token?.length;

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
          'X-Shopify-Access-Token': store.shopify_access_token,
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
 * Save a single product to database - using production schema
 */
async function saveProduct(
  db: D1Database,
  storeId: string,
  shopifyProduct: any
): Promise<void> {
  const id = crypto.randomUUID();

  // Extract price from first variant
  const price = shopifyProduct.variants?.[0]?.price
    ? parseFloat(shopifyProduct.variants[0].price)
    : 0;

  // Store images as JSON array
  const imageUrls = JSON.stringify(
    shopifyProduct.images?.map((img: any) => img.src) || []
  );

  // Product URL
  const productUrl = shopifyProduct.handle
    ? `https://example.com/products/${shopifyProduct.handle}`
    : null;

  // Check if product already exists
  const existing = await db.prepare(
    'SELECT id FROM products WHERE store_id = ? AND shopify_product_id = ?'
  ).bind(storeId, shopifyProduct.id.toString()).first();

  if (existing) {
    // Update existing product
    await db.prepare(`
      UPDATE products SET
        title = ?,
        description = ?,
        vendor = ?,
        product_type = ?,
        image_urls = ?,
        price = ?,
        product_url = ?,
        is_active = ?,
        synced_at = datetime('now')
      WHERE id = ?
    `).bind(
      shopifyProduct.title,
      shopifyProduct.body_html || null,
      shopifyProduct.vendor || null,
      shopifyProduct.product_type || null,
      imageUrls,
      price,
      productUrl,
      shopifyProduct.status === 'active' ? 1 : 0,
      existing.id
    ).run();
  } else {
    // Insert new product
    await db.prepare(`
      INSERT INTO products (
        id, store_id, shopify_product_id, title, description, vendor, product_type,
        image_urls, price, product_url, is_active, synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      storeId,
      shopifyProduct.id.toString(),
      shopifyProduct.title,
      shopifyProduct.body_html || null,
      shopifyProduct.vendor || null,
      shopifyProduct.product_type || null,
      imageUrls,
      price,
      productUrl,
      shopifyProduct.status === 'active' ? 1 : 0
    ).run();
  }
}
