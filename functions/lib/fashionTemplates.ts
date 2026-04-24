/**
 * Fashion Ad Templates - Template-Based Generation System
 *
 * 15 fashion ad templates with visual scene prompts only.
 * Text overlays are handled separately by adCompositor.ts
 *
 * USAGE:
 * 1. getTemplateById('T01_EDITORIAL_HERO') → template object
 * 2. injectTemplateFields(template.promptTemplate, fields) → final prompt
 * 3. Send to Gemini with product image
 * 4. Use adCompositor to add text overlays to the result
 *
 * IMPORTANT - NO TEXT IN PROMPTS:
 * Gemini cannot reliably render text in images.
 * All text overlays (brand name, headline, CTA) are rendered
 * via canvas compositing AFTER Gemini returns the image.
 *
 * PRODUCT INTEGRATION:
 * Every prompt explicitly instructs Gemini to integrate Image 1
 * (the product) INTO the scene, not alongside it.
 */

// ===========================================
// TYPES
// ===========================================

export interface FashionTemplate {
  id: string;
  name: string;
  description: string;
  placement: string[];
  hasModel: boolean;
  hasTextOverlay: boolean;
  promptTemplate: string;
  dynamicFields: string[];
  // Text overlay configuration (for adCompositor)
  textConfig: TextOverlayConfig;
}

export interface TextOverlayConfig {
  brandPosition: 'top-left' | 'top-right' | 'bottom-left';
  headlinePosition: 'top' | 'center' | 'bottom';
  headlineStyle: 'bold-sans' | 'elegant-serif' | 'condensed' | 'magazine';
  ctaStyle: 'pill-button' | 'text-arrow' | 'minimal';
  overlayTheme: 'light-on-dark' | 'dark-on-light' | 'auto';
}

export type TemplateId =
  | 'T01_EDITORIAL_HERO'
  | 'T02_LIFESTYLE_STREET'
  | 'T03_CLEAN_PRODUCT_HERO'
  | 'T04_PROMOTIONAL_SALE'
  | 'T05_FLAT_LAY_CAPSULE'
  | 'T06_LUXURY_EDITORIAL'
  | 'T07_NEW_SEASON_LAUNCH'
  | 'T08_SOCIAL_PROOF'
  | 'T09_DETAIL_CLOSEUP'
  | 'T10_VERSATILITY_SHOWCASE'
  | 'T11_SUSTAINABLE_STORY'
  | 'T12_BOLD_COLOR_POP'
  | 'T13_GOLDEN_HOUR'
  | 'T14_MENSWEAR_MAGAZINE'
  | 'T15_COLLECTION_DROP';

// ===========================================
// TEMPLATE DEFINITIONS
// ===========================================

export const FASHION_TEMPLATES: FashionTemplate[] = [
  // -------------------------------------------
  // T01 — THE EDITORIAL HERO
  // -------------------------------------------
  {
    id: 'T01_EDITORIAL_HERO',
    name: 'Editorial Hero',
    description: 'Model wearing product, clean studio, works for all fashion',
    placement: ['feed_4x5'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE', 'GENDER'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'bottom',
      headlineStyle: 'bold-sans',
      ctaStyle: 'text-arrow',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on their body
- Preserve the garment exactly: same color, same fabric, same fit
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be clearly visible and recognizable

SCENE REQUIREMENTS:
- A [GENDER] model wearing this exact garment
- Shot from mid-torso up, model looking directly at camera
- Studio setting with single-tone warm backdrop (cream, beige, or warm gray)
- Soft directional lighting from upper left
- Natural confident pose
- [BRAND_VIBE] aesthetic throughout

OUTPUT: Professional fashion photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T02 — THE LIFESTYLE STREET
  // -------------------------------------------
  {
    id: 'T02_LIFESTYLE_STREET',
    name: 'Lifestyle Street',
    description: 'Model in urban setting, candid and authentic feel',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE', 'GENDER'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'bold-sans',
      ctaStyle: 'pill-button',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a lifestyle fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on their body
- Preserve the garment exactly: same color, same fabric, same fit
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be clearly visible and recognizable

SCENE REQUIREMENTS:
- A [GENDER] model wearing this exact garment
- Setting: sunlit city street or café terrace
- Warm natural daylight, golden hour feel
- Candid relaxed pose - walking or mid-movement
- Natural authentic expression, not posed
- Shallow depth of field, urban background softly blurred
- [BRAND_VIBE] energy throughout

OUTPUT: Editorial lifestyle photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T03 — THE CLEAN PRODUCT HERO
  // -------------------------------------------
  {
    id: 'T03_CLEAN_PRODUCT_HERO',
    name: 'Clean Product Hero',
    description: 'Product only, no model, clean studio background',
    placement: ['feed_4x5', 'catalog'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'elegant-serif',
      ctaStyle: 'pill-button',
      overlayTheme: 'dark-on-light'
    },
    promptTemplate: `You are creating a product-focused fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment as the hero of the image
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- Every seam, texture, and detail must be sharp and visible

SCENE REQUIREMENTS:
- NO model - product only
- Garment displayed beautifully: folded naturally OR hanging flat
- Seamless studio background in soft neutral (white, cream, or light gray)
- Professional studio lighting highlighting texture and details
- Clean, minimal, premium feel
- [BRAND_VIBE] aesthetic

OUTPUT: High-end commercial product photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T04 — THE PROMOTIONAL SALE
  // -------------------------------------------
  {
    id: 'T04_PROMOTIONAL_SALE',
    name: 'Promotional Sale',
    description: 'Product with dramatic lighting for sale emphasis',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'condensed',
      ctaStyle: 'pill-button',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a promotional fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment as the hero of the image
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- Garment must be sharp and eye-catching

SCENE REQUIREMENTS:
- NO model - product only
- Deep rich background (charcoal, navy, or burgundy)
- Dramatic product lighting creating visual impact
- Garment positioned attractively as the focal point
- Bold, graphic, commercial feel
- High contrast for scroll-stopping impact

OUTPUT: Bold commercial fashion photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T05 — THE FLAT LAY CAPSULE
  // -------------------------------------------
  {
    id: 'T05_FLAT_LAY_CAPSULE',
    name: 'Flat Lay Capsule',
    description: 'Overhead styled flat lay with complementary accessories',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'elegant-serif',
      ctaStyle: 'text-arrow',
      overlayTheme: 'dark-on-light'
    },
    promptTemplate: `You are creating a flat lay fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. This is the HERO item of the flat lay.

CRITICAL PRODUCT RULES:
- This EXACT garment must be the CENTER and HERO of the flat lay
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The hero garment must be most prominent and clearly visible

SCENE REQUIREMENTS:
- Overhead flat lay photograph, camera perfectly perpendicular
- Hero garment from Image 1 laid flat as the CENTER piece
- Complement with 2-3 unbranded accessories arranged naturally around it
- Surface: warm oak wood, marble, or natural linen
- Single botanical prop at edge (eucalyptus sprig, dried flower)
- Even soft natural overhead light
- [BRAND_VIBE] styling, nothing cluttered

OUTPUT: Editorial flat lay photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T06 — THE LUXURY EDITORIAL
  // -------------------------------------------
  {
    id: 'T06_LUXURY_EDITORIAL',
    name: 'Luxury Editorial',
    description: 'Model in architectural setting, premium and aspirational',
    placement: ['feed_4x5'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE', 'GENDER'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'bottom',
      headlineStyle: 'elegant-serif',
      ctaStyle: 'minimal',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a luxury editorial fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on their body
- Preserve the garment exactly: same color, same fabric, same construction
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be the focal point of the composition

SCENE REQUIREMENTS:
- A [GENDER] model wearing this exact garment
- Setting: architectural interior - marble, minimalist gallery, or luxury space
- Dramatic single light source creating deep shadows
- Portrait from chest up
- Model: confident, authoritative, direct gaze at camera
- [BRAND_VIBE] aesthetic, premium and aspirational

OUTPUT: Luxury editorial photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T07 — THE NEW SEASON LAUNCH
  // -------------------------------------------
  {
    id: 'T07_NEW_SEASON_LAUNCH',
    name: 'New Season Launch',
    description: 'Seasonal campaign style, magazine editorial feel',
    placement: ['feed_4x5'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE', 'GENDER', 'SEASON'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'magazine',
      ctaStyle: 'pill-button',
      overlayTheme: 'auto'
    },
    promptTemplate: `You are creating a seasonal campaign fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on their body
- Preserve the garment exactly: same color, same fabric, same fit
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be clearly visible and styled appropriately for the season

SCENE REQUIREMENTS:
- A [GENDER] model wearing this exact garment
- Setting evokes [SEASON] naturally through lighting and atmosphere
- Spring: bright, fresh, blooming backgrounds
- Summer: warm, sun-drenched, outdoor vibes
- Autumn: warm tones, golden light, cozy feeling
- Winter: cool tones, dramatic lighting, layered styling
- Magazine editorial quality, [BRAND_VIBE] aesthetic

OUTPUT: Seasonal campaign photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T08 — THE SOCIAL PROOF STAMP
  // -------------------------------------------
  {
    id: 'T08_SOCIAL_PROOF',
    name: 'Social Proof Stamp',
    description: 'Clean product shot optimized for trust badge overlay',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'bold-sans',
      ctaStyle: 'pill-button',
      overlayTheme: 'dark-on-light'
    },
    promptTemplate: `You are creating a product-focused fashion advertisement photograph optimized for overlay graphics.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment cleanly as the hero
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- Product must be perfectly lit and presented

SCENE REQUIREMENTS:
- NO model - product only
- Clean neutral background (white, cream, or soft gray)
- Professional studio lighting
- Garment displayed beautifully and clearly
- Leave clear space in upper corners for badge overlays
- [BRAND_VIBE] aesthetic, premium and trustworthy feel

OUTPUT: Commercial product photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T09 — THE DETAIL CLOSE-UP
  // -------------------------------------------
  {
    id: 'T09_DETAIL_CLOSEUP',
    name: 'Detail Close-Up',
    description: 'Extreme macro of fabric or garment detail, quality focus',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'bottom',
      headlineStyle: 'bold-sans',
      ctaStyle: 'text-arrow',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a detail-focused fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment's details.

CRITICAL PRODUCT RULES:
- Show an EXTREME CLOSE-UP of this exact garment's most interesting detail
- This could be: stitching, button, zipper pull, collar edge, fabric weave, texture
- Preserve the garment exactly as shown in Image 1
- If the product has a print or graphic, you may focus on that detail
- The detail must be from THIS product, not a generic garment

SCENE REQUIREMENTS:
- Extreme macro/close-up photography
- Fill 70%+ of the frame with the detail
- Dramatically sharp focus on the detail
- Side lighting to reveal texture and depth
- Deep dark or neutral background
- Rest of garment softly blurred behind the detail
- Luxury quality craftsmanship feel

OUTPUT: Luxury detail photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T10 — THE VERSATILITY SHOWCASE
  // -------------------------------------------
  {
    id: 'T10_VERSATILITY_SHOWCASE',
    name: 'Versatility Showcase',
    description: 'Three-panel showing same product styled three different ways',
    placement: ['feed_4x5'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_VIBE', 'GENDER'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'bottom',
      headlineStyle: 'bold-sans',
      ctaStyle: 'pill-button',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a versatility showcase fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. This SAME garment appears in ALL THREE panels.

CRITICAL PRODUCT RULES:
- The SAME exact garment from Image 1 must appear in all three panels
- Preserve the garment exactly in each panel: same color, same fabric, same fit
- If the product has a print, logo, or graphic, preserve it in all panels
- If the product is plain, keep it plain in all panels
- The garment must be clearly recognizable as the same item across all panels

SCENE REQUIREMENTS:
- THREE vertical panels side by side (triptych layout)
- A [GENDER] model wearing this exact garment in EACH panel
- Panel 1 (left): Casual/Day styling - relaxed, everyday look
- Panel 2 (center): Work/Smart styling - elevated, professional
- Panel 3 (right): Evening/Occasion styling - dressed up
- Clean studio background consistent across all panels
- Consistent lighting throughout
- [BRAND_VIBE] aesthetic

OUTPUT: Triptych fashion photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T11 — THE SUSTAINABLE STORY
  // -------------------------------------------
  {
    id: 'T11_SUSTAINABLE_STORY',
    name: 'Sustainable Story',
    description: 'Product with eco-friendly natural styling',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'elegant-serif',
      ctaStyle: 'text-arrow',
      overlayTheme: 'dark-on-light'
    },
    promptTemplate: `You are creating an eco-conscious fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment as the hero
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment should look natural and authentic

SCENE REQUIREMENTS:
- NO model - product only
- Natural, earthy surface: raw wood, stone, or natural linen
- Soft natural overhead light (like daylight through a window)
- Single botanical prop placed naturally beside product (eucalyptus, dried lavender, cotton branch)
- Earth tone palette throughout
- Honest, authentic, sustainable aesthetic
- Nothing artificial or overly styled

OUTPUT: Natural product photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T12 — THE BOLD COLOR POP
  // -------------------------------------------
  {
    id: 'T12_BOLD_COLOR_POP',
    name: 'Bold Color Pop',
    description: 'Product on vivid contrasting background, scroll-stopping graphic',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'condensed',
      ctaStyle: 'pill-button',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a bold, graphic fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment as the centered hero
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must pop against the bold background

SCENE REQUIREMENTS:
- NO model - product only
- Background: single VIVID bold color chosen for MAXIMUM CONTRAST to the garment
- Color options: electric orange, wasabi green, hot pink, lemon yellow, cobalt blue
- Choose the color that contrasts most with the garment's color
- Strong even studio lighting
- Product centered and sharp
- Bold, graphic, scroll-stopping impact
- High energy commercial feel

OUTPUT: Bold graphic product photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T13 — THE GOLDEN HOUR LIFESTYLE
  // -------------------------------------------
  {
    id: 'T13_GOLDEN_HOUR',
    name: 'Golden Hour Lifestyle',
    description: 'Model in outdoor golden hour, aspirational and warm',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: ['GENDER'],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'elegant-serif',
      ctaStyle: 'text-arrow',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a golden hour lifestyle fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on their body
- Preserve the garment exactly: same color, same fabric, same fit
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be clearly visible despite the backlit conditions

SCENE REQUIREMENTS:
- A [GENDER] model wearing this exact garment
- Outdoor setting: park, beach, field, or terrace
- GOLDEN HOUR lighting - late afternoon sun
- Warm golden rim light from behind/side of model
- Model looking away or candid, relaxed expression
- Aspirational, dreamy, warm atmosphere
- Amber and golden tones throughout
- Lifestyle photography feel

OUTPUT: Golden hour lifestyle photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T14 — THE MENSWEAR MAGAZINE
  // -------------------------------------------
  {
    id: 'T14_MENSWEAR_MAGAZINE',
    name: 'Menswear Magazine',
    description: 'Male model, magazine cover format, premium menswear feel',
    placement: ['feed_4x5'],
    hasModel: true,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'bottom',
      headlineStyle: 'magazine',
      ctaStyle: 'minimal',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a menswear magazine-style fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- The model must be WEARING this exact garment on his body
- Preserve the garment exactly: same color, same fabric, same construction
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must be styled appropriately for premium menswear

SCENE REQUIREMENTS:
- A MALE model wearing this exact garment
- Setting: clean dark architectural interior
- Strong single directional light creating dramatic shadows
- Portrait from chest up
- Direct, confident gaze at camera
- Magazine cover quality composition
- Premium menswear editorial aesthetic
- Deep, rich, masculine color palette

OUTPUT: Premium menswear photography, 4:5 vertical format, no text or graphics overlay.`
  },

  // -------------------------------------------
  // T15 — THE COLLECTION DROP
  // -------------------------------------------
  {
    id: 'T15_COLLECTION_DROP',
    name: 'Collection Drop',
    description: 'Dramatic dark product shot, drop announcement style',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: [],
    textConfig: {
      brandPosition: 'top-left',
      headlinePosition: 'top',
      headlineStyle: 'condensed',
      ctaStyle: 'pill-button',
      overlayTheme: 'light-on-dark'
    },
    promptTemplate: `You are creating a dramatic product drop fashion advertisement photograph.

IMAGE 1 is the exact product from the merchant's store. You MUST feature this exact garment.

CRITICAL PRODUCT RULES:
- Display this EXACT garment dramatically as the hero
- Preserve the garment exactly: same color, same fabric, same details
- If the product has a print, logo, or graphic on the fabric, preserve it exactly
- If the product is plain, keep it plain - do NOT add any logos or graphics
- The garment must look exclusive and desirable

SCENE REQUIREMENTS:
- NO model - product only
- Near-black charcoal background
- Single overhead spotlight illuminating the garment
- Garment emerging dramatically from darkness
- High contrast, cinematic lighting
- Product sharp and detailed in the light zone
- Rest fades to shadow
- Exclusive, raw, confident aesthetic
- Product drop / limited release energy

OUTPUT: Dramatic product photography, 4:5 vertical format, no text or graphics overlay.`
  }
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Inject dynamic field values into a prompt template.
 * Replaces [FIELD_NAME] placeholders with actual values.
 *
 * @param promptTemplate - The template string with [FIELD] placeholders
 * @param fields - Record of field names to values
 * @returns The prompt with all fields replaced
 */
export function injectTemplateFields(
  promptTemplate: string,
  fields: Record<string, string>
): string {
  let prompt = promptTemplate;

  for (const [key, value] of Object.entries(fields)) {
    prompt = prompt.replaceAll(`[${key}]`, value || '');
  }

  // Warn about any unreplaced fields
  const remaining = prompt.match(/\[[A-Z_]+\]/g);
  if (remaining) {
    console.warn('[TEMPLATE] Unreplaced fields:', remaining);
  }

  return prompt;
}

/**
 * Get a template by its ID.
 *
 * @param id - Template ID (e.g., 'T01_EDITORIAL_HERO')
 * @returns The template object or undefined
 */
export function getTemplateById(id: string): FashionTemplate | undefined {
  return FASHION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all available templates.
 *
 * @returns Array of all fashion templates
 */
export function getAllTemplates(): FashionTemplate[] {
  return FASHION_TEMPLATES;
}

/**
 * Get templates filtered by criteria.
 *
 * @param options - Filter options
 * @returns Filtered array of templates
 */
export function getTemplatesFiltered(options: {
  hasModel?: boolean;
  placement?: string;
}): FashionTemplate[] {
  return FASHION_TEMPLATES.filter(t => {
    if (options.hasModel !== undefined && t.hasModel !== options.hasModel) {
      return false;
    }
    if (options.placement && !t.placement.includes(options.placement)) {
      return false;
    }
    return true;
  });
}

/**
 * Get all unique dynamic fields across all templates.
 * Useful for understanding what data needs to be collected.
 */
export function getAllDynamicFields(): string[] {
  const allFields = new Set<string>();
  for (const template of FASHION_TEMPLATES) {
    for (const field of template.dynamicFields) {
      allFields.add(field);
    }
  }
  return Array.from(allFields).sort();
}

// ===========================================
// FIELD VALUE HELPERS
// ===========================================

/**
 * Get current season based on date.
 */
export function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

/**
 * Get season label for campaigns.
 */
export function getSeasonLabel(): string {
  const season = getCurrentSeason();
  const year = new Date().getFullYear();
  return `${season} ${year}`;
}

/**
 * Format price for display.
 */
export function formatPrice(price: number | null | undefined): string {
  if (!price) return '';
  return `$${price.toFixed(0)}`;
}

/**
 * Detect gender from product data.
 * Returns 'male', 'female', or 'unisex'.
 */
export function detectGender(product: {
  title: string;
  tags?: string | null;
  product_type?: string | null;
}): string {
  const text = `${product.title} ${product.tags || ''} ${product.product_type || ''}`.toLowerCase();

  const maleIndicators = ['men', 'male', 'guy', 'boy', 'him', 'his', "men's", 'mens'];
  const femaleIndicators = ['women', 'female', 'girl', 'her', 'lady', "women's", 'womens'];

  const hasMale = maleIndicators.some(ind => text.includes(ind));
  const hasFemale = femaleIndicators.some(ind => text.includes(ind));

  if (hasMale && !hasFemale) return 'male';
  if (hasFemale && !hasMale) return 'female';
  return 'unisex';
}

/**
 * Extract material sustainability claim from product description.
 */
export function extractMaterialClaim(product: {
  description?: string | null;
  tags?: string | null;
}): string {
  const text = `${product.description || ''} ${product.tags || ''}`.toLowerCase();

  if (text.includes('organic cotton')) return 'Organic Cotton';
  if (text.includes('recycled')) return 'Recycled Materials';
  if (text.includes('linen')) return 'Natural Linen';
  if (text.includes('hemp')) return 'Hemp Fiber';
  if (text.includes('bamboo')) return 'Bamboo Fabric';
  if (text.includes('tencel') || text.includes('lyocell')) return 'TENCEL™ Lyocell';
  if (text.includes('wool')) return 'Natural Wool';

  return 'Responsibly Sourced';
}

/**
 * Extract process sustainability claim from product description.
 */
export function extractProcessClaim(product: {
  description?: string | null;
  tags?: string | null;
}): string {
  const text = `${product.description || ''} ${product.tags || ''}`.toLowerCase();

  if (text.includes('low water')) return 'Low Water Process';
  if (text.includes('zero waste')) return 'Zero Waste';
  if (text.includes('fair trade')) return 'Fair Trade';
  if (text.includes('handmade')) return 'Handcrafted';
  if (text.includes('small batch')) return 'Small Batch';
  if (text.includes('solar') || text.includes('renewable')) return 'Renewable Energy';

  return 'Ethical Production';
}

/**
 * Extract origin claim from product description.
 */
export function extractOriginClaim(product: {
  description?: string | null;
  vendor?: string | null;
}): string {
  const text = `${product.description || ''} ${product.vendor || ''}`.toLowerCase();

  if (text.includes('made in usa') || text.includes('american made')) return 'Made in USA';
  if (text.includes('made in italy') || text.includes('italian')) return 'Made in Italy';
  if (text.includes('made in portugal')) return 'Made in Portugal';
  if (text.includes('made in uk') || text.includes('british')) return 'Made in UK';
  if (text.includes('made in japan')) return 'Made in Japan';
  if (text.includes('local')) return 'Locally Made';

  return 'Traceable Origin';
}
