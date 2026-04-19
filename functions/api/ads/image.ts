/**
 * API endpoint for serving ad images from R2
 * GET /api/ads/image?key=ads/store-id/ad-id/image.jpg
 */

interface Env {
  R2: R2Bucket;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Only allow GET and HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response('Missing key parameter', { status: 400 });
  }

  try {
    const object = await env.R2.get(key);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // Determine content type based on extension
    const extension = key.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    const contentType = contentTypes[extension || ''] || 'image/jpeg';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': object.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    };

    // HEAD request: return headers only
    if (request.method === 'HEAD') {
      return new Response(null, { headers });
    }

    // GET request: return full response
    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error('Error serving image:', error);
    return new Response('Failed to load image', { status: 500 });
  }
};
