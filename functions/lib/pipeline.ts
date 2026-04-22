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
 * 4. Remove product background (cache result)
 * 5. Decide variants based on phase
 * 6. Generate scenes AND copy IN PARALLEL
 * 7. Fit product into scenes (Photoroom)
 * 8. Build AI rationale for each variant
 * 9. Save all variants to database
 * 10. Return results
 *
 * PROVIDER RULES ENFORCED:
 * // ZERO_HALLUCINATION: Product image always from Shopify
 * // PARALLEL: Image gen and copy gen always run in parallel
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads
 */

import type {
  Env,
  ProductRecord,
  BrandDNA,
  ProductStyleProfile,
  AdVariant,
  AdGenerationResult,
  GenerateAdResponse,
  PhaseDetectionResult
} from './types';

import { detectPhase, getVariantsToGenerate, generateRationale, updateStorePhase } from './phaseDetection';
import { getBrandDNA, getSceneTemplate } from './brandDna';
import { getProductStyle } from './productStyle';
import { generateScene, generateScenesParallel } from './sceneGeneration';
import { removeBackground, compositeProductIntoScene } from './productFitting';
import { generateCopyForVariants } from './copyGeneration';

// ===========================================
// MAIN PIPELINE FUNCTION
// ===========================================

/**
 * Execute the full ad generation pipeline.
 * This is the main entry point for generating ads.
 */
export async function runPipeline(
  product: ProductRecord,
  env: Env
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
    // STEP 4: Remove Product Background (cached)
    // ===========================================
    const rmbgResult = await removeBackground(product, env);
    console.log('[PIPELINE] Background removal:', {
      success: rmbgResult.success,
      cached: rmbgResult.cached
    });

    // ===========================================
    // STEP 5: Decide Variants Based on Phase
    // ===========================================
    const variantsToGenerate = await getVariantsToGenerate(phaseResult, product.store_id, env);
    const variants = variantsToGenerate.map(v => v.variant);
    console.log('[PIPELINE] Generating variants:', variants.join(', '));

    // Create A/B group ID
    const abGroup = `${product.id}_${Date.now()}`;

    // ===========================================
    // STEP 6: Generate Scenes AND Copy IN PARALLEL
    // ===========================================
    console.log('[PIPELINE] Starting parallel generation (scenes + copy)...');

    const [scenesMap, copyResult] = await Promise.all([
      // Generate all scenes in parallel
      generateScenesParallel(variants, brandDna, productStyle, product.store_id, env),

      // Generate all copy in one Claude call
      generateCopyForVariants(product, brandDna, productStyle, variants, env)
    ]);

    console.log('[PIPELINE] Parallel generation complete:', {
      scenes: scenesMap.size,
      copyVariants: copyResult.variants.length
    });

    // ===========================================
    // STEP 7: Fit Product Into Scenes (Photoroom)
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

      // Get Photoroom config from Brand DNA
      const template = getSceneTemplate(brandDna, variant);

      // Composite product into scene
      const fittingResult = await compositeProductIntoScene(
        product,
        sceneResult.sceneUrl,
        template.photoroomConfig,
        variant,
        env
      );

      // ===========================================
      // STEP 8: Build AI Rationale
      // ===========================================
      const aiRationale = generateRationale(
        phaseResult,
        variant,
        isChallenger,
        brandDna.performance_memory.best_variant_historically
      );

      // Build result
      results.push({
        variant,
        success: true,
        sceneImageUrl: sceneResult.sceneUrl,
        productImageUrl: getProductImageUrl(product),
        cleanProductImageUrl: rmbgResult.cleanImageUrl,
        compositedImageUrl: fittingResult.compositedImageUrl,
        headline: variantCopy.headline,
        primaryText: variantCopy.primaryText,
        description: variantCopy.description,
        cta: variantCopy.cta,
        compositingMethod: fittingResult.provider === 'photoroom' ? 'photoroom_fitted' : 'scene_overlay',
        aiRationale,
        isChallenger,
        generationPhase: phaseResult.phase,
        confidenceLevel: phaseResult.confidence,
        brandDnaVersion: brandDna.version
      });
    }

    if (results.length === 0) {
      throw new Error('All variant generations failed');
    }

    // ===========================================
    // STEP 9: Save All Variants to Database
    // ===========================================
    const savedAds = await saveAdsToDB(product, results, abGroup, env);

    const duration = Date.now() - startTime;
    console.log(`[PIPELINE] Complete: ${results.length} variants in ${duration}ms`);

    // ===========================================
    // STEP 10: Return Results
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
// DATABASE OPERATIONS
// ===========================================

/**
 * Save generated ads to database.
 */
async function saveAdsToDB(
  product: ProductRecord,
  results: AdGenerationResult[],
  abGroup: string,
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
          created_at, updated_at
        )
        VALUES (?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
        result.brandDnaVersion
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
        confidenceLevel: result.confidenceLevel
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

// ===========================================
// EXPORTED UTILITIES
// ===========================================

export { detectPhase } from './phaseDetection';
export { getBrandDNA } from './brandDna';
export { getProductStyle } from './productStyle';
export { removeBackground } from './productFitting';
export { generateCopyForVariants } from './copyGeneration';
export { generateScene } from './sceneGeneration';
