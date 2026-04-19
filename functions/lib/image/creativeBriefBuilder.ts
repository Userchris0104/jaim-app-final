/**
 * Creative Brief Builder
 *
 * Builds prompts for scene generation that explicitly exclude the product.
 * The scene will have an empty center zone where the real product image
 * will be composited.
 */

interface Product {
  id: string;
  title: string;
  description: string | null;
  product_type: string | null;
  vendor: string | null;
  tags: string | null;
}

interface BrandStyleProfile {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

export interface ScenePromptResult {
  prompt: string;
  negativePrompt: string;
}

/**
 * Build a scene generation prompt that creates a background/environment
 * with an empty center zone for product compositing.
 */
export function buildScenePrompt(
  product: Product,
  brandStyle: BrandStyleProfile | null,
  strategy: string
): ScenePromptResult {
  const parts: string[] = [];

  // ===========================================
  // PART 1 — Zero hallucination instruction (ALWAYS FIRST)
  // ===========================================
  parts.push(`Create a lifestyle scene or background environment.

CRITICAL: Do NOT generate the product itself.
Do NOT generate any clothing, garment, accessory, jewelry, electronics, or physical item that could be the advertised product.

Leave a CLEARLY EMPTY rectangular space in the center of the composition approximately 50-60% of the frame. This space must be:
- Visually neutral (subtle background visible)
- Clearly defined with natural negative space
- Ready for a product image to be placed into it

You are creating the WORLD AROUND the product, not the product itself.`);

  // ===========================================
  // PART 2 — Brand style context (if available)
  // ===========================================
  if (brandStyle) {
    const colorList = brandStyle.colors.map(c => c.hex).join(', ');
    parts.push(`
Brand visual identity to match:
Tone: ${brandStyle.visualTone}
Mood: ${brandStyle.mood}
Style: ${brandStyle.contentStyle}
Colors: ${colorList}
Pattern: ${brandStyle.keyPatterns}`);
  }

  // ===========================================
  // PART 3 — Scene direction based on strategy
  // ===========================================
  const mood = brandStyle?.mood || 'modern and contemporary';

  switch (strategy) {
    case 'lifestyle':
    case 'emotion_lifestyle':
      parts.push(`
Scene: Natural lifestyle environment
Setting: ${deriveSettingFromMood(mood)}
Lighting: Soft natural light
Atmosphere: ${mood}
No people, no models, no mannequins
The empty center space should look natural as if something belongs there`);
      break;

    case 'specs_focused':
      parts.push(`
Scene: Clean minimal product photography setup
Background: Soft gradient or subtle texture
Lighting: Professional studio lighting
Style: Commercial photography backdrop
The empty center space is the hero of the frame`);
      break;

    case 'styled_product':
      parts.push(`
Scene: Elegant styled photography environment
Background: Sophisticated setting with complementary textures
Lighting: Soft directional light with gentle shadows
Style: Interior design magazine aesthetic
The empty center space is framed by elegant surroundings`);
      break;

    case 'ugc_discovery':
    case 'ugc_lifestyle':
      parts.push(`
Scene: Authentic real-world environment
Style: Natural, candid, unpolished
Lighting: Natural ambient light
Setting: Real home, outdoor, or urban environment
The empty center space feels natural in context`);
      break;

    case 'promotional':
      parts.push(`
Scene: Bold graphic environment
Style: Clean commercial with strong composition
Leave top 25% of frame clear for text overlay
Empty product zone in lower center
High contrast background`);
      break;

    default:
      // clean_product or fallback
      parts.push(`
Scene: Clean minimal product photography setup
Background: Soft gradient transitioning from light to slightly darker
Lighting: Professional studio lighting, soft and even
Style: High-end commercial photography backdrop
The empty center space is the focal point of the composition`);
  }

  // ===========================================
  // PART 4 — Technical requirements (ALWAYS LAST)
  // ===========================================
  parts.push(`
Style: Photorealistic
Quality: High-end commercial photography
No text, no logos, no watermarks
No product, no item, no object in the center zone
Aspect ratio: 1:1
The composition should feel intentionally designed around an absent center subject`);

  // ===========================================
  // BUILD NEGATIVE PROMPT
  // ===========================================
  const negativePrompt = buildNegativePrompt(product);

  return {
    prompt: parts.join('\n\n'),
    negativePrompt,
  };
}

/**
 * Derive a setting description from the brand mood.
 */
function deriveSettingFromMood(mood: string): string {
  const moodLower = mood.toLowerCase();

  if (moodLower.includes('cozy') || moodLower.includes('warm')) {
    return 'warm cozy interior with soft textures';
  }
  if (moodLower.includes('urban') || moodLower.includes('street')) {
    return 'urban street setting with architectural elements';
  }
  if (moodLower.includes('outdoor') || moodLower.includes('nature')) {
    return 'bright outdoor natural setting';
  }
  if (moodLower.includes('luxury') || moodLower.includes('elegant')) {
    return 'sophisticated elegant interior';
  }
  if (moodLower.includes('minimal') || moodLower.includes('clean')) {
    return 'minimal clean space with neutral tones';
  }
  if (moodLower.includes('bold') || moodLower.includes('vibrant')) {
    return 'dynamic space with bold color accents';
  }

  // Default
  return 'contemporary lifestyle setting with natural light';
}

/**
 * Build a comprehensive negative prompt to prevent product hallucination.
 */
function buildNegativePrompt(product: Product): string {
  const baseNegatives = [
    // Generic product terms
    'product', 'item', 'object', 'merchandise', 'goods',
    // People
    'mannequin', 'model', 'person', 'human', 'face', 'hands', 'body',
    // Quality issues
    'text', 'watermark', 'logo', 'blurry', 'low quality', 'distorted', 'duplicate',
    'busy background', 'cluttered',
  ];

  // Add clothing-specific terms
  const clothingTerms = [
    'clothing', 'garment', 'apparel', 'outfit', 'wear',
    'shirt', 'jacket', 'coat', 'pants', 'trousers', 'jeans', 'dress', 'skirt',
    'sweater', 'hoodie', 'top', 'blouse', 'shorts', 't-shirt', 'tee',
    'suit', 'blazer', 'cardigan', 'vest', 'outerwear',
  ];

  // Add accessory terms
  const accessoryTerms = [
    'accessory', 'accessories',
    'bag', 'purse', 'handbag', 'backpack', 'wallet',
    'shoes', 'sneakers', 'boots', 'sandals', 'heels',
    'jewelry', 'necklace', 'bracelet', 'ring', 'earrings', 'watch',
    'hat', 'cap', 'scarf', 'belt', 'sunglasses', 'glasses',
  ];

  // Add electronics terms
  const electronicsTerms = [
    'electronics', 'device', 'gadget',
    'phone', 'smartphone', 'tablet', 'laptop', 'computer',
    'headphones', 'earbuds', 'speaker', 'camera',
  ];

  // Extract keywords from product title
  const titleWords = product.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['with', 'from', 'that', 'this', 'have', 'been'].includes(w));

  // Extract keywords from product type
  const typeWords = (product.product_type || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Combine all negative terms
  const allNegatives = [
    ...baseNegatives,
    ...clothingTerms,
    ...accessoryTerms,
    ...electronicsTerms,
    ...titleWords,
    ...typeWords,
  ];

  // Remove duplicates and join
  const uniqueNegatives = [...new Set(allNegatives)];

  return uniqueNegatives.join(', ');
}
