/**
 * A/B Testing Variants
 *
 * AB_TESTING: Always generate 3 variants.
 * Never generate a single ad in isolation.
 * Variants run in parallel via Promise.allSettled.
 *
 * Three variants generated every time:
 * - Variant A: Clean & minimal
 * - Variant B: Lifestyle contextual
 * - Variant C: Bold editorial
 */

import type {
  Gender,
  BrandStyleProfile,
  ProductStyleProfile,
  SceneRules,
  ImageGenerationResult
} from './providers';

import { generateAdImage } from './providers';

// ===========================================
// VARIANT TYPES
// ===========================================

export type AdVariant = 'A' | 'B' | 'C';

export interface VariantConfig {
  variant: AdVariant;
  sceneStyle: string;
  copyAngle: string;
  imageStyle: string;
  sceneRules: SceneRules;
}

export interface VariantResult {
  variant: AdVariant;
  success: boolean;
  imageResult: ImageGenerationResult | null;
  copyResult: {
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
  } | null;
  error?: string;
}

// ===========================================
// VARIANT DEFINITIONS
// ===========================================

export const VARIANT_CONFIGS: Record<AdVariant, Omit<VariantConfig, 'sceneRules'>> = {
  A: {
    variant: 'A',
    sceneStyle: 'clean minimal',
    copyAngle: 'benefit focused — what it does for the customer',
    imageStyle: 'studio clean background, professional lighting, minimal props'
  },
  B: {
    variant: 'B',
    sceneStyle: 'lifestyle contextual',
    copyAngle: 'emotion and desire — how the customer feels using or wearing it',
    imageStyle: 'lifestyle environment, natural setting, contextual props'
  },
  C: {
    variant: 'C',
    sceneStyle: 'bold editorial',
    copyAngle: 'curiosity and pattern interrupt — unexpected hook that stops scrolling',
    imageStyle: 'bold graphic composition, unexpected angle, strong color contrast'
  }
};

// ===========================================
// SCENE RULES BY VARIANT
// ===========================================

export function getSceneRulesForVariant(
  variant: AdVariant,
  brandStyle: BrandStyleProfile | null
): SceneRules {
  const config = VARIANT_CONFIGS[variant];

  switch (variant) {
    case 'A':
      return {
        environment: `Elegant studio setting with ${config.imageStyle}. Soft gradient backdrop with subtle depth. Premium commercial photography that makes the product the hero. Clean surfaces, refined textures, sophisticated minimalism.`,
        lighting: 'Professional studio lighting with soft fill, gentle highlights on product edges',
        specialInstructions: 'Product should feel premium and desirable. Clean but not sterile.',
        negativePromptAdditions: ['busy', 'cluttered', 'cheap', 'amateur', 'harsh shadows']
      };

    case 'B':
      return {
        environment: `Aspirational lifestyle scene with ${config.imageStyle}. ${brandStyle?.mood || 'Contemporary'} atmosphere. Natural setting that tells a story - coffee table, window light, living space. Product naturally integrated into a beautiful moment.`,
        lighting: 'Golden hour warmth, natural window light, soft ambient glow',
        specialInstructions: 'Create desire through context. Product should feel like part of an enviable lifestyle.',
        negativePromptAdditions: ['sterile', 'clinical', 'isolated', 'floating', 'disconnected']
      };

    case 'C':
      return {
        environment: `Bold creative composition with ${config.imageStyle}. ${brandStyle?.visualTone || 'Dynamic'} visual impact. Unexpected angle, artistic shadows, geometric elements. Editorial fashion magazine aesthetic.`,
        lighting: 'Dramatic directional light, bold shadows, high contrast, artistic mood',
        specialInstructions: 'Stop the scroll. Create visual intrigue that demands attention. Bold but tasteful.',
        negativePromptAdditions: ['boring', 'conventional', 'flat', 'ordinary', 'expected']
      };
  }
}

// ===========================================
// COPY PROMPT MODIFIER
// ===========================================

export function getCopyPromptForVariant(variant: AdVariant): string {
  const config = VARIANT_CONFIGS[variant];

  return `
Copy angle for this variant: ${config.copyAngle}

Variant A = benefits (what it does)
Variant B = emotion (how it feels)
Variant C = curiosity/pattern interrupt (unexpected hook)

Write specifically from the ${variant === 'A' ? 'BENEFITS' : variant === 'B' ? 'EMOTION' : 'CURIOSITY'} angle.
${variant === 'C' ? 'Be bold, unexpected, and pattern-breaking. Surprise the viewer.' : ''}
`;
}

// ===========================================
// PARALLEL VARIANT GENERATION
// ===========================================

interface GenerationParams {
  product: {
    id: string;
    store_id: string;
    title: string;
    description: string | null;
    product_type: string | null;
    vendor: string | null;
    tags: string | null;
    images: string | null;
    image_url: string | null;
    price: number | null;
  };
  gender: Gender;
  brandStyle: BrandStyleProfile | null;
  productStyle: ProductStyleProfile | null;
  env: any;  // Env type
  generateCopyFn: (
    product: any,
    env: any,
    brandStyle: BrandStyleProfile | null,
    variantPrompt: string
  ) => Promise<{
    headline: string;
    primaryText: string;
    description: string;
    cta: string;
  }>;
}

/**
 * Generate all 3 A/B variants in parallel
 */
export async function generateAllVariants(
  params: GenerationParams
): Promise<VariantResult[]> {
  const { product, gender, brandStyle, productStyle, env, generateCopyFn } = params;
  const variants: AdVariant[] = ['A', 'B', 'C'];

  console.log('[VARIANTS] Generating 3 variants in parallel...');

  const results = await Promise.allSettled(
    variants.map(async (variant) => {
      const sceneRules = getSceneRulesForVariant(variant, brandStyle);
      const copyPrompt = getCopyPromptForVariant(variant);

      console.log(`[VARIANTS] Starting variant ${variant}...`);

      // PARALLEL_EXECUTION: Image and copy generation run in parallel
      const [imageResult, copyResult] = await Promise.all([
        generateAdImage(product, gender, sceneRules, brandStyle, productStyle, env),
        generateCopyFn(product, env, brandStyle, copyPrompt)
      ]);

      console.log(`[VARIANTS] Variant ${variant} complete:`, {
        imageMethod: imageResult.method,
        hasImage: !!imageResult.finalImageUrl,
        hasCopy: !!copyResult.headline
      });

      return {
        variant,
        success: true,
        imageResult,
        copyResult
      } as VariantResult;
    })
  );

  // Process results
  return results.map((result, index) => {
    const variant = variants[index];

    if (result.status === 'fulfilled') {
      return result.value;
    }

    console.error(`[VARIANTS] Variant ${variant} failed:`, result.reason);
    return {
      variant,
      success: false,
      imageResult: null,
      copyResult: null,
      error: result.reason?.message || 'Unknown error'
    };
  });
}

/**
 * Create A/B group ID for linking variants
 */
export function createAbGroup(productId: string): string {
  return `${productId}_${Date.now()}`;
}
