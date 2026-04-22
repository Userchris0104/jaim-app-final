/**
 * Prompt Variation System
 *
 * Ensures every ad is unique through random variation pool selection
 * while staying brand-appropriate. Each generation picks randomly from
 * category-specific pools for surfaces, props, lighting, compositions,
 * and atmospheres.
 *
 * // ALWAYS_UNIQUE: Every generation uses random variation pool selection
 * // + unique seed. Same product same store = different visual every time.
 *
 * // BRAND_DNA_WINS: Brand DNA always overrides category template defaults.
 * // Category defines structure. Brand defines identity.
 */

import type { StoreCategory, AdVariant, BrandDNA } from './types';
import { createHash } from 'crypto';

// ===========================================
// CATEGORY VARIANT TYPE MAPPING
// ===========================================

export type VariantType =
  // JEWELRY
  | 'PRODUCT_LUXURY_SURFACE'
  | 'MODEL_WEARING_JEWELRY'
  | 'EDITORIAL_CLOSE_UP'
  // BEAUTY
  | 'PRODUCT_STYLED_SURFACE'
  | 'PRODUCT_MINIMAL_FABRIC'
  | 'LIFESTYLE_RITUAL'
  // PETS
  | 'PRODUCT_WITH_ANIMAL'
  | 'PRODUCT_HERO_SURFACE'
  | 'LIFESTYLE_HOME'
  // FASHION
  | 'MODEL_WEARING'
  | 'PRODUCT_CLEAN_HERO'
  | 'LIFESTYLE_EDITORIAL'
  // HOME
  | 'PRODUCT_IN_ROOM'
  | 'PRODUCT_DETAIL_TEXTURE'
  | 'LIFESTYLE_WITH_PERSON'
  // FOOD
  | 'PRODUCT_WITH_INGREDIENTS'
  | 'LIFESTYLE_CONSUMPTION'
  // GENERAL
  | 'PRODUCT_LIFESTYLE_SURFACE'
  | 'LIFESTYLE_CONTEXT';

export const CATEGORY_VARIANTS: Record<StoreCategory, Record<AdVariant, VariantType>> = {
  JEWELRY: {
    A: 'PRODUCT_LUXURY_SURFACE',
    B: 'MODEL_WEARING_JEWELRY',
    C: 'EDITORIAL_CLOSE_UP'
  },
  BEAUTY: {
    A: 'PRODUCT_STYLED_SURFACE',
    B: 'PRODUCT_MINIMAL_FABRIC',
    C: 'LIFESTYLE_RITUAL'
  },
  PETS: {
    A: 'PRODUCT_WITH_ANIMAL',
    B: 'PRODUCT_HERO_SURFACE',
    C: 'LIFESTYLE_HOME'
  },
  FASHION: {
    A: 'MODEL_WEARING',
    B: 'PRODUCT_CLEAN_HERO',
    C: 'LIFESTYLE_EDITORIAL'
  },
  HOME: {
    A: 'PRODUCT_IN_ROOM',
    B: 'PRODUCT_DETAIL_TEXTURE',
    C: 'LIFESTYLE_WITH_PERSON'
  },
  FOOD: {
    A: 'PRODUCT_WITH_INGREDIENTS',
    B: 'PRODUCT_CLEAN_HERO',
    C: 'LIFESTYLE_CONSUMPTION'
  },
  GENERAL: {
    A: 'PRODUCT_CLEAN_HERO',
    B: 'PRODUCT_LIFESTYLE_SURFACE',
    C: 'LIFESTYLE_CONTEXT'
  },
  // Map additional categories to closest match
  TECH: {
    A: 'PRODUCT_CLEAN_HERO',
    B: 'PRODUCT_LIFESTYLE_SURFACE',
    C: 'LIFESTYLE_CONTEXT'
  },
  SPORTS: {
    A: 'PRODUCT_CLEAN_HERO',
    B: 'LIFESTYLE_EDITORIAL',
    C: 'LIFESTYLE_CONTEXT'
  },
  KIDS: {
    A: 'PRODUCT_CLEAN_HERO',
    B: 'PRODUCT_LIFESTYLE_SURFACE',
    C: 'LIFESTYLE_HOME'
  }
};

// ===========================================
// VARIATION POOLS BY CATEGORY
// ===========================================

export interface VariationPools {
  surfaces: string[];
  props: string[];
  lighting: string[];
  compositions: string[];
  atmospheres: string[];
}

export interface VariationSelection {
  surface: string;
  prop: string;
  lighting: string;
  composition: string;
  atmosphere: string;
}

const JEWELRY_POOLS: VariationPools = {
  surfaces: [
    'warm Carrara marble with subtle grey veins',
    'deep black polished stone',
    'soft ivory silk fabric with gentle folds',
    'aged brass tray with patina texture',
    'raw concrete with warm tones',
    'pale pink quartz surface',
    'dark walnut wood with fine grain',
    'frosted glass with subtle light diffusion',
    'cream linen with natural texture',
    'copper-toned metallic surface'
  ],
  props: [
    'a single dried rose petal nearby',
    'soft eucalyptus leaves in background',
    'a small ceramic dish beside it',
    'delicate baby breath flowers',
    'a folded piece of silk ribbon',
    'small smooth river stones',
    'a sprig of dried lavender',
    'nothing — pure negative space',
    'a single fresh gardenia petal',
    'a small vintage perfume bottle'
  ],
  lighting: [
    'single spotlight from upper right',
    'soft diffused window light from left',
    'warm candlelit glow',
    'dramatic rim light from behind',
    'cool blue-tinted studio light',
    'warm golden hour side light',
    'twin soft boxes even lighting',
    'single harsh overhead spot',
    'bounced reflector fill light',
    'natural overcast diffused light'
  ],
  compositions: [
    'centered with generous negative space',
    'rule of thirds piece in lower right',
    'macro close-up filling the frame',
    'slight overhead angle flat lay style',
    'three quarter angle showing depth',
    'extreme close-up on detail only',
    'wide shot with breathing room',
    'diagonal composition dynamic feel',
    'symmetrical centered composition',
    'piece at edge dramatic negative space'
  ],
  atmospheres: [
    'intimate and precious mood',
    'bold and dramatic atmosphere',
    'soft and romantic feeling',
    'minimal and architectural',
    'warm and celebratory',
    'cool and editorial',
    'mysterious and moody',
    'clean and contemporary',
    'luxurious and indulgent',
    'quiet and contemplative'
  ]
};

const BEAUTY_POOLS: VariationPools = {
  surfaces: [
    'warm light oak circular wooden tray',
    'pale pink Carrara marble slab',
    'soft cream linen cloth',
    'smooth white ceramic surface',
    'warm travertine stone',
    'light grey concrete with warmth',
    'natural rattan woven texture',
    'frosted white acrylic',
    'pale blush terrazzo',
    'raw linen with irregular weave'
  ],
  props: [
    'dried chamomile flowers scattered nearby',
    'a small smooth white pebble',
    'fresh eucalyptus sprig to the side',
    'a ceramic matcha bowl nearby',
    'dried lavender bundle behind',
    'small glass dropper beside it',
    'a single fresh rose petal',
    'no props — pure minimal',
    'small bamboo spoon nearby',
    'a folded white muslin cloth'
  ],
  lighting: [
    'soft morning window light from left',
    'overhead diffused natural daylight',
    'warm golden hour side light',
    'cool clean studio overhead light',
    'bounced natural light even and soft',
    'single window with sheer curtain',
    'warm lamp light from lower right',
    'blue hour cool soft light',
    'overcast sky diffused outdoor light',
    'warm candle-adjacent ambient glow'
  ],
  compositions: [
    'product centered props framing it',
    'product off-center breathing room right',
    'flat lay overhead symmetrical',
    'slight angle showing label clearly',
    'close-up on texture and detail',
    'wide shot showing full context',
    'product in foreground scene behind',
    'minimal product and one prop only',
    'product on tray full tray visible',
    'macro showing product material quality'
  ],
  atmospheres: [
    'pure and clean morning ritual',
    'warm indulgent self-care moment',
    'clinical clean efficacy focus',
    'organic natural earthy feeling',
    'luxurious spa-like atmosphere',
    'fresh and energising morning',
    'soft romantic evening ritual',
    'minimal modern bathroom aesthetic',
    'botanical garden freshness',
    'quiet meditative calm'
  ]
};

const PETS_POOLS: VariationPools = {
  surfaces: [
    'warm honey-toned wooden floor',
    'soft grass in a sunlit garden',
    'plush cream carpet texture',
    'natural stone patio in warm light',
    'deep forest green backdrop',
    'warm terracotta tiles',
    'light grey concrete with warmth',
    'natural jute rug texture',
    'polished dark wood floor',
    'soft outdoor grass with dew'
  ],
  props: [
    'warm afternoon sunlight casting shadows',
    'soft bokeh of garden in background',
    'blurred sofa visible in background',
    'a favourite toy nearby',
    'bowl of water catching light',
    'autumn leaves on the ground',
    'house plants softly blurred behind',
    'white wall with warm shadow',
    'window light creating golden strip',
    'nothing extra pure product focus'
  ],
  lighting: [
    'warm afternoon window light',
    'bright cheerful morning sunlight',
    'soft overcast outdoor light',
    'golden hour warm glow',
    'clean studio with warm fill',
    'natural indoor ambient light',
    'dappled garden light through leaves',
    'bright even natural daylight',
    'warm lamp light in home setting',
    'cool blue morning light'
  ],
  compositions: [
    'product centered animal filling frame',
    'animal portrait with product prominent',
    'wide shot showing full home context',
    'close up on product with animal nearby',
    'animal looking toward product',
    'product hero animal softly behind',
    'dynamic angle showing product in use',
    'eye level with the animal',
    'overhead showing product and animal',
    'intimate close crop on product detail'
  ],
  atmospheres: [
    'cozy and loving home warmth',
    'playful and energetic joy',
    'peaceful and contented calm',
    'proud pet owner satisfaction',
    'fun and lighthearted mood',
    'warm family home feeling',
    'adventurous outdoor spirit',
    'luxurious pet pampering vibe',
    'everyday life naturalness',
    'excited anticipation energy'
  ]
};

const FASHION_POOLS: VariationPools = {
  surfaces: [
    'clean seamless white paper backdrop',
    'light grey concrete studio wall',
    'warm exposed brick background',
    'minimal white studio with wood floor',
    'urban rooftop with city behind',
    'natural outdoor with soft greenery',
    'industrial warehouse aesthetic',
    'clean Scandinavian interior',
    'dark dramatic studio backdrop',
    'bright airy minimal white space'
  ],
  props: [
    'nothing pure product focus',
    'subtle architectural element nearby',
    'natural light and shadow only',
    'minimal furniture in background',
    'urban environment as context',
    'nature as soft background',
    'strong geometric shadow',
    'mirror reflection element',
    'doorway or archway framing',
    'window light creating strong shadow'
  ],
  lighting: [
    'soft diffused studio light',
    'strong directional side light',
    'natural outdoor bright light',
    'dramatic overhead spotlight',
    'golden hour warm outdoor light',
    'cool blue overcast daylight',
    'split lighting half shadow',
    'backlit silhouette rim light',
    'bounced clean white light',
    'mixed natural and artificial'
  ],
  compositions: [
    'full length model shot',
    'mid torso crop showing garment detail',
    'close crop on specific detail',
    'three quarter standing pose',
    'dynamic movement shot',
    'relaxed casual natural pose',
    'strong editorial straight on',
    'turned profile showing silhouette',
    'seated or leaning pose',
    'overhead flat lay of garment'
  ],
  atmospheres: [
    'confident editorial cool',
    'warm aspirational lifestyle',
    'minimal clean modern',
    'bold dramatic fashion',
    'casual relaxed approachable',
    'sophisticated understated luxury',
    'young energetic contemporary',
    'classic timeless elegance',
    'avant-garde experimental',
    'authentic real-world natural'
  ]
};

const HOME_POOLS: VariationPools = {
  surfaces: [
    'warm honey oak wooden floor',
    'light grey linen sofa context',
    'marble kitchen counter surface',
    'warm terracotta tile floor',
    'natural sisal or jute rug',
    'polished concrete floor',
    'white painted floorboard',
    'dark walnut shelf or surface',
    'natural stone patio surface',
    'pale Scandinavian pine floor'
  ],
  props: [
    'a steaming coffee mug nearby',
    'fresh flowers in simple vase',
    'an open book beside the product',
    'soft throw blanket in background',
    'house plant adding life to scene',
    'natural morning light only',
    'candle creating warm atmosphere',
    'stack of design books nearby',
    'minimal ceramic objects',
    'nothing let the product breathe'
  ],
  lighting: [
    'warm afternoon window light',
    'soft morning diffused sunlight',
    'cozy lamp light in evening',
    'bright clean midday light',
    'golden hour warm glow',
    'overcast soft natural light',
    'dramatic side light through blinds',
    'even soft studio-like daylight',
    'warm candlelit ambient glow',
    'cool blue morning light'
  ],
  compositions: [
    'product as hero in full room context',
    'close detail showing material quality',
    'lifestyle moment with person',
    'styled vignette with complementary objects',
    'wide room shot product prominent',
    'overhead flat lay of styled surface',
    'corner of room showing product',
    'detail macro of texture',
    'product with window as backdrop',
    'symmetrical room composition'
  ],
  atmospheres: [
    'cozy Sunday morning warmth',
    'clean contemporary minimal',
    'warm Scandinavian hygge',
    'bold maximalist eclectic',
    'rustic natural organic',
    'modern urban sophisticated',
    'bright airy Mediterranean',
    'moody dramatic interior',
    'fresh spring clean feeling',
    'rich autumnal warm tones'
  ]
};

const FOOD_POOLS: VariationPools = {
  surfaces: [
    'warm rustic wooden chopping board',
    'dark slate surface with texture',
    'white marble with grey veins',
    'natural linen tablecloth',
    'warm terracotta ceramic surface',
    'light oak wooden table',
    'dark walnut with warm grain',
    'speckled concrete kitchen counter',
    'white subway tile background',
    'natural stone with rough texture'
  ],
  props: [
    'fresh natural ingredients scattered nearby',
    'a wooden spoon or utensil beside it',
    'fresh herbs as garnish nearby',
    'small ceramic bowl with ingredients',
    'a glass of water catching light',
    'linen napkin folded nearby',
    'fresh fruit slice beside product',
    'nothing clean product focus',
    'small jar of related ingredient',
    'a few scattered seeds or nuts'
  ],
  lighting: [
    'overhead natural window light',
    'warm side light creating appetite appeal',
    'soft diffused studio overhead',
    'golden warm natural light',
    'bright clean food photography light',
    'dramatic single side light',
    'cool fresh morning light',
    'warm afternoon kitchen window',
    'even bounced white light',
    'natural outdoor picnic light'
  ],
  compositions: [
    'product hero centered with ingredients',
    'flat lay overhead symmetrical',
    'slight angle showing product label',
    'close macro on texture and detail',
    'wide table scene with full context',
    'product pouring or in use moment',
    'single product strong negative space',
    'product with prepared food nearby',
    'lifestyle table setting context',
    'stack or arrangement of products'
  ],
  atmospheres: [
    'fresh and appetite-appealing natural',
    'warm indulgent treat yourself mood',
    'clean healthy wellness energy',
    'rustic artisan crafted feeling',
    'bright fresh morning energy',
    'cozy comfort food warmth',
    'premium gourmet sophistication',
    'playful and fun food energy',
    'honest wholesome real ingredients',
    'bold flavourful vibrant mood'
  ]
};

const GENERAL_POOLS: VariationPools = {
  surfaces: [
    'clean white studio surface',
    'warm wooden table',
    'light grey concrete',
    'soft fabric texture',
    'marble with subtle veins',
    'natural outdoor setting',
    'minimal home interior',
    'textured paper backdrop',
    'polished surface',
    'neutral lifestyle context'
  ],
  props: [
    'nothing pure product focus',
    'subtle complementary object',
    'natural greenery nearby',
    'lifestyle context element',
    'minimal styling only',
    'warm light and shadow',
    'soft fabric accent',
    'simple geometric shape',
    'natural texture detail',
    'everyday life context'
  ],
  lighting: [
    'soft diffused natural light',
    'clean studio overhead',
    'warm side window light',
    'bright even daylight',
    'golden hour warmth',
    'cool contemporary light',
    'dramatic directional light',
    'natural ambient light',
    'bounced soft light',
    'mixed warm and cool'
  ],
  compositions: [
    'centered hero product shot',
    'rule of thirds placement',
    'lifestyle context wide',
    'detail close-up',
    'flat lay overhead',
    'angled dynamic view',
    'environmental context',
    'minimal negative space',
    'full product visible',
    'cropped detail focus'
  ],
  atmospheres: [
    'clean and modern',
    'warm and inviting',
    'minimal and refined',
    'lifestyle and aspirational',
    'bold and confident',
    'soft and approachable',
    'premium quality feel',
    'everyday practical',
    'fresh and energetic',
    'trusted and reliable'
  ]
};

// ===========================================
// POOL LOOKUP
// ===========================================

export function getVariationPools(category: StoreCategory): VariationPools {
  switch (category) {
    case 'JEWELRY':
      return JEWELRY_POOLS;
    case 'BEAUTY':
      return BEAUTY_POOLS;
    case 'PETS':
      return PETS_POOLS;
    case 'FASHION':
      return FASHION_POOLS;
    case 'HOME':
      return HOME_POOLS;
    case 'FOOD':
      return FOOD_POOLS;
    default:
      return GENERAL_POOLS;
  }
}

// ===========================================
// VARIATION SELECTION
// ===========================================

/**
 * Select random variations from pools.
 * Returns unique combination for this generation.
 */
export function selectVariation(pools: VariationPools): VariationSelection {
  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  return {
    surface: rand(pools.surfaces),
    prop: rand(pools.props),
    lighting: rand(pools.lighting),
    composition: rand(pools.compositions),
    atmosphere: rand(pools.atmospheres)
  };
}

/**
 * Generate unique seed for this generation.
 */
export function generateUniqueSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Generate hash of prompt components for duplicate detection.
 */
export function generatePromptHash(
  category: StoreCategory,
  variantType: VariantType,
  surface: string,
  prop: string,
  lighting: string,
  atmosphere: string,
  brandDnaVersion: number
): string {
  const components = [
    category,
    variantType,
    surface.slice(0, 20),
    prop.slice(0, 20),
    lighting.slice(0, 20),
    atmosphere.slice(0, 20),
    brandDnaVersion.toString()
  ].join('|');

  // Simple hash for Cloudflare Workers (no crypto.createHash)
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ===========================================
// BASE PROMPTS PER CATEGORY/VARIANT TYPE
// ===========================================

export const BASE_PROMPTS: Record<VariantType, string> = {
  // JEWELRY
  PRODUCT_LUXURY_SURFACE: `Luxury jewelry product photography. The piece resting naturally on a surface. Soft warm light with authentic shadows. The jewelry is sharp and the absolute hero. High-end commercial jewelry photography.`,

  MODEL_WEARING_JEWELRY: `Luxury jewelry editorial. An elegant hand or model wearing this exact piece. Dark moody studio background. Dramatic soft light on the jewelry. Magazine editorial quality.`,

  EDITORIAL_CLOSE_UP: `Intimate jewelry macro photography. The piece on soft fabric. Generous negative space for text. Warm diffused light, no harsh shadows. Shallow depth of field, dreamy edges. The piece is perfectly sharp.`,

  // BEAUTY
  PRODUCT_STYLED_SURFACE: `Premium skincare product photography. The product on a warm natural surface. Natural props arranged organically nearby. Soft warm morning light from one side. Product label sharp and clearly readable. Premium beauty aesthetic.`,

  PRODUCT_MINIMAL_FABRIC: `Minimalist beauty product photography. The product on soft linen or cotton fabric. One or two minimal props maximum. Soft diffused overhead natural light. Clean and pure. Generous breathing room.`,

  LIFESTYLE_RITUAL: `Lifestyle skincare photography. A woman in a white or silk robe near a bright window with sheer curtains. Eyes closed, hands gently on face or neck. Warm natural morning light. A small wooden tray with skincare items subtly visible in lower frame corner. Peaceful aspirational ritual mood.`,

  // PETS
  PRODUCT_WITH_ANIMAL: `Cozy lifestyle pet photography. A happy dog with this exact product. Warm sunlit home interior, wooden floors. The product color and texture clearly visible. Warm inviting peaceful atmosphere.`,

  PRODUCT_HERO_SURFACE: `Clean pet product photography. The product on a natural surface. Clear simple well-lit composition. Product branding clearly visible.`,

  LIFESTYLE_HOME: `Warm lifestyle pet product photography. The product in a cozy home setting. Wooden floor, afternoon sunlight. A feeling that a beloved pet lives here. Product is the focal point.`,

  // FASHION
  MODEL_WEARING: `Fashion editorial photography. A stylish model wearing this exact garment. Pattern color and details preserved faithfully. Clean neutral studio or lifestyle setting. Natural confident pose. Commercial fashion photography quality.`,

  PRODUCT_CLEAN_HERO: `Minimalist fashion product photography. The garment on a neutral or white background. Soft studio lighting. All fabric details and construction visible. Clean simple product-focused composition.`,

  LIFESTYLE_EDITORIAL: `Lifestyle fashion photography. The garment in a natural urban or outdoor editorial environment. Warm natural light. The garment is the clear focal point. Creative editorial, full of personality.`,

  // HOME
  PRODUCT_IN_ROOM: `Interior lifestyle photography. This product naturally placed in a beautifully styled home environment. Warm ambient lighting, complementary furniture and props softly visible. The product is the room focal point. Interior design magazine quality.`,

  PRODUCT_DETAIL_TEXTURE: `Product detail photography for home goods. Close-up emphasizing material quality, texture, and craftsmanship. Warm natural side lighting revealing texture. Simple neutral background. The quality of the material is the story.`,

  LIFESTYLE_WITH_PERSON: `Lifestyle home photography. A person relaxing naturally with this product. Sunday morning aesthetic. Coffee, natural light, comfortable, unhurried. The product is central to the scene. Warm inviting aspirational home lifestyle.`,

  // FOOD
  PRODUCT_WITH_INGREDIENTS: `Natural food product photography. The product on a warm natural surface. Fresh natural ingredients related to the product scattered organically around it. Natural lighting. Wholesome honest mood. Product packaging sharp and central.`,

  LIFESTYLE_CONSUMPTION: `Active wellness lifestyle photography. A person in a wellness or kitchen context with this product nearby or in hand. Morning light, clean kitchen or outdoor. Healthy energetic positive mood. Product clearly visible in the scene.`,

  // GENERAL
  PRODUCT_LIFESTYLE_SURFACE: `Lifestyle product photography. The product on a warm styled surface. Complementary props and natural light. Premium everyday aesthetic.`,

  LIFESTYLE_CONTEXT: `Lifestyle context photography. The product in natural use or setting. Real world feeling with premium execution. The product is the clear hero.`
};

// ===========================================
// ASSEMBLED PROMPT BUILDER
// ===========================================

/**
 * Build complete prompt with variations and brand DNA override.
 *
 * ORDER (always this order):
 * 1. Base category prompt (structure only)
 * 2. Specific variation details
 * 3. Brand DNA override (ALWAYS WINS)
 * 4. Product style hints
 * 5. Seasonal context if active
 * 6. Creative freedom instruction
 */
export function buildCategoryPrompt(
  variantType: VariantType,
  variation: VariationSelection,
  brandDna: BrandDNA,
  productStyleHint?: string,
  seasonalContext?: string
): string {
  const parts: string[] = [];

  // 1. Base category prompt
  const basePrompt = BASE_PROMPTS[variantType];
  parts.push(basePrompt);

  // 2. Specific variation details
  parts.push(`Surface: ${variation.surface}.`);
  if (variation.prop !== 'nothing — pure negative space' &&
      variation.prop !== 'nothing pure product focus' &&
      variation.prop !== 'no props — pure minimal') {
    parts.push(`Props: ${variation.prop}.`);
  }
  parts.push(`Lighting: ${variation.lighting}.`);
  parts.push(`Composition: ${variation.composition}.`);
  parts.push(`Mood: ${variation.atmosphere}.`);

  // 3. Brand DNA override (ALWAYS WINS)
  parts.push(`

BRAND IDENTITY OVERRIDE — HIGHEST PRIORITY:
Core vibe: ${brandDna.identity.core_vibe}.
Colors: ${brandDna.identity.primary_palette.join(', ')} — use these tones.
Lighting preference: ${brandDna.visual_language.lighting_profile.type}, ${brandDna.visual_language.lighting_profile.temperature} temperature.
Background style: ${brandDna.visual_language.background_preference}.

Adapt the scene variations above to match this brand identity. If a variation element conflicts with the brand palette or mood, adjust it — never compromise brand consistency. A customer who knows this brand must immediately recognise this as their brand.`);

  // 4. Product style hints
  if (productStyleHint) {
    parts.push(`Product context: ${productStyleHint}`);
  }

  // 5. Seasonal context
  if (seasonalContext) {
    parts.push(`Seasonal mood: ${seasonalContext}`);
  }

  // 6. Creative freedom instruction
  parts.push(`Apply creative judgment within these constraints. The result should feel original, not templated.`);

  return parts.join(' ');
}

/**
 * Get variant type for a category and variant letter.
 */
export function getVariantType(
  category: StoreCategory,
  variant: AdVariant
): VariantType {
  const categoryVariants = CATEGORY_VARIANTS[category] || CATEGORY_VARIANTS.GENERAL;
  return categoryVariants[variant];
}

/**
 * Check if variant type requires lifestyle/model (text-to-image)
 * vs product edit (edit endpoint).
 */
export function requiresTextToImage(variantType: VariantType): boolean {
  const textToImageTypes: VariantType[] = [
    'LIFESTYLE_RITUAL',      // BEAUTY C - model scene
    'LIFESTYLE_CONSUMPTION', // FOOD C - model scene
    'LIFESTYLE_WITH_PERSON', // HOME C - model scene
    'MODEL_WEARING',         // FASHION A - model wearing
    'MODEL_WEARING_JEWELRY'  // JEWELRY B - model wearing
  ];

  return textToImageTypes.includes(variantType);
}
