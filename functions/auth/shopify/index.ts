/**
 * Shopify OAuth initiation
 * GET /auth/shopify?shop=mystore.myshopify.com
 */

interface Env {
  DB: D1Database;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  APP_URL: string;
}

// Shopify OAuth scopes we need
const SCOPES = [
  'read_products',           // Product title, description, tags, type, vendor, images
  'read_product_listings',   // Published product data
  'read_content',            // Metafields and content
  'read_themes',             // Brand colors and styling
  'read_customers',          // Customer demographics (for audience insights)
  'read_orders',             // Order data (for performance tracking)
  'read_inventory',          // Stock levels
].join(',');

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("Missing shop parameter", { status: 400 });
  }

  if (!env.SHOPIFY_API_KEY || !env.SHOPIFY_API_SECRET) {
    return new Response("Shopify API credentials not configured", { status: 500 });
  }

  // Clean up shop domain
  const cleanShop = shop.replace('.myshopify.com', '').replace('https://', '').replace('http://', '');
  const shopDomain = `${cleanShop}.myshopify.com`;

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Build redirect URI
  const appUrl = env.APP_URL || url.origin;
  const redirectUri = `${appUrl}/auth/shopify/callback`;

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: env.SHOPIFY_API_KEY,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state: state,
  });

  const authUrl = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;

  // Store state in a cookie for verification (short-lived)
  const headers = new Headers();
  headers.set("Set-Cookie", `shopify_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  headers.set("Location", authUrl);

  return new Response(null, {
    status: 302,
    headers,
  });
};
