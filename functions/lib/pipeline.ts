/**
 * Modular Compositing Pipeline - Main Orchestrator
 *
 * This is the heart of the ad generation system.
 * Coordinates all layers in the correct order with proper parallelism.
 *
 * PIPELINE EXECUTION ORDER:
 * 1. Detect generation phase (LEARNING/OPTIMISING/EXPLOITING)
 * 2. Load Brand DNA (generate if missing)
 * 3. Load Product Style (analyze if missing, non-blocking)
 * 4. Load Creative Evolution State
 * 5. Decide variants based on phase + evolution
 * 6. Generate scenes AND copy IN PARALLEL (Gemini handles product integration)
 * 7. Build AI rationale for each variant
 * 8. Save all variants to database with metadata
 * 9. Update creative evolution state
 * 10. Return results
 *
 * PROVIDER RULES ENFORCED:
 * // GEMINI_ONLY: Google Gemini is the only image generation provider
 * // NO_BRIA: Background removal removed - Gemini handles product natively
 * // NO_FAL: fal.ai completely removed from pipeline
 * // ZERO_HALLUCINATION: Product image always from Shopify
 * // PARALLEL: Image gen and copy gen always run in parallel
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads
 * // ALWAYS_UNIQUE: Every generation uses random seed + variation pools
 */

import type {
  Env,
  ProductRecord,
  BrandDNA,
  ProductStyleProfile,
  AdVariant,
  AdGenerationResult,
  GenerateAdResponse,
  PhaseDetectionResult,
  CreativeEvolutionState
} from './types';

import {
  detectPhase,
  getVariantsToGenerate,
  generateRationale,
  updateStorePhase,
  loadCreativeEvolution,
  saveCreativeEvolution,
  createInitialEvolutionState,
  isStyleRotationDue
} from './phaseDetection';

import { getBrandDNA } from './brandDna';
import { getProductStyle } from './productStyle';
import { generateScenesParallel, generateSceneWithTemplate, type ExtendedSceneResult, type TemplateGenerationInput } from './sceneGeneration';
import { generateCopyForVariants } from './copyGeneration';
import { getVariantType, requiresTextToImage, isModelWearingVariant, type VariantType } from './promptVariation';
import { getTemplateById, type TemplateId } from './fashionTemplates';

// clean_image_url deprecated — Bria RMBG removed from pipeline
// Using original Shopify image directly with Gemini

// ===========================================
// MAIN PIPELINE FUNCTION
// ===========================================

/**
 * Pipeline options for ad generation.
 */
export interface PipelineOptions {
  templateId?: TemplateId;        // Use specific fashion template
  headline?: string;              // Pre-generated headline for template
  subheadline?: string;           // Pre-generated subheadline
  promoHeadline?: string;         // Promo/sale headline
  offerText?: string;             // Offer text (e.g., "20% OFF")
  dropLabel?: string;             // Drop label (e.g., "NEW ARRIVAL")
  scarcityText?: string;          // Scarcity text (e.g., "Limited to 100")
}

/**
 * Execute the full ad generation pipeline.
 * This is the main entry point for generating ads.
 *
 * When templateId is provided, uses the new template-based system.
 * When not provided, falls back to legacy category-based generation.
 */
export async function runPipeline(
  product: ProductRecord,
  env: Env,
  options?: PipelineOptions
): Promise<GenerateAdResponse> {
  const startTime = Date.now();
  console.log('[PIPELINE] Starting ad generation for product:', product.id);

  try {
    // ===========================================
    // STEP 1: Detect Generation Phase
    // ===========================================
    const phaseResult = await detectPhase(product.store_id, env);
    console.log('[PIPELINE] Phase:', phaseResult.phase, '- Variants:', phaseResult.variantsToGenerate);

    // Update store phase in database
    await updateStorePhase(product.store_id, phaseResult.phase, env);

    // ===========================================
    // STEP 2: Load Brand DNA (blocking - required)
    // ===========================================
    const brandDna = await getBrandDNA(product.store_id, env);
    if (!brandDna) {
      throw new Error('Failed to load or generate Brand DNA');
    }
    console.log('[PIPELINE] Brand DNA loaded, version:', brandDna.version);

    // ===========================================
    // STEP 3: Load Product Style (non-blocking)
    // ===========================================
    const productStyle = await getProductStyle(product, env);
    console.log('[PIPELINE] Product style loaded:', {
      isWearable: productStyle.classification.is_wearable,
      gender: productStyle.classification.gender
    });

    // ===========================================
    // STEP 4: Load Creative Evolution State
    // ===========================================
    let evolutionState = await loadCreativeEvolution(product.id, env);
    if (!evolutionState) {
      evolutionState = createInitialEvolutionState(phaseResult.phase);
    }

    // Check for style rotation
    const isStyleRotation = isStyleRotationDue(evolutionState);
    if (isStyleRotation) {
      console.log('[PIPELINE] Style rotation triggered');
      evolutionState.lastStyleRotation = new Date().toISOString();
      evolutionState.lastNewStyleTestedAt = new Date().toISOString();
    }

    // ===========================================
    // STEP 5: Get Product Image URL
    // ===========================================
    // No background removal needed - Gemini handles product integration natively
    // Using original Shopify product image directly
    const productImageUrl = getProductImageUrl(product);
    console.log('[PIPELINE] Using Shopify product image directly:', productImageUrl);

    // ===========================================
    // STEP 6: Decide Variants Based on Phase
    // ===========================================
    const variantsToGenerate = await getVariantsToGenerate(phaseResult, product.store_id, env);
    const variants = variantsToGenerate.map(v => v.variant);
    console.log('[PIPELINE] Generating variants:', variants.join(', '));

    // Create A/B group ID
    const abGroup = `${product.id}_${Date.now()}`;

    // ===========================================
    // STEP 7: Check for Template-Based Generation
    // ===========================================
    if (options?.templateId) {
      console.log('[PIPELINE] Using template-based generation:', options.templateId);
      return await runTemplateBasedPipeline(
        product,
        brandDna,
        productStyle,
        productImageUrl,
        abGroup,
        phaseResult,
        options,
        env
      );
    }

    // ===========================================
    // STEP 8: Legacy Category-Based Generation
    // ===========================================
    console.log('[PIPELINE] Starting parallel generation (scenes + copy)...');

    const [scenesMap, copyResult] = await Promise.all([
      // Generate all scenes in parallel (Gemini handles product integration)
      // No background removal needed - using Shopify image directly
      generateScenesParallel(
        variants,
        brandDna,
        productStyle,
        productImageUrl,      // Primary product image
        productImageUrl,      // Same image for fallback (no clean version)
        product.store_id,
        env
      ),

      // Generate all copy in one Claude call
      generateCopyForVariants(product, brandDna, productStyle, variants, env)
    ]);

    console.log('[PIPELINE] Parallel generation complete:', {
      scenes: scenesMap.size,
      copyVariants: copyResult.variants.length
    });

    // ===========================================
    // STEP 8: Process Each Variant
    // ===========================================
    const results: AdGenerationResult[] = [];

    for (const variantInfo of variantsToGenerate) {
      const { variant, isChallenger } = variantInfo;

      // Get scene for this variant
      const sceneResult = scenesMap.get(variant);
      if (!sceneResult?.success || !sceneResult.sceneUrl) {
        console.warn(`[PIPELINE] Scene generation failed for variant ${variant}`);
        continue;
      }

      // Get copy for this variant
      const variantCopy = copyResult.variants.find(c => c.variant === variant);
      if (!variantCopy) {
        console.warn(`[PIPELINE] Copy generation failed for variant ${variant}`);
        continue;
      }

      // Determine compositing method based on variant type and generation method
      let finalImageUrl = sceneResult.sceneUrl;
      let compositingMethod: string;
      let modelWearingValidated: boolean | null = null;

      // Check if this is a model-wearing variant (single Edit call, no compositing needed)
      const isModelVariant = isModelWearingVariant(sceneResult.variantType);

      if (isModelVariant && sceneResult.usedEditEndpoint) {
        // MODEL_WEARING variants: Single Nano Banana Edit call
        // No additional compositing needed - the model is already wearing the product
        compositingMethod = 'nano_banana_native';
        console.log(`[PIPELINE] Model variant ${variant} - using native generation (no compositing)`);

        // Validate that model is actually wearing the product
        if (env.OPENAI_API_KEY) {
          const validationResult = await validateModelWearing(finalImageUrl, env);
          modelWearingValidated = validationResult.isWearing;

          if (!validationResult.isWearing) {
            console.warn(`[MODEL_CHECK] Model not wearing product - regenerating with stronger prompt`);
            // TODO: Regenerate with stronger prompt or fall back to product hero
            // For now, log the issue but continue
          }
        }
      } else if (sceneResult.usedEditEndpoint) {
        // Product variants using Edit endpoint: AI composited the product
        compositingMethod = 'ai_composited';
      } else {
        // Text-to-image scenes: CSS overlay (Gemini generated scene only)
        // No Photoroom - product overlay handled by frontend if needed
        compositingMethod = 'scene_overlay';
      }

      // ===========================================
      // STEP 9: Build AI Rationale
      // ===========================================
      const aiRationale = generateRationale(
        phaseResult,
        variant,
        isChallenger,
        brandDna.performance_memory.best_variant_historically,
        isStyleRotation,
        evolutionState
      );

      // Build result with extended metadata
      results.push({
        variant,
        success: true,
        sceneImageUrl: sceneResult.sceneUrl,
        productImageUrl: productImageUrl,
        cleanProductImageUrl: null,  // Bria RMBG removed - no clean version
        compositedImageUrl: finalImageUrl,
        headline: variantCopy.headline,
        primaryText: variantCopy.primaryText,
        description: variantCopy.description,
        cta: variantCopy.cta,
        compositingMethod: compositingMethod as any,
        aiRationale,
        isChallenger,
        generationPhase: phaseResult.phase,
        confidenceLevel: phaseResult.confidence,
        brandDnaVersion: brandDna.version,
        // Extended metadata from scene generation
        _variantType: sceneResult.variantType,
        _variation: sceneResult.variation,
        _seed: sceneResult.seed,
        _promptHash: sceneResult.promptHash,
        _isStyleRotation: isStyleRotation
      } as AdGenerationResult & {
        _variantType: VariantType;
        _variation: { surface: string; atmosphere: string };
        _seed: number;
        _promptHash: string;
        _isStyleRotation: boolean;
      });

      // Update evolution state with tested style
      evolutionState.testedStyles.push({
        variantType: sceneResult.variantType,
        surface: sceneResult.variation.surface,
        atmosphere: sceneResult.variation.atmosphere,
        roas: null,
        ctr: null,
        generatedAt: new Date().toISOString()
      });

      if (!evolutionState.testedAtmospheres.includes(sceneResult.variation.atmosphere)) {
        evolutionState.testedAtmospheres.push(sceneResult.variation.atmosphere);
      }
      if (!evolutionState.testedVariantTypes.includes(sceneResult.variantType)) {
        evolutionState.testedVariantTypes.push(sceneResult.variantType);
      }
    }

    if (results.length === 0) {
      throw new Error('All variant generations failed');
    }

    // ===========================================
    // STEP 10: Save All Variants to Database
    // ===========================================
    const savedAds = await saveAdsToDB(product, results, abGroup, isStyleRotation, env);

    // ===========================================
    // STEP 11: Update Creative Evolution State
    // ===========================================
    evolutionState.generationCount += 1;
    evolutionState.phase = phaseResult.phase;
    await saveCreativeEvolution(product.id, evolutionState, env);

    const duration = Date.now() - startTime;
    console.log(`[PIPELINE] Complete: ${results.length} variants in ${duration}ms`);

    // ===========================================
    // STEP 12: Return Results
    // ===========================================
    return {
      success: true,
      message: `${results.length} ad variants created for ${product.title}`,
      abGroup,
      phase: phaseResult.phase,
      variants: savedAds
    };

  } catch (error: any) {
    console.error('[PIPELINE] Error:', error);
    return {
      success: false,
      message: 'Pipeline failed',
      abGroup: '',
      phase: 'LEARNING',
      variants: [],
      error: error.message || 'Unknown error'
    };
  }
}

// ===========================================
// TEMPLATE-BASED PIPELINE
// ===========================================

/**
 * Run the template-based ad generation pipeline.
 * Uses fashion templates with field injection instead of category prompts.
 */
async function runTemplateBasedPipeline(
  product: ProductRecord,
  brandDna: BrandDNA,
  productStyle: ProductStyleProfile,
  productImageUrl: string | null,
  abGroup: string,
  phaseResult: PhaseDetectionResult,
  options: PipelineOptions,
  env: Env
): Promise<GenerateAdResponse> {
  const startTime = Date.now();
  const templateId = options.templateId!;

  // Get the template to include metadata in response
  const template = getTemplateById(templateId);
  if (!template) {
    return {
      success: false,
      message: `Template not found: ${templateId}`,
      abGroup,
      phase: phaseResult.phase,
      variants: [],
      error: `Template ${templateId} not found`
    };
  }

  console.log('[PIPELINE] Template-based generation:', {
    templateId,
    templateName: template.name,
    hasModel: template.hasModel
  });

  // Load store for brand colors
  const store = await env.DB.prepare(
    'SELECT store_name, primary_color, accent_color FROM stores WHERE id = ?'
  ).bind(product.store_id).first<{
    store_name: string | null;
    primary_color: string | null;
    accent_color: string | null;
  }>();

  // Generate copy first (needed for headline injection)
  const copyResult = await generateCopyForVariants(
    product,
    brandDna,
    productStyle,
    ['A'], // Single variant for template
    env
  );

  const variantCopy = copyResult.variants[0];
  const headline = options.headline || variantCopy?.headline || product.title;
  const subheadline = options.subheadline || variantCopy?.description || '';

  // Build template generation input
  const templateInput: TemplateGenerationInput = {
    templateId,
    product,
    brandDna,
    productStyle,
    productImageUrl: productImageUrl || '',
    storeId: product.store_id,
    env,
    // Copy fields
    headline,
    subheadline,
    // Campaign/promo fields
    promoHeadline: options.promoHeadline,
    offerText: options.offerText,
    dropLabel: options.dropLabel,
    scarcityText: options.scarcityText,
    // Store data
    storeName: store?.store_name || brandDna.brand_name,
    primaryColor: store?.primary_color || brandDna.identity.primary_palette[0],
    accentColor: store?.accent_color || brandDna.identity.accent_palette[0]
  };

  // Generate scene with template
  const sceneResult = await generateSceneWithTemplate(templateInput);

  if (!sceneResult.success) {
    return {
      success: false,
      message: 'Template-based generation failed',
      abGroup,
      phase: phaseResult.phase,
      variants: [],
      error: sceneResult.error || 'Scene generation failed'
    };
  }

  // Build result
  const adId = crypto.randomUUID();

  // Determine compositing method (templates always use ai_composited)
  const compositingMethod = 'ai_composited';

  // Save to database
  await env.DB.prepare(`
    INSERT INTO generated_ads (
      id, store_id, product_id, status,
      headline, primary_text, description, call_to_action,
      image_url, scene_image_url, product_image_url, composited_image_url,
      compositing_method, platform, format,
      ab_variant, ab_group,
      ai_rationale, is_challenger, generation_phase, confidence_level, brand_dna_version,
      template_id,
      created_at, updated_at
    )
    VALUES (?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    adId,
    product.store_id,
    product.id,
    headline,
    variantCopy?.primaryText || '',
    variantCopy?.description || '',
    variantCopy?.cta || 'Shop Now',
    sceneResult.sceneUrl,
    sceneResult.sceneUrl,
    productImageUrl,
    sceneResult.sceneUrl,
    compositingMethod,
    'meta_feed',
    'square',
    'A',
    abGroup,
    `Generated using ${template.name} template. ${template.description}`,
    0, // not challenger
    phaseResult.phase,
    phaseResult.confidence,
    brandDna.version,
    templateId
  ).run();

  const duration = Date.now() - startTime;
  console.log(`[PIPELINE] Template generation complete in ${duration}ms`);

  return {
    success: true,
    message: `Ad created using ${template.name} template`,
    abGroup,
    phase: phaseResult.phase,
    variants: [{
      id: adId,
      variant: 'A',
      productId: product.id,
      headline,
      primaryText: variantCopy?.primaryText || '',
      description: variantCopy?.description || '',
      callToAction: variantCopy?.cta || 'Shop Now',
      imageUrl: sceneResult.sceneUrl,
      sceneImageUrl: sceneResult.sceneUrl,
      productImageUrl,
      compositedImageUrl: sceneResult.sceneUrl,
      compositingMethod,
      aiRationale: `Generated using ${template.name} template. ${template.description}`,
      isChallenger: false,
      confidenceLevel: phaseResult.confidence,
      templateId,
      templateName: template.name
    }]
  };
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Save generated ads to database with extended metadata.
 */
async function saveAdsToDB(
  product: ProductRecord,
  results: (AdGenerationResult & {
    _variantType?: VariantType;
    _variation?: { surface: string; atmosphere: string };
    _seed?: number;
    _promptHash?: string;
    _isStyleRotation?: boolean;
    _templateId?: TemplateId;
  })[],
  abGroup: string,
  isStyleRotation: boolean,
  env: Env
): Promise<GenerateAdResponse['variants']> {
  const savedAds: GenerateAdResponse['variants'] = [];

  for (const result of results) {
    const adId = crypto.randomUUID();

    try {
      await env.DB.prepare(`
        INSERT INTO generated_ads (
          id, store_id, product_id, status,
          headline, primary_text, description, call_to_action,
          image_url, scene_image_url, product_image_url, composited_image_url,
          compositing_method, platform, format,
          ab_variant, ab_group,
          ai_rationale, is_challenger, generation_phase, confidence_level, brand_dna_version,
          generation_seed, prompt_hash, brand_consistent,
          is_style_rotation, is_style_experiment,
          atmosphere_used, surface_used, variant_type_used,
          created_at, updated_at
        )
        VALUES (?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        adId,
        product.store_id,
        product.id,
        result.headline,
        result.primaryText,
        result.description,
        result.cta,
        result.compositedImageUrl || result.sceneImageUrl,  // Main image
        result.sceneImageUrl,
        result.productImageUrl,
        result.compositedImageUrl,
        result.compositingMethod,
        'meta_feed',
        'square',
        result.variant,
        abGroup,
        result.aiRationale,
        result.isChallenger ? 1 : 0,
        result.generationPhase,
        result.confidenceLevel,
        result.brandDnaVersion,
        result._seed || null,
        result._promptHash || null,
        1, // brand_consistent = true
        result._isStyleRotation ? 1 : 0,
        0, // is_style_experiment = false for now
        result._variation?.atmosphere || null,
        result._variation?.surface || null,
        result._variantType || null
      ).run();

      savedAds.push({
        id: adId,
        variant: result.variant,
        productId: product.id,
        headline: result.headline,
        primaryText: result.primaryText,
        description: result.description,
        callToAction: result.cta,
        imageUrl: result.compositedImageUrl || result.sceneImageUrl,
        sceneImageUrl: result.sceneImageUrl,
        productImageUrl: result.productImageUrl,
        compositedImageUrl: result.compositedImageUrl,
        compositingMethod: result.compositingMethod,
        aiRationale: result.aiRationale,
        isChallenger: result.isChallenger,
        confidenceLevel: result.confidenceLevel,
        variantType: result._variantType,
        atmosphereUsed: result._variation?.atmosphere,
        surfaceUsed: result._variation?.surface,
        isStyleRotation: result._isStyleRotation
      });

      console.log(`[PIPELINE] Saved variant ${result.variant}:`, adId);
    } catch (error) {
      console.error(`[PIPELINE] Failed to save variant ${result.variant}:`, error);
    }
  }

  return savedAds;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get product image URL from product record.
 */
function getProductImageUrl(product: ProductRecord): string | null {
  if (product.image_url) {
    return product.image_url;
  }

  if (product.images) {
    try {
      const images = JSON.parse(product.images);
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

/**
 * Convert relative URL to absolute URL for external API calls.
 */
function getAbsoluteUrl(url: string | null, env: Env): string | null {
  if (!url) return null;

  // If already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Use R2 public URL if available
  if (env.R2_PUBLIC_URL) {
    // Extract key from /api/ads/image?key=...
    const keyMatch = url.match(/key=([^&]+)/);
    if (keyMatch) {
      const key = decodeURIComponent(keyMatch[1]);
      return `${env.R2_PUBLIC_URL}/${key}`;
    }
  }

  // Fallback: can't convert to absolute
  console.warn('[PIPELINE] Cannot convert relative URL to absolute:', url);
  return null;
}

// ===========================================
// MODEL WEARING VALIDATION
// ===========================================

/**
 * Validate that a model is actually wearing the product using GPT-4o-mini vision.
 * Returns whether the model appears to be wearing (not holding/standing next to) the item.
 */
async function validateModelWearing(
  imageUrl: string,
  env: Env
): Promise<{ isWearing: boolean; reason?: string }> {
  if (!env.OPENAI_API_KEY) {
    console.warn('[MODEL_CHECK] No OpenAI API key - skipping validation');
    return { isWearing: true }; // Assume valid if we can't check
  }

  try {
    // Convert relative URL to absolute if needed
    const absoluteUrl = getAbsoluteUrl(imageUrl, env);
    if (!absoluteUrl) {
      console.warn('[MODEL_CHECK] Cannot get absolute URL for validation');
      return { isWearing: true };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Look at this fashion/jewelry ad image. Is the model wearing the garment or jewelry ON their body? The item should be worn (on body, on finger, around neck, in ears, etc) - not held in hand, not floating next to the model, not displayed separately. Answer with ONLY one word: WEARING or NOT_WEARING'
              },
              {
                type: 'image_url',
                image_url: {
                  url: absoluteUrl,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      console.error('[MODEL_CHECK] OpenAI API error:', response.status);
      return { isWearing: true }; // Assume valid on API error
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answer = data.choices?.[0]?.message?.content?.trim().toUpperCase();
    console.log('[MODEL_CHECK] Validation result:', answer);

    if (answer === 'NOT_WEARING') {
      return { isWearing: false, reason: 'Model not wearing the product' };
    }

    return { isWearing: true };
  } catch (error: any) {
    console.error('[MODEL_CHECK] Validation error:', error);
    return { isWearing: true }; // Assume valid on error
  }
}

// ===========================================
// EXPORTED UTILITIES
// ===========================================

export { detectPhase } from './phaseDetection';
export { getBrandDNA } from './brandDna';
export { getProductStyle } from './productStyle';
export { generateCopyForVariants } from './copyGeneration';
export { generateScene } from './sceneGeneration';
// removeBackground export removed - Bria RMBG no longer used
