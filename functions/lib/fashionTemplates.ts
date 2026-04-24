/**
 * Fashion Ad Templates - Template-Based Generation System
 *
 * 15 fashion ad templates with full prompt templates and dynamic field injection.
 * Replaces category-based prompt system with explicit template selection.
 *
 * USAGE:
 * 1. getTemplateById('T01_EDITORIAL_HERO') → template object
 * 2. injectTemplateFields(template.promptTemplate, fields) → final prompt
 * 3. Send to Gemini with product image
 *
 * BRANDING RULES (enforced in every template):
 * - No logo/text added to garment unless already on product
 * - Brand name appears as text overlay only
 * - Brand colors applied to text, buttons, overlays
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'GENDER', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

A [GENDER] model wearing this exact garment on their body. Shot from mid-torso up.

Studio setting: single-tone warm backdrop in [BRAND_COLOR_1] or warm neutral tone. Soft directional lighting from upper left. Natural confident pose, looking directly at camera.

Text in image:
- Top left corner: '[BRAND_NAME]' in tiny elegant caps. Small and refined.
- Bottom area: '[HEADLINE]' in large bold clean sans-serif. White or [BRAND_COLOR_2]. Maximum 6 words. Dominant element.
- Below headline: 'Shop Now →' lighter weight same font.

Text covers maximum 12% of image.
[BRAND_VIBE] aesthetic throughout.
Commercial fashion photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_VIBE', 'GENDER', 'HEADLINE', 'SUBHEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

A [GENDER] model wearing this exact garment on their body. No added branding on garment.

Setting: sunlit city street or café terrace. Warm natural daylight. Candid relaxed pose — walking, mid-movement, natural expression. Shallow depth of field, city softly blurred.

Text in image:
- Top left: '[BRAND_NAME]' small refined text.
- Upper area: '[HEADLINE]' in bold modern white sans-serif. Transparent dark bar behind text for legibility.
- Lower right: '[SUBHEADLINE]' in bold white caps, slightly smaller.
- Bottom center: 'Shop Now' pill button in [BRAND_COLOR_1] with white text.

[BRAND_VIBE] energy. Authentic not staged.
Editorial lifestyle photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'HEADLINE', 'PRODUCT_NAME', 'PRICE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

No model. Display this exact garment perfectly as the hero — folded naturally or hanging flat.

Background: seamless [BRAND_COLOR_1] or soft neutral gradient. Professional studio lighting. Every seam, texture and detail sharp and visible.

Text in image:
- Top left: '[BRAND_NAME]' small elegant caps.
- Top area: '[HEADLINE]' in large bold elegant serif or sans-serif. [BRAND_VIBE] tone.
- Middle: '[PRODUCT_NAME]' in smaller refined typography.
- Price: '[PRICE]' in medium weight.
- Bottom: 'Shop Now' CTA in [BRAND_COLOR_2] button with white text.

High-end commercial product photography.
4:5 vertical format.`
  },

  // -------------------------------------------
  // T04 — THE PROMOTIONAL SALE
  // -------------------------------------------
  {
    id: 'T04_PROMOTIONAL_SALE',
    name: 'Promotional Sale',
    description: 'Product with bold sale or promo text overlay',
    placement: ['feed_4x5', 'stories_9x16'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'PROMO_HEADLINE', 'OFFER_TEXT'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

No model. Display this exact garment attractively as the hero.

Background: deep [BRAND_COLOR_1] or rich dark neutral. Dramatic product lighting. Garment sharp.

Text in image — the text IS the message:
- Top left: '[BRAND_NAME]' small refined.
- Top area: '[PROMO_HEADLINE]' in very large bold condensed white sans-serif. Full width. Visually dominant.
- Below: '[OFFER_TEXT]' in bold white. Slightly smaller.
- Garment visible centered below text.
- Bottom: 'Shop Now →' CTA pill in [BRAND_COLOR_2].

Bold graphic commercial fashion quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto any garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the hero product from the merchant's Shopify store. Feature this exact product as the center of the flat lay. Preserve exactly as shown in Image 1.

Create an overhead flat lay photograph. Garment from Image 1 laid flat as center hero. Complement with unbranded accessories — shoes, bag, watch — arranged naturally around.

Surface: warm oak, marble, or linen matching [BRAND_VIBE]. Single botanical prop at edge. Nothing cluttered. Overhead camera angle perfectly flat. Even soft natural light. [BRAND_COLOR_1] tones throughout.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top area: '[HEADLINE]' in elegant refined serif. Dark charcoal or [BRAND_COLOR_1].
- Bottom: 'Shop the Look →' CTA small in [BRAND_COLOR_2].

Editorial flat lay photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_VIBE', 'GENDER', 'SEASON_LABEL', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same construction, same print or graphic if one exists.

A [GENDER] model wearing this exact garment on their body.

Setting: architectural — marble interior, minimalist gallery, or luxury environment. Dramatic single light source. Deep shadows. Model: confident, authoritative, direct gaze. Portrait from chest up.

Text in image — minimal and refined:
- Top left: '[BRAND_NAME]' in small elegant serif caps. White on dark area.
- Below brand: '[SEASON_LABEL]' in smaller italic serif. Cream color.
- Lower area: '[HEADLINE]' in refined medium serif. Maximum 6 words.
- 'Discover' CTA in tiny elegant caps. No button shape — just the word.

Deep [BRAND_COLOR_1] tones.
Luxury editorial photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'GENDER', 'SEASON', 'SEASON_LABEL', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

A [GENDER] model wearing this exact garment OR garment displayed clean — whichever is most natural for this product type.

Setting evokes [SEASON] naturally through lighting and atmosphere.

Text in image — structured like a magazine:
- Top left: '[BRAND_NAME]' small refined.
- Top area: '[SEASON_LABEL]' in large elegant serif or bold caps. Visual anchor of the ad. Cream or white.
- Middle: '[HEADLINE]' in clean sans-serif.
- Bottom: 'Shop Now' CTA in [BRAND_COLOR_2].

[BRAND_COLOR_1] palette direction.
[BRAND_VIBE] aesthetic. Editorial and confident not promotional.
4:5 vertical format.`
  },

  // -------------------------------------------
  // T08 — THE SOCIAL PROOF STAMP
  // -------------------------------------------
  {
    id: 'T08_SOCIAL_PROOF',
    name: 'Social Proof Stamp',
    description: 'Product with trust badge and review count overlay',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'HEADLINE', 'PRODUCT_NAME', 'PROOF_TEXT'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

No model. Display this exact garment cleanly as hero on [BRAND_COLOR_1] or neutral background. Product perfectly lit and presented.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top corner: Refined badge reading '[PROOF_TEXT]'. Must look like a real editorial trust badge. Tasteful. Gold and white. Not clipart.
- Main headline: '[HEADLINE]' bold clear sans-serif. Dark charcoal.
- '[PRODUCT_NAME]' smaller refined text.
- Bottom: 'Shop Now' CTA in [BRAND_COLOR_2].

[BRAND_VIBE] aesthetic.
Commercial fashion photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown.

Create an extreme close-up focusing on the most interesting detail of this garment — stitching, button, zip pull, collar edge, fabric weave, or texture. No added branding. Fill most of the frame with this detail.

Dramatically sharp detail. Side lighting revealing texture depth. Deep [BRAND_COLOR_1] or dark neutral background. Rest of garment softly blurred behind.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- '[HEADLINE]' in clean bold sans-serif. References quality or craft. White or [BRAND_COLOR_2].
- 'Shop Now' minimal CTA with arrow.

Less text — the detail image does the work.
Luxury product detail photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'BRAND_VIBE', 'GENDER', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

Three vertical panels side by side. In each panel a [GENDER] model wears this exact garment styled differently. No added branding.

Panel 1 — 'Day': Casual relaxed styling.
Panel 2 — 'Work': Smart elevated styling.
Panel 3 — 'Evening': Occasion styling.

Small label above each panel: 'Day' / 'Work' / 'Evening'
Clean [BRAND_COLOR_1] studio background. Consistent lighting throughout.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Full-width text bar across bottom: '[HEADLINE]' in bold confident white sans-serif on dark bar.
- 'Shop Now →' CTA in [BRAND_COLOR_2].

[BRAND_VIBE] aesthetic.
Commercial fashion photography quality.
4:5 vertical format.`
  },

  // -------------------------------------------
  // T11 — THE SUSTAINABLE STORY
  // -------------------------------------------
  {
    id: 'T11_SUSTAINABLE_STORY',
    name: 'Sustainable Story',
    description: 'Product with eco credentials and natural styling',
    placement: ['feed_4x5'],
    hasModel: false,
    hasTextOverlay: true,
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'HEADLINE', 'MATERIAL_CLAIM', 'PROCESS_CLAIM', 'ORIGIN_CLAIM'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

Display this exact garment on a clean earthy natural surface — wood, stone, or linen. Soft natural overhead light. Single botanical prop placed naturally beside product.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top: '[HEADLINE]' in clean natural sans-serif. Dark charcoal.
- Side: 3 small refined eco badges:
  🌱 '[MATERIAL_CLAIM]'
  ♻️ '[PROCESS_CLAIM]'
  📍 '[ORIGIN_CLAIM]'
  Tiny clean typography. Tasteful not clipart.
- Bottom: 'Shop Responsibly' CTA in [BRAND_COLOR_2].

Earth tone palette.
Honest and natural photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_2', 'HEADLINE', 'PRODUCT_NAME', 'PRICE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

No model. Display this exact garment as centered hero. No added branding on garment.

Background: single vivid bold color chosen for maximum contrast to the garment — electric orange, wasabi green, shocking pink, lemon yellow, or vivid cobalt. Strong even studio lighting.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top full width: '[HEADLINE]' in very large bold condensed white sans-serif. Maximum 4 words. Visually dominant.
- Below garment: '[PRODUCT_NAME]' in white medium weight caps.
  'Shop Now' CTA in [BRAND_COLOR_2] pill.
- Small '[PRICE]' in white corner text.

Bold background creates the scroll-stop.
Graphic and confident.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'BRAND_COLOR_2', 'GENDER', 'HEADLINE', 'PRODUCT_NAME'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

A [GENDER] model wearing this exact garment on their body. No added branding on garment.

Setting: outdoor golden hour — park, beach terrace, or open field. Late afternoon sun creating warm golden rim light from behind. Model looking away, relaxed, aspirational.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top area: '[HEADLINE]' in elegant medium weight serif. Warm cream. Subtle shadow.
- Bottom: '[PRODUCT_NAME]' small light text.
  'Shop Now' minimal CTA with arrow in [BRAND_COLOR_2].

Warm amber golden tones throughout.
[BRAND_COLOR_1] palette direction.
Aspirational lifestyle photography quality.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_1', 'SEASON_LABEL', 'HEADLINE'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same construction, same print or graphic if one exists.

A male model wearing this exact garment on his body. No added branding on garment.

Setting: clean dark architectural interior. Strong single directional light. Deep shadows. Portrait from chest up. Direct confident gaze.

Text in image — magazine cover format:
- Top left: '[BRAND_NAME]' in refined serif caps. Magazine masthead. Cream on dark.
- Below: '[SEASON_LABEL]' in smaller italic serif. Warm cream.
- Lower: '[HEADLINE]' in bold modern sans-serif. Confident and direct.
- Bottom: 'Discover the Collection' in tiny elegant caps. No button.

Deep [BRAND_COLOR_1] palette.
Premium menswear magazine photography.
4:5 vertical format.`
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
    dynamicFields: ['BRAND_NAME', 'BRAND_COLOR_2', 'PRODUCT_NAME', 'DROP_LABEL', 'DATE_OR_SCARCITY'],
    promptTemplate: `BRANDING RULES:
Do not add any logo or text onto the garment unless Image 1 already shows a logo, graphic, or print on the fabric. If product has a print preserve it exactly. If plain keep plain. Brand name appears as small text overlay in corner of ad only — not on garment. Brand colors applied to text, buttons, overlays.

Image 1 is the product from the merchant's Shopify store. Feature this exact product. Preserve the garment exactly as shown — same color, same fabric, same fit, same print or graphic if one exists on the product.

No model. Display this exact garment dramatically lit as the product hero. No added branding on garment. Garment emerges from darkness with a single overhead spotlight on fabric and silhouette.

Background: near-black charcoal. High contrast. Cinematic. Garment sharp and detailed in light zone.

Text in image:
- Top left: '[BRAND_NAME]' small refined.
- Top: '[DROP_LABEL]' in large bold condensed all-caps white sans-serif. Dominant.
- Center: '[PRODUCT_NAME]' in clean medium weight white text.
- Lower: '[DATE_OR_SCARCITY]' in tiny white monospace.
- Bottom: 'Get Yours' CTA. Exclusive tone. [BRAND_COLOR_2] accent if appropriate.

Raw, confident, exclusive aesthetic.
Moody dramatic photography quality.
4:5 vertical format.`
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
