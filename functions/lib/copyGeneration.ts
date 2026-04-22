/**
 * Copy Generation - Claude Sonnet
 *
 * // CLAUDE_COPY: All copy and Brand DNA via Claude Sonnet 4.6.
 * // Raw HTTP fetch only. No Anthropic SDK — Cloudflare Workers.
 *
 * // PARALLEL: Image gen and copy gen always run in parallel via Promise.allSettled.
 * // Never await image before starting copy.
 *
 * One API call produces copy for ALL variants.
 * Uses Brand DNA copy_framework for direction.
 */

import type {
  Env,
  CopyGenerationResult,
  BrandDNA,
  ProductRecord,
  ProductStyleProfile,
  AdVariant,
  StoreCategory
} from './types';
import { getCopyAngle } from './brandDna';
import { CATEGORY_VARIANTS, getVariantType } from './promptVariation';

// ===========================================
// CONSTANTS
// ===========================================

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Generate copy for all requested variants in a single API call.
 * This is more efficient and ensures consistency across variants.
 */
export async function generateCopyForVariants(
  product: ProductRecord,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  variants: AdVariant[],
  env: Env
): Promise<CopyGenerationResult> {
  if (!env.ANTHROPIC_API_KEY) {
    console.warn('[COPY_GEN] No Anthropic API key - using fallback');
    return createFallbackCopy(product, variants);
  }

  try {
    const result = await generateWithClaude(product, brandDna, productStyle, variants, env);
    return result;
  } catch (error: any) {
    console.error('[COPY_GEN] Claude failed:', error);
    return createFallbackCopy(product, variants);
  }
}

/**
 * Get category-specific copy angle for a variant.
 */
function getCategoryCopyAngle(
  category: StoreCategory,
  variant: AdVariant
): string {
  const variantType = getVariantType(category, variant);

  // Category-specific copy angles based on variant type
  const copyAngles: Record<string, string> = {
    // JEWELRY
    'PRODUCT_LUXURY_SURFACE': 'Focus on craftsmanship, materials, and timeless elegance. Speak to the feeling of wearing something precious.',
    'MODEL_WEARING_JEWELRY': 'Focus on how the piece transforms the wearer. Confidence, elegance, making a statement.',
    'EDITORIAL_CLOSE_UP': 'Focus on intimate details and the emotional meaning of the piece. Gift-worthy, heirloom quality.',

    // BEAUTY
    'PRODUCT_STYLED_SURFACE': 'Focus on ingredients, efficacy, and the ritual of self-care. Clean beauty, visible results.',
    'PRODUCT_MINIMAL_FABRIC': 'Focus on simplicity, purity, and essential skincare. Less is more, gentle effectiveness.',
    'LIFESTYLE_RITUAL': 'Focus on the feeling of the skincare moment. Morning ritual, evening wind-down, treating yourself.',

    // PETS
    'PRODUCT_WITH_ANIMAL': 'Focus on the pet-owner bond and the joy of spoiling your furry friend. Happy pets, happy owners.',
    'PRODUCT_HERO_SURFACE': 'Focus on quality, safety, and what makes this product better for your pet. Trust and reliability.',
    'LIFESTYLE_HOME': 'Focus on pets as family and the cozy home life you share. Comfort, love, everyday moments.',

    // FASHION
    'MODEL_WEARING': 'Focus on confidence, style, and how the garment makes you feel. Effortless, put-together, authentic.',
    'PRODUCT_CLEAN_HERO': 'Focus on quality, construction, and versatility. Wardrobe essential, investment piece, everyday luxury.',
    'LIFESTYLE_EDITORIAL': 'Focus on lifestyle and personality. Express yourself, stand out, your unique style.',

    // HOME
    'PRODUCT_IN_ROOM': 'Focus on how the product transforms a space. Curated home, intentional living, design that matters.',
    'PRODUCT_DETAIL_TEXTURE': 'Focus on craftsmanship, materials, and quality you can feel. Made to last, thoughtful design.',
    'LIFESTYLE_WITH_PERSON': 'Focus on moments at home. Cozy mornings, hosting friends, your sanctuary.',

    // FOOD
    'PRODUCT_WITH_INGREDIENTS': 'Focus on real ingredients, honest food, and quality you can taste. Clean eating, transparent sourcing.',
    'LIFESTYLE_CONSUMPTION': 'Focus on energy, wellness, and fueling your day. Feel good, perform better, treat yourself well.',

    // GENERAL
    'PRODUCT_LIFESTYLE_SURFACE': 'Focus on quality and how the product fits into daily life. Practical luxury, everyday essential.',
    'LIFESTYLE_CONTEXT': 'Focus on the lifestyle and aspirational feeling. Part of your story, enhances your day.'
  };

  return copyAngles[variantType] || 'Focus on the key benefit that resonates with the customer. Speak to their desire, not just features.';
}

/**
 * Generate copy using Claude Sonnet.
 */
async function generateWithClaude(
  product: ProductRecord,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  variants: AdVariant[],
  env: Env
): Promise<CopyGenerationResult> {
  const category = brandDna.store_category as StoreCategory;

  const variantInstructions = variants.map(v => {
    // Use category-specific angles
    const categoryAngle = getCategoryCopyAngle(category, v);
    // Also get brand DNA angle for additional context
    const brandAngle = getCopyAngle(brandDna, v);
    return `Variant ${v}:
  Category direction: ${categoryAngle}
  Brand angle: ${brandAngle}`;
  }).join('\n\n');

  const bannedWords = brandDna.copy_framework.banned_words.join(', ');
  const powerWords = brandDna.copy_framework.power_words.join(', ');

  const systemPrompt = `You are a senior performance marketing copywriter with 10 years experience writing viral ecommerce ads for TikTok, Instagram, and Facebook.

CATEGORY: ${category}
BRAND VOICE: ${brandDna.identity.brand_voice}
CORE VIBE: ${brandDna.identity.core_vibe}

Your copy is known for being:
- Specific to the actual product — never generic
- Emotionally resonant — speaks to how the customer FEELS
- Platform-native — TikTok copy feels like TikTok, not a billboard
- Conversion-focused — every word earns its place
- Category-appropriate — ${category} copy has its own rhythm and vocabulary

STRICT RULES — violating these makes the copy bad:
1. NEVER paraphrase the product description
2. NEVER start with the product name
3. NEVER use these banned words: ${bannedWords}
4. The headline must be a hook — a question, a bold claim, or an unexpected angle
5. Primary text must speak to the customer's desire or problem — not the product's features
6. Write AS IF you already know this product sells well — confident, not pushy
7. EVERY field must be a COMPLETE sentence or phrase — never cut off mid-word
8. Use these power words when appropriate: ${powerWords}
9. Match the brand voice: ${brandDna.identity.brand_voice} — every ad should sound like this brand

Return ONLY valid JSON with no text outside the JSON object.`;

  const userPrompt = `Generate ad copy for ${variants.length} variants of this product.

BRAND IDENTITY:
- Brand: ${brandDna.brand_name}
- Voice: ${brandDna.identity.brand_voice}
- Core Vibe: ${brandDna.identity.core_vibe}
- Category: ${brandDna.store_category}

PRODUCT:
- Name: ${product.title}
- Type: ${product.product_type || 'General'}
- Price: $${product.price_min || 0}
- Brand/Vendor: ${product.vendor || 'Independent'}
- Tags: ${product.tags || 'None'}

Product description (for CONTEXT ONLY, do not paraphrase):
${product.description?.replace(/<[^>]*>/g, '').slice(0, 400) || 'No description'}

${productStyle ? `
PRODUCT VISUAL CHARACTERISTICS:
- Color tone: ${productStyle.visual.color_tone}
- Composition: ${productStyle.visual.composition}
` : ''}

VARIANTS TO GENERATE:
${variantInstructions}

Return this exact JSON structure:
{
  "variants": [
${variants.map(v => `    {
      "variant": "${v}",
      "headline": "max 40 chars — hook that stops scrolling",
      "primaryText": "max 125 chars — desire/problem focused",
      "description": "max 90 chars — social proof or urgency",
      "cta": "Shop Now"
    }`).join(',\n')}
  ]
}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ text: string }>;
  };

  const content = data.content?.[0]?.text;
  if (!content) {
    throw new Error('No content in Claude response');
  }

  // Parse JSON (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  const parsed = JSON.parse(jsonStr) as {
    variants: Array<{
      variant: string;
      headline: string;
      primaryText: string;
      description: string;
      cta: string;
    }>;
  };

  // Validate and map results
  const copyVariants = parsed.variants.map(v => ({
    variant: v.variant as AdVariant,
    headline: truncate(v.headline, 40),
    primaryText: truncate(v.primaryText, 125),
    description: truncate(v.description || '', 90),
    cta: v.cta || 'Shop Now'
  }));

  console.log('[COPY_GEN] Generated copy for', copyVariants.length, 'variants');

  return {
    success: true,
    variants: copyVariants
  };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Truncate text to max length without cutting mid-word.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace);
  }

  return truncated;
}

/**
 * Create fallback copy when Claude fails.
 */
function createFallbackCopy(
  product: ProductRecord,
  variants: AdVariant[]
): CopyGenerationResult {
  const title = product.title.split(' ').slice(0, 4).join(' ');
  const vendor = product.vendor || 'our collection';

  const fallbackVariants = variants.map(variant => {
    switch (variant) {
      case 'A':
        return {
          variant,
          headline: `The ${title} you need`,
          primaryText: `Designed for everyday use. Simple, effective, yours.`,
          description: `From ${vendor}`,
          cta: 'Shop Now'
        };
      case 'B':
        return {
          variant,
          headline: `Finally, ${title.toLowerCase()}`,
          primaryText: `The feeling when you find exactly what you were looking for.`,
          description: `Join thousands who already love it`,
          cta: 'Shop Now'
        };
      case 'C':
        return {
          variant,
          headline: `Stop scrolling.`,
          primaryText: `You've been looking for ${title.toLowerCase()}. Here it is.`,
          description: `${vendor} — the one everyone's talking about`,
          cta: 'Shop Now'
        };
    }
  });

  return {
    success: true,
    variants: fallbackVariants
  };
}

/**
 * Generate copy for a single variant (wrapper for compatibility).
 */
export async function generateCopyForVariant(
  product: ProductRecord,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile | null,
  variant: AdVariant,
  env: Env
): Promise<{
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
}> {
  const result = await generateCopyForVariants(
    product,
    brandDna,
    productStyle,
    [variant],
    env
  );

  const variantCopy = result.variants.find(v => v.variant === variant);

  if (variantCopy) {
    return {
      headline: variantCopy.headline,
      primaryText: variantCopy.primaryText,
      description: variantCopy.description,
      cta: variantCopy.cta
    };
  }

  // Ultimate fallback
  return {
    headline: `The ${product.title.split(' ').slice(0, 3).join(' ')} you need`,
    primaryText: product.description?.replace(/<[^>]*>/g, '').slice(0, 125) || `Check out ${product.title}`,
    description: `From ${product.vendor || 'our collection'}`,
    cta: 'Shop Now'
  };
}
