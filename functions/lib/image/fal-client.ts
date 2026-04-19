/**
 * fal.ai Image Generation Client
 *
 * Generates ad images using FLUX models via fal.ai API.
 * Primary image generation service with Gemini as fallback.
 */

// ===========================================
// TYPES
// ===========================================

export interface FalImageRequest {
  prompt: string;
  imageSize?: 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  numImages?: number;
  enableSafetyChecker?: boolean;
  seed?: number;
}

export interface FalImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

export interface FalGenerateResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Map our ad format to fal.ai image sizes
const FORMAT_TO_SIZE: Record<string, FalImageRequest['imageSize']> = {
  square: 'square',
  portrait: 'portrait_4_3',
  landscape: 'landscape_4_3',
  story: 'portrait_16_9',
};

// ===========================================
// FAL.AI CLIENT
// ===========================================

export class FalClient {
  private apiKey: string;
  private baseUrl = 'https://fal.run';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate an image using FLUX Dev model.
   * Best balance of quality and speed for ad creatives.
   */
  async generateImage(params: {
    prompt: string;
    format?: 'square' | 'portrait' | 'landscape' | 'story';
    seed?: number;
  }): Promise<FalGenerateResult> {
    const imageSize = FORMAT_TO_SIZE[params.format || 'square'] || 'square';

    try {
      const response = await fetch(`${this.baseUrl}/fal-ai/flux/dev`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
          seed: params.seed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FAL] API error:', response.status, errorText);
        return {
          success: false,
          error: `fal.ai API error: ${response.status}`,
        };
      }

      const data = await response.json() as FalImageResponse;

      if (!data.images?.length) {
        return {
          success: false,
          error: 'No images returned from fal.ai',
        };
      }

      console.log('[FAL] Generated image successfully');
      return {
        success: true,
        imageUrl: data.images[0].url,
      };
    } catch (error: any) {
      console.error('[FAL] Generation error:', error);
      return {
        success: false,
        error: error.message || 'Image generation failed',
      };
    }
  }

  /**
   * Generate a high-quality image using FLUX Pro.
   * Use for premium ad creatives where quality is paramount.
   */
  async generateImagePro(params: {
    prompt: string;
    format?: 'square' | 'portrait' | 'landscape' | 'story';
    seed?: number;
  }): Promise<FalGenerateResult> {
    const imageSize = FORMAT_TO_SIZE[params.format || 'square'] || 'square';

    try {
      const response = await fetch(`${this.baseUrl}/fal-ai/flux-pro`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
          seed: params.seed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FAL] Pro API error:', response.status, errorText);
        return {
          success: false,
          error: `fal.ai Pro API error: ${response.status}`,
        };
      }

      const data = await response.json() as FalImageResponse;

      if (!data.images?.length) {
        return {
          success: false,
          error: 'No images returned from fal.ai Pro',
        };
      }

      console.log('[FAL] Generated Pro image successfully');
      return {
        success: true,
        imageUrl: data.images[0].url,
      };
    } catch (error: any) {
      console.error('[FAL] Pro generation error:', error);
      return {
        success: false,
        error: error.message || 'Pro image generation failed',
      };
    }
  }

  /**
   * Generate a fast image using FLUX Schnell.
   * Use for quick iterations and previews.
   */
  async generateImageFast(params: {
    prompt: string;
    format?: 'square' | 'portrait' | 'landscape' | 'story';
    seed?: number;
  }): Promise<FalGenerateResult> {
    const imageSize = FORMAT_TO_SIZE[params.format || 'square'] || 'square';

    try {
      const response = await fetch(`${this.baseUrl}/fal-ai/flux/schnell`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
          seed: params.seed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FAL] Schnell API error:', response.status, errorText);
        return {
          success: false,
          error: `fal.ai Schnell API error: ${response.status}`,
        };
      }

      const data = await response.json() as FalImageResponse;

      if (!data.images?.length) {
        return {
          success: false,
          error: 'No images returned from fal.ai Schnell',
        };
      }

      console.log('[FAL] Generated Schnell image successfully');
      return {
        success: true,
        imageUrl: data.images[0].url,
      };
    } catch (error: any) {
      console.error('[FAL] Schnell generation error:', error);
      return {
        success: false,
        error: error.message || 'Fast image generation failed',
      };
    }
  }
}

/**
 * Generate an ad image with fal.ai, falling back to Gemini if needed.
 */
export async function generateAdImage(params: {
  prompt: string;
  format: 'square' | 'portrait' | 'landscape' | 'story';
  falApiKey?: string;
  geminiApiKey?: string;
  fallbackImageUrl?: string | null;
}): Promise<string | null> {
  // Try fal.ai first
  if (params.falApiKey) {
    const fal = new FalClient(params.falApiKey);
    const result = await fal.generateImage({
      prompt: params.prompt,
      format: params.format,
    });

    if (result.success && result.imageUrl) {
      console.log('[IMAGE_GEN] Provider: fal.ai FLUX Dev');
      return result.imageUrl;
    }

    console.warn('[IMAGE_GEN] fal.ai failed, trying Gemini fallback');
  }

  // Fallback to Gemini
  if (params.geminiApiKey) {
    const geminiUrl = await generateImageGemini(params.prompt, params.geminiApiKey);
    if (geminiUrl) {
      console.log('[IMAGE_GEN] Provider: Gemini (fallback)');
      return geminiUrl;
    }
  }

  // Final fallback: return product image
  console.warn('[IMAGE_GEN] All providers failed, using product image');
  return params.fallbackImageUrl || null;
}

/**
 * Gemini image generation fallback.
 */
async function generateImageGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'text/plain',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[GEMINI] API error:', response.status);
      return null;
    }

    const data = await response.json() as any;
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error('[GEMINI] Generation error:', error);
    return null;
  }
}
