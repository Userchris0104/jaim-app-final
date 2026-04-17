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

  if (state !== savedState) {
    return Response.redirect(`${url.origin}/products?error=invalid_state`);
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
      return Response.redirect(`${url.origin}/products?error=oauth_failed`);
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
      console.error('Failed to fetch shop info');
      return Response.redirect(`${url.origin}/products?error=oauth_failed`);
    }

    const shopData = await shopResponse.json() as { shop: any };

    // Save store to database
    const storeId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO stores (id, shop_domain, access_token, scope, store_name, store_email, currency, timezone, plan_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(shop_domain) DO UPDATE SET
        access_token = excluded.access_token,
        scope = excluded.scope,
        store_name = excluded.store_name,
        store_email = excluded.store_email,
        currency = excluded.currency,
        timezone = excluded.timezone,
        plan_name = excluded.plan_name,
        updated_at = datetime('now')
    `).bind(
      storeId,
      shopDomain,
      tokenData.access_token,
      tokenData.scope || null,
      shopData.shop.name || null,
      shopData.shop.email || null,
      shopData.shop.currency || 'USD',
      shopData.shop.timezone || null,
      shopData.shop.plan_name || null
    ).run();

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
  } catch (error) {
    console.error("OAuth error:", error);
    return Response.redirect(`${url.origin}/products?error=oauth_failed`);
  }
};
