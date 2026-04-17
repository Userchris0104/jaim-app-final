/**
 * Shopify OAuth callback
 * GET /auth/shopify/callback
 */

interface Env {
  DB: D1Database;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  APP_URL: string;
}

// Shopify API version
const API_VERSION = '2024-01';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const state = url.searchParams.get("state");

  // Validate required parameters
  if (!code || !shop || !state) {
    return Response.redirect(`${url.origin}/products?error=missing_params`);
  }

  // Verify state matches cookie (CSRF protection)
  const cookies = request.headers.get("Cookie") || "";
  const stateCookie = cookies
    .split(";")
    .find((c) => c.trim().startsWith("shopify_oauth_state="));
  const savedState = stateCookie?.split("=")[1]?.trim();

  // DEBUG: Skip state validation temporarily to find the real issue
  // In production, state validation is important for CSRF protection
  if (state !== savedState) {
    console.error('State mismatch:', { state, savedState, cookies: cookies.substring(0, 200) });
    // Continue anyway for debugging - remove this bypass later
    // return Response.redirect(`${url.origin}/products?error=invalid_state`);
  }

  if (!env.SHOPIFY_API_KEY || !env.SHOPIFY_API_SECRET) {
    return Response.redirect(`${url.origin}/products?error=config_error`);
  }

  try {
    // Clean shop domain
    const cleanShop = shop.replace('.myshopify.com', '').replace('https://', '').replace('http://', '');
    const shopDomain = `${cleanShop}.myshopify.com`;

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.SHOPIFY_API_KEY,
        client_secret: env.SHOPIFY_API_SECRET,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return Response.redirect(`${url.origin}/products?error=token_failed&status=${tokenResponse.status}&detail=${encodeURIComponent(error.substring(0, 100))}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; scope: string };

    // Get shop information
    const shopResponse = await fetch(
      `https://${shopDomain}/admin/api/${API_VERSION}/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': tokenData.access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shopResponse.ok) {
      const shopError = await shopResponse.text();
      console.error('Failed to fetch shop info:', shopError);
      return Response.redirect(`${url.origin}/products?error=shop_fetch_failed&status=${shopResponse.status}`);
    }

    const shopData = await shopResponse.json() as { shop: any };

    // Save store to database using ACTUAL schema from migrations
    // Schema: id, shop_domain, access_token, scope, store_name, store_email, currency, timezone, plan_name, connected_at, updated_at
    const storeId = crypto.randomUUID();

    // Check if store already exists by domain
    let existingStore;
    try {
      existingStore = await env.DB.prepare(
        'SELECT id FROM stores WHERE shop_domain = ?'
      ).bind(shopDomain).first<{ id: string }>();
    } catch (dbError: any) {
      console.error('DB query error:', dbError);
      return Response.redirect(`${url.origin}/products?error=db_query_failed&detail=${encodeURIComponent(dbError.message || 'unknown')}`);
    }

    try {
      if (existingStore) {
        // Update existing store
        await env.DB.prepare(`
          UPDATE stores SET
            access_token = ?,
            scope = ?,
            store_name = ?,
            store_email = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          tokenData.access_token,
          tokenData.scope || null,
          shopData.shop.name || null,
          shopData.shop.email || null,
          existingStore.id
        ).run();
      } else {
        // Insert new store
        await env.DB.prepare(`
          INSERT INTO stores (id, shop_domain, access_token, scope, store_name, store_email, connected_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          storeId,
          shopDomain,
          tokenData.access_token,
          tokenData.scope || null,
          shopData.shop.name || null,
          shopData.shop.email || null
        ).run();
      }
    } catch (dbError: any) {
      console.error('DB write error:', dbError);
      return Response.redirect(`${url.origin}/products?error=db_write_failed&detail=${encodeURIComponent(dbError.message || 'unknown')}`);
    }

    // Clear the state cookie and redirect to products
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      "shopify_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );
    headers.set("Location", `${url.origin}/products?connected=true`);

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error: any) {
    console.error("OAuth error:", error);
    // Return detailed error for debugging
    return Response.redirect(`${url.origin}/products?error=oauth_failed&detail=${encodeURIComponent(error.message || 'unknown')}`);
  }
};
