/**
 * Test endpoint to debug Shopify connection
 * GET /api/test-shopify
 */

interface Env {
  DB: D1Database;
}

const API_VERSION = '2024-01';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Get connected store
    const store = await env.DB.prepare(
      'SELECT * FROM stores ORDER BY connected_at DESC LIMIT 1'
    ).first<any>();

    if (!store) {
      return Response.json({
        error: "No store connected",
        stores: []
      });
    }

    // Test fetching products from Shopify
    const shopDomain = store.shop_domain;
    const url = `https://${shopDomain}/admin/api/${API_VERSION}/products.json?limit=5`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Get product count from DB
    const dbProducts = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM products WHERE store_id = ?'
    ).bind(store.id).first<{ count: number }>();

    return Response.json({
      store: {
        id: store.id,
        domain: store.shop_domain,
        name: store.store_name,
        hasToken: !!store.access_token,
        tokenLength: store.access_token?.length,
        tokenPreview: store.access_token?.substring(0, 10) + '...',
      },
      shopifyApi: {
        url: url,
        status: response.status,
        ok: response.ok,
        products: responseData.products?.length || 0,
        response: response.ok ? responseData : responseText,
      },
      database: {
        productCount: dbProducts?.count || 0,
      }
    });
  } catch (error: any) {
    return Response.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
};
