/**
 * Brand DNA Generation
 *
 * // CLAUDE_COPY: All copy and Brand DNA via Claude Sonnet 4.6.
 * // Raw HTTP fetch only. No Anthropic SDK — Cloudflare Workers.
 *
 * Brand DNA is generated once per store and drives all creative decisions:
 * - Visual identity (colors, lighting, composition)
 * - Scene templates for each variant
 * - Copy framework (angles, banned words, power words)
 * - Model direction (if applicable)
 *
 * Regenerated only when:
 * - Merchant updates brand images
 * - Store data changes significantly
 * - Manual regeneration requested
 */

import type {
  Env,
  BrandDNA,
  StoreRecord,
  ProductRecord,
  StoreCategory,
  AdVariant
} from './types';
import { detectStoreCategory } from './adRules';

// ===========================================
// CONSTANTS
// ===========================================

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

/**
 * Get or generate Brand DNA for a store.
 * Returns cached DNA if available and valid, otherwise generates new.
 */
export async function getBrandDNA(
  storeId: string,
  env: Env,
  forceRegenerate = false
): Promise<BrandDNA | null> {
  // Get store record
  const store = await env.DB.prepare(`
    SELECT * FROM stores WHERE id = ?
  `).bind(storeId).first<StoreRecord>();

  if (!store) {
    console.error('[BRAND_DNA] Store not found:', storeId);
    return null;
  }

  // Check for cached DNA
  if (!forceRegenerate && store.brand_dna) {
    try {
      const cached = JSON.parse(store.brand_dna) as BrandDNA;
      console.log('[BRAND_DNA] Using cached DNA version:', cached.version);
      return cached;
    } catch {
      console.warn('[BRAND_DNA] Failed to parse cached DNA, regenerating');
    }
  }

  // Generate new DNA
  console.log('[BRAND_DNA] Generating new Brand DNA for store:', storeId);
  return await generateBrandDNA(store, env);
}

/**
 * Generate Brand DNA using Claude Sonnet.
 */
async function generateBrandDNA(
  store: StoreRecord,
  env: Env
): Promise<BrandDNA | null> {
  if (!env.ANTHROPIC_API_KEY) {
    console.error('[BRAND_DNA] No Anthropic API key');
    return createFallbackDNA(store);
  }

  // Get store products for category detection
  const productsResult = await env.DB.prepare(`
    SELECT * FROM products WHERE store_id = ? LIMIT 20
  `).bind(store.id).all<ProductRecord>();

  const products = productsResult.results || [];
  const storeCategory = detectStoreCategory(products);

  // Build context for Claude
  const storeContext = buildStoreContext(store, products, storeCategory);

  const systemPrompt = `You are an expert brand strategist and creative director specializing in e-commerce visual identity.

Your task is to analyze a Shopify store and generate a comprehensive Brand DNA document that will drive all ad creative decisions.

CRITICAL RULES:
1. Return ONLY valid JSON matching the exact schema provided
2. No text outside the JSON object
3. Every nano_banana_prompt MUST include this instruction: "Leave a clearly empty rectangular space in the center of the frame approximately 60% of the composition. Do not generate any product, object, or physical item in that center zone. Generate only the background environment."
4. nano_banana_prompt must be natural language sentences, NOT tag lists
5. Do NOT use these words in prompts: "masterpiece, 4k, trending, high quality" - they hurt quality on Nano Banana 2`;

  // Get category-specific scene examples
  const sceneExamples = storeCategory === 'FASHION'
    ? `
FASHION SCENE EXAMPLES (make each variant VISUALLY DISTINCT):

Variant A (Minimal) example:
"A minimalist fashion photography studio. Pure white seamless paper backdrop. Soft diffused lighting from the left side. Clean polished concrete floor. No props, no furniture. Scandinavian minimal aesthetic with subtle shadows. [empty center zone instruction] Commercial photography quality."

Variant B (Lifestyle) example:
"A sunlit urban loft apartment interior. Raw exposed red brick wall on the left side. Warm honey-toned wooden floorboards. Soft afternoon sunlight streaming through large industrial windows, casting long warm shadows. A vintage tan leather armchair partially visible in the background, out of focus with beautiful bokeh. Plants and natural textures. [empty center zone instruction] Editorial lifestyle quality."

Variant C (Editorial) example:
"A dramatic fashion editorial setting. Dark charcoal textured concrete wall with visible grain and imperfections. Single strong spotlight from the upper right creating deep dramatic shadows. High contrast, moody atmosphere. Black floor fading to shadow. A thin strip of warm amber accent light along the bottom edge. Cinematic and bold. [empty center zone instruction] Fashion editorial quality."
`
    : `
SCENE EXAMPLES (make each variant VISUALLY DISTINCT):

Variant A (Minimal) example:
"A clean white surface with soft diffused lighting from above. Minimal scandinavian aesthetic with subtle shadows. Elegant simplicity. [empty center zone instruction] Commercial photography quality."

Variant B (Lifestyle) example:
"A warm lifestyle scene with natural window light streaming in from the left. Cozy interior with soft textures, wooden surfaces, and a plant in the background. Morning light atmosphere. [empty center zone instruction] Editorial lifestyle quality."

Variant C (Editorial) example:
"A bold creative composition with dramatic directional spotlight from above. High contrast editorial mood. Dark background with artistic shadows creating depth and drama. [empty center zone instruction] Fashion editorial quality."
`;

  const userPrompt = `Analyze this store and generate Brand DNA:

${storeContext}

CRITICAL FOR SCENE TEMPLATES:
- Each variant must look COMPLETELY DIFFERENT from the others
- Variant A = BRIGHT, minimal, white/light backgrounds, clean studio feel
- Variant B = WARM, lifestyle context, natural textures, brick/wood/plants, environmental
- Variant C = DARK, dramatic, moody, high contrast, editorial shadows

${sceneExamples}

Return this exact JSON structure:
{
  "brand_name": "${store.store_name || 'Brand'}",
  "analysed_at": "${new Date().toISOString()}",
  "version": ${(store.brand_dna_version || 0) + 1},
  "identity": {
    "core_vibe": "minimalist|luxury|energetic|earthy|playful|clinical|editorial|streetwear|premium|authentic",
    "primary_palette": ["#hex1", "#hex2", "#hex3"],
    "accent_palette": ["#hex1", "#hex2"],
    "brand_voice": "luxury|casual|urgent|inspirational|educational|humorous|authoritative"
  },
  "visual_language": {
    "lighting_profile": {
      "type": "high-key-studio|golden-hour|soft-natural|dramatic-spotlight|neon-ambient|overcast-outdoor|warm-interior",
      "direction": "front|side|backlit|overhead|ambient",
      "temperature": "warm|cool|neutral"
    },
    "composition_style": "centered-hero|rule-of-thirds|flat-lay|editorial-crop|environmental|macro-detail",
    "background_preference": "clean-minimal|lifestyle-contextual|dramatic-dark|bright-airy|textured-surface|outdoor-natural",
    "depth_of_field": "deep|shallow-bokeh|medium"
  },
  "store_category": "${storeCategory}",
  "model_direction": {
    "use_models": ${storeCategory === 'FASHION' ? 'true (REQUIRED for FASHION stores)' : 'false'},
    "gender_default": "MALE|FEMALE|NEUTRAL|MIXED",
    "age_range": "18-25|25-35|35-50|50+|mixed",
    "style_archetype": "two sentences describing ideal model look for this brand",
    "expression": "confident|candid|aspirational|approachable|intense|joyful",
    "setting_preference": "one sentence describing ideal model setting"
  },
  "scene_templates": {
    "variant_a_clean": {
      "direction": "minimal",
      "nano_banana_prompt": "BRIGHT minimal scene. White/light background. Studio lighting. Must be visually distinct from variants B and C. MUST include empty center zone instruction. End with: Commercial photography quality.",
      "photoroom_config": {
        "shadow_mode": "ai-soft",
        "lighting_mode": "ai-auto",
        "background_blur": 0
      }
    },
    "variant_b_lifestyle": {
      "direction": "contextual",
      "nano_banana_prompt": "WARM lifestyle scene. Natural textures, brick, wood, plants. Environmental context. Must be visually distinct from variants A and C. MUST include empty center zone instruction. End with: Editorial lifestyle quality.",
      "photoroom_config": {
        "shadow_mode": "ai-soft",
        "lighting_mode": "ai-auto",
        "background_blur": 15
      }
    },
    "variant_c_editorial": {
      "direction": "bold",
      "nano_banana_prompt": "DARK dramatic scene. High contrast, moody, editorial shadows. Bold and cinematic. Must be visually distinct from variants A and B. MUST include empty center zone instruction. End with: Fashion editorial quality.",
      "photoroom_config": {
        "shadow_mode": "ai-hard",
        "lighting_mode": "dramatic",
        "background_blur": 0
      }
    }
  },
  "copy_framework": {
    "variant_a_angle": "benefit — what it does for the customer",
    "variant_b_angle": "emotion — how it feels to use/wear it",
    "variant_c_angle": "curiosity — pattern interrupt, unexpected hook",
    "banned_words": ["amazing", "incredible", "perfect", "high quality", "best in class", "elevate", "discover", "unleash"],
    "power_words": ["3-5 brand-specific power words based on store analysis"]
  },
  "performance_memory": {
    "best_variant_historically": null,
    "best_lighting_historically": null,
    "best_copy_angle_historically": null,
    "last_updated": null
  }
}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BRAND_DNA] Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
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

    const dna = JSON.parse(jsonStr) as BrandDNA;

    // Validate and fix required fields
    dna.brand_name = dna.brand_name || store.store_name || 'Brand';
    dna.analysed_at = dna.analysed_at || new Date().toISOString();
    dna.version = (store.brand_dna_version || 0) + 1;

    // Use store's configured category if available (override AI detection)
    const effectiveCategory = (store.store_category as StoreCategory) || dna.store_category;
    if (effectiveCategory && effectiveCategory !== dna.store_category) {
      console.log(`[BRAND_DNA] Using configured category ${effectiveCategory} instead of detected ${dna.store_category}`);
      dna.store_category = effectiveCategory;
    }

    // FASHION stores MUST have models enabled
    if (dna.store_category === 'FASHION') {
      dna.model_direction.use_models = true;
      console.log('[BRAND_DNA] Forcing use_models=true for FASHION store');
    }

    // Ensure scene prompts include empty center zone instruction
    validateScenePrompts(dna);

    // Cache the DNA
    await cacheBrandDNA(store.id, dna, env);

    console.log('[BRAND_DNA] Generated new DNA:', {
      brand: dna.brand_name,
      version: dna.version,
      category: dna.store_category,
      coreVibe: dna.identity.core_vibe
    });

    return dna;
  } catch (error) {
    console.error('[BRAND_DNA] Generation failed:', error);
    return createFallbackDNA(store);
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Build context string for Claude from store data.
 */
function buildStoreContext(
  store: StoreRecord,
  products: ProductRecord[],
  category: StoreCategory
): string {
  const productSummary = products.slice(0, 10).map(p =>
    `- ${p.title} (${p.product_type || 'General'}) - $${p.price_min || 0}`
  ).join('\n');

  return `
STORE INFORMATION:
- Name: ${store.store_name || 'Unknown'}
- Domain: ${store.shop_domain}
- Currency: ${store.currency}
- Detected Category: ${category}
- Connected: ${store.connected_at}

SAMPLE PRODUCTS (${products.length} total):
${productSummary || 'No products synced yet'}

PRICE RANGE:
${products.length > 0
  ? `$${Math.min(...products.map(p => p.price_min || 0).filter(p => p > 0))} - $${Math.max(...products.map(p => p.price_max || 0))}`
  : 'Unknown'}
`;
}

/**
 * Validate that scene prompts include empty center zone instruction.
 */
function validateScenePrompts(dna: BrandDNA): void {
  const centerZoneInstruction = 'Leave a clearly empty rectangular space in the center';

  const templates = [
    dna.scene_templates.variant_a_clean,
    dna.scene_templates.variant_b_lifestyle,
    dna.scene_templates.variant_c_editorial
  ];

  for (const template of templates) {
    if (!template.nano_banana_prompt.includes(centerZoneInstruction)) {
      template.nano_banana_prompt = `${template.nano_banana_prompt} ${centerZoneInstruction} of the frame approximately 60% of the composition. Do not generate any product, object, or physical item in that center zone. Generate only the background environment.`;
    }
  }
}

/**
 * Get FASHION-specific scene templates with highly distinct prompts.
 */
function getFashionSceneTemplates(centerZone: string) {
  return {
    variant_a_clean: {
      direction: 'minimal',
      nano_banana_prompt: `A minimalist fashion photography studio. Pure white seamless paper backdrop filling the entire frame. Soft diffused lighting from the left side. Clean polished concrete floor. No props, no furniture, no distractions. Scandinavian minimal aesthetic with subtle shadows. ${centerZone} Commercial photography quality.`,
      photoroom_config: {
        shadow_mode: 'ai-soft',
        lighting_mode: 'ai-auto',
        background_blur: 0
      }
    },
    variant_b_lifestyle: {
      direction: 'contextual',
      nano_banana_prompt: `A sunlit urban loft apartment interior. Raw exposed red brick wall on the left side. Warm honey-toned wooden floorboards. Soft afternoon sunlight streaming through large industrial windows, casting long warm shadows. A vintage tan leather armchair partially visible in the background, out of focus with beautiful bokeh. Plants and natural textures. ${centerZone} Editorial lifestyle quality.`,
      photoroom_config: {
        shadow_mode: 'ai-soft',
        lighting_mode: 'ai-auto',
        background_blur: 20
      }
    },
    variant_c_editorial: {
      direction: 'bold',
      nano_banana_prompt: `A dramatic fashion editorial setting. Dark charcoal textured concrete wall with visible grain and imperfections. Single strong spotlight from the upper right creating deep dramatic shadows. High contrast, moody atmosphere. Black floor fading to shadow. A thin strip of warm amber accent light along the bottom edge. Cinematic and bold. ${centerZone} Fashion editorial quality.`,
      photoroom_config: {
        shadow_mode: 'ai-hard',
        lighting_mode: 'dramatic',
        background_blur: 0
      }
    }
  };
}

/**
 * Get default scene templates for non-fashion stores.
 */
function getDefaultSceneTemplates(centerZone: string) {
  return {
    variant_a_clean: {
      direction: 'minimal',
      nano_banana_prompt: `A clean white surface with soft diffused lighting from above. Minimal scandinavian aesthetic with subtle shadows. Elegant simplicity. ${centerZone} Commercial photography quality.`,
      photoroom_config: {
        shadow_mode: 'ai-soft',
        lighting_mode: 'ai-auto',
        background_blur: 0
      }
    },
    variant_b_lifestyle: {
      direction: 'contextual',
      nano_banana_prompt: `A warm lifestyle scene with natural window light streaming in from the left. Cozy interior with soft textures, wooden surfaces, and a plant in the background. Morning light atmosphere. ${centerZone} Editorial lifestyle quality.`,
      photoroom_config: {
        shadow_mode: 'ai-soft',
        lighting_mode: 'ai-auto',
        background_blur: 15
      }
    },
    variant_c_editorial: {
      direction: 'bold',
      nano_banana_prompt: `A bold creative composition with dramatic directional spotlight from above. High contrast editorial mood. Dark background with artistic shadows creating depth and drama. ${centerZone} Fashion editorial quality.`,
      photoroom_config: {
        shadow_mode: 'ai-hard',
        lighting_mode: 'dramatic',
        background_blur: 0
      }
    }
  };
}

/**
 * Create fallback DNA when generation fails.
 */
function createFallbackDNA(store: StoreRecord): BrandDNA {
  const centerZone = 'Leave a clearly empty rectangular space in the center of the frame approximately 60% of the composition. Do not generate any product, object, or physical item in that center zone. Generate only the background environment.';

  const storeCategory = (store.store_category as StoreCategory) || 'GENERAL';
  const sceneTemplates = storeCategory === 'FASHION'
    ? getFashionSceneTemplates(centerZone)
    : getDefaultSceneTemplates(centerZone);

  // Enable models for FASHION stores
  const useModels = storeCategory === 'FASHION';

  return {
    brand_name: store.store_name || 'Brand',
    analysed_at: new Date().toISOString(),
    version: (store.brand_dna_version || 0) + 1,
    identity: {
      core_vibe: 'premium',
      primary_palette: ['#FFFFFF', '#000000', '#F5F5F5'],
      accent_palette: ['#2563EB', '#DC2626'],
      brand_voice: 'casual'
    },
    visual_language: {
      lighting_profile: {
        type: 'soft-natural',
        direction: 'front',
        temperature: 'neutral'
      },
      composition_style: 'centered-hero',
      background_preference: 'clean-minimal',
      depth_of_field: 'medium'
    },
    store_category: storeCategory,
    model_direction: {
      use_models: useModels,
      gender_default: 'NEUTRAL',
      age_range: '25-35',
      style_archetype: useModels
        ? 'Contemporary urban style. Clean minimal fashion aesthetic with effortless confidence.'
        : 'Modern and approachable. Clean aesthetic.',
      expression: 'confident',
      setting_preference: useModels
        ? 'Editorial fashion setting with dramatic lighting'
        : 'Studio or minimal lifestyle setting'
    },
    scene_templates: sceneTemplates,
    copy_framework: {
      variant_a_angle: 'benefit — what it does for the customer',
      variant_b_angle: 'emotion — how it feels to use it',
      variant_c_angle: 'curiosity — pattern interrupt, unexpected hook',
      banned_words: ['amazing', 'incredible', 'perfect', 'high quality', 'best in class', 'elevate', 'discover', 'unleash'],
      power_words: ['effortless', 'essential', 'refined', 'curated', 'timeless']
    },
    performance_memory: {
      best_variant_historically: null,
      best_lighting_historically: null,
      best_copy_angle_historically: null,
      last_updated: null
    }
  };
}

/**
 * Cache Brand DNA in the database.
 */
async function cacheBrandDNA(
  storeId: string,
  dna: BrandDNA,
  env: Env
): Promise<void> {
  try {
    await env.DB.prepare(`
      UPDATE stores
      SET
        brand_dna = ?,
        brand_dna_version = ?,
        store_category = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(dna),
      dna.version,
      dna.store_category,
      storeId
    ).run();

    console.log('[BRAND_DNA] Cached DNA version', dna.version, 'for store:', storeId);
  } catch (error) {
    console.error('[BRAND_DNA] Failed to cache DNA:', error);
  }
}

/**
 * Get scene template for a specific variant.
 */
export function getSceneTemplate(
  dna: BrandDNA,
  variant: AdVariant
): {
  prompt: string;
  photoroomConfig: {
    shadow_mode: string;
    lighting_mode: string;
    background_blur: number;
  };
} {
  switch (variant) {
    case 'A':
      return {
        prompt: dna.scene_templates.variant_a_clean.nano_banana_prompt,
        photoroomConfig: dna.scene_templates.variant_a_clean.photoroom_config
      };
    case 'B':
      return {
        prompt: dna.scene_templates.variant_b_lifestyle.nano_banana_prompt,
        photoroomConfig: dna.scene_templates.variant_b_lifestyle.photoroom_config
      };
    case 'C':
      return {
        prompt: dna.scene_templates.variant_c_editorial.nano_banana_prompt,
        photoroomConfig: dna.scene_templates.variant_c_editorial.photoroom_config
      };
  }
}

/**
 * Get copy angle for a specific variant.
 */
export function getCopyAngle(dna: BrandDNA, variant: AdVariant): string {
  switch (variant) {
    case 'A':
      return dna.copy_framework.variant_a_angle;
    case 'B':
      return dna.copy_framework.variant_b_angle;
    case 'C':
      return dna.copy_framework.variant_c_angle;
  }
}

/**
 * Update performance memory in Brand DNA.
 */
export async function updatePerformanceMemory(
  storeId: string,
  bestVariant: AdVariant | null,
  bestLighting: string | null,
  bestCopyAngle: string | null,
  env: Env
): Promise<void> {
  const dna = await getBrandDNA(storeId, env);
  if (!dna) return;

  dna.performance_memory = {
    best_variant_historically: bestVariant,
    best_lighting_historically: bestLighting,
    best_copy_angle_historically: bestCopyAngle,
    last_updated: new Date().toISOString()
  };

  await cacheBrandDNA(storeId, dna, env);
}
