/**
 * Phase Detection - Smart Generation Logic with Creative Evolution
 *
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads.
 * // Before that always 3 variants, no exceptions.
 *
 * // NEVER_STOP_TESTING: Even in EXPLOITING phase, 30% challengers must be
 * // genuinely different from the winner — not micro-variations.
 *
 * // STYLE_ROTATION: Every 10 generations force a new untested style combination
 * // to prevent creative staleness and ad fatigue.
 *
 * Three phases:
 *
 * LEARNING (default for new stores):
 *   - Condition: fewer than 30 days active OR fewer than 10 published ads
 *   - Action: Generate 3 variants (A, B, C)
 *   - Reason: Building performance baseline
 *
 * OPTIMISING:
 *   - Condition: 30+ days AND 10-30 published ads
 *   - Action: Generate 2 variants
 *     - 1 based on best performing style so far
 *     - 1 challenger (genuinely different)
 *
 * EXPLOITING:
 *   - Condition: 30+ days AND 30+ published ads
 *   - Action: Use exploit/explore ratio
 *     - 70% chance: Generate 1 winning formula variant
 *     - 30% chance: Generate 1 challenger variant (must differ)
 */

import type {
  Env,
  GenerationPhase,
  PhaseDetectionResult,
  AdVariant,
  StoreRecord,
  CreativeEvolutionState,
  WinningFormula
} from './types';

import {
  CATEGORY_VARIANTS,
  getVariationPools,
  type VariantType
} from './promptVariation';

// ===========================================
// CONSTANTS
// ===========================================

const LEARNING_DAYS_THRESHOLD = 30;
const LEARNING_ADS_THRESHOLD = 10;
const OPTIMISING_ADS_THRESHOLD = 30;
const EXPLOIT_PROBABILITY = 0.7;
const STYLE_ROTATION_FREQUENCY = 10; // Every 10 generations
const STYLE_ROTATION_DAYS = 14; // Or every 14 days

// ===========================================
// PHASE DETECTION
// ===========================================

/**
 * Detect the current generation phase for a store.
 * Returns phase info including number of variants to generate.
 */
export async function detectPhase(
  storeId: string,
  env: Env
): Promise<PhaseDetectionResult> {
  // Get store data
  const store = await env.DB.prepare(`
    SELECT
      id,
      connected_at,
      generation_phase,
      performance_insights
    FROM stores
    WHERE id = ?
  `).bind(storeId).first<StoreRecord>();

  if (!store) {
    return createLearningPhase(0, 0, 'Store not found - defaulting to learning');
  }

  // Calculate store age in days
  const connectedAt = new Date(store.connected_at);
  const now = new Date();
  const storeAgeDays = Math.floor(
    (now.getTime() - connectedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Count published ads
  const publishedResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM generated_ads
    WHERE store_id = ? AND status = 'published'
  `).bind(storeId).first<{ count: number }>();

  const publishedAdsCount = publishedResult?.count || 0;

  // Determine phase
  const phase = determinePhase(storeAgeDays, publishedAdsCount);

  // Build result based on phase
  switch (phase) {
    case 'LEARNING':
      return createLearningPhase(storeAgeDays, publishedAdsCount);

    case 'OPTIMISING':
      return await createOptimisingPhase(storeId, storeAgeDays, publishedAdsCount, env);

    case 'EXPLOITING':
      return await createExploitingPhase(storeId, storeAgeDays, publishedAdsCount, env);
  }
}

/**
 * Determine which phase a store is in based on age and ad count.
 */
function determinePhase(storeAgeDays: number, publishedAdsCount: number): GenerationPhase {
  // Not enough time OR not enough ads → LEARNING
  if (storeAgeDays < LEARNING_DAYS_THRESHOLD || publishedAdsCount < LEARNING_ADS_THRESHOLD) {
    return 'LEARNING';
  }

  // 30+ days AND 10-30 ads → OPTIMISING
  if (publishedAdsCount < OPTIMISING_ADS_THRESHOLD) {
    return 'OPTIMISING';
  }

  // 30+ days AND 30+ ads → EXPLOITING
  return 'EXPLOITING';
}

/**
 * Create LEARNING phase result - always 3 variants.
 */
function createLearningPhase(
  storeAgeDays: number,
  publishedAdsCount: number,
  customRationale?: string
): PhaseDetectionResult {
  const daysRemaining = Math.max(0, LEARNING_DAYS_THRESHOLD - storeAgeDays);
  const adsRemaining = Math.max(0, LEARNING_ADS_THRESHOLD - publishedAdsCount);

  let rationale = customRationale;
  if (!rationale) {
    if (storeAgeDays < LEARNING_DAYS_THRESHOLD && publishedAdsCount < LEARNING_ADS_THRESHOLD) {
      rationale = `Building your performance baseline. ${daysRemaining} days and ${adsRemaining} more published ads until JAIM can make data-driven decisions.`;
    } else if (storeAgeDays < LEARNING_DAYS_THRESHOLD) {
      rationale = `Building your performance baseline. ${daysRemaining} more days until JAIM can analyze patterns.`;
    } else {
      rationale = `Building your performance baseline. ${adsRemaining} more published ads needed for pattern analysis.`;
    }
  }

  return {
    phase: 'LEARNING',
    storeAgeDays,
    publishedAdsCount,
    variantsToGenerate: 3,
    useWinningFormula: false,
    isChallenger: false,
    confidence: 'low',
    rationale
  };
}

/**
 * Create OPTIMISING phase result - 2 variants (winner + challenger).
 */
async function createOptimisingPhase(
  storeId: string,
  storeAgeDays: number,
  publishedAdsCount: number,
  env: Env
): Promise<PhaseDetectionResult> {
  // Get best performing variant historically
  const bestVariant = await getBestPerformingVariant(storeId, env);

  return {
    phase: 'OPTIMISING',
    storeAgeDays,
    publishedAdsCount,
    variantsToGenerate: 2,
    useWinningFormula: true,
    isChallenger: false,
    confidence: 'medium',
    rationale: bestVariant
      ? `Using your best performing style (Variant ${bestVariant}) plus a challenger. ${OPTIMISING_ADS_THRESHOLD - publishedAdsCount} more ads until full optimization.`
      : `Testing styles to find your winner. ${OPTIMISING_ADS_THRESHOLD - publishedAdsCount} more ads until full optimization.`
  };
}

/**
 * Create EXPLOITING phase result - exploit/explore decision.
 */
async function createExploitingPhase(
  storeId: string,
  storeAgeDays: number,
  publishedAdsCount: number,
  env: Env
): Promise<PhaseDetectionResult> {
  // 70% exploit, 30% explore
  const shouldExploit = Math.random() < EXPLOIT_PROBABILITY;
  const bestVariant = await getBestPerformingVariant(storeId, env);

  if (shouldExploit && bestVariant) {
    return {
      phase: 'EXPLOITING',
      storeAgeDays,
      publishedAdsCount,
      variantsToGenerate: 1,
      useWinningFormula: true,
      isChallenger: false,
      confidence: 'high',
      rationale: `Using your proven winning formula (Variant ${bestVariant}). Based on ${publishedAdsCount} published ads over ${storeAgeDays} days.`
    };
  } else {
    return {
      phase: 'EXPLOITING',
      storeAgeDays,
      publishedAdsCount,
      variantsToGenerate: 1,
      useWinningFormula: false,
      isChallenger: true,
      confidence: 'medium',
      rationale: `Testing a challenger approach to potentially beat your current best. Exploration keeps your ads fresh and may discover better performing styles.`
    };
  }
}

// ===========================================
// CREATIVE EVOLUTION STATE
// ===========================================

/**
 * Load creative evolution state for a product.
 */
export async function loadCreativeEvolution(
  productId: string,
  env: Env
): Promise<CreativeEvolutionState | null> {
  const result = await env.DB.prepare(`
    SELECT creative_evolution FROM products WHERE id = ?
  `).bind(productId).first<{ creative_evolution: string | null }>();

  if (!result?.creative_evolution) {
    return null;
  }

  try {
    return JSON.parse(result.creative_evolution) as CreativeEvolutionState;
  } catch {
    return null;
  }
}

/**
 * Save creative evolution state for a product.
 */
export async function saveCreativeEvolution(
  productId: string,
  state: CreativeEvolutionState,
  env: Env
): Promise<void> {
  await env.DB.prepare(`
    UPDATE products
    SET creative_evolution = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(JSON.stringify(state), productId).run();
}

/**
 * Create initial creative evolution state.
 */
export function createInitialEvolutionState(phase: GenerationPhase): CreativeEvolutionState {
  return {
    phase,
    testedStyles: [],
    winningFormula: null,
    untestedCombinations: [],
    lastNewStyleTestedAt: null,
    newStyleTestFrequency: STYLE_ROTATION_FREQUENCY,
    generationCount: 0,
    lastStyleRotation: null,
    testedAtmospheres: [],
    testedVariantTypes: [],
    untestedAtmospheres: []
  };
}

/**
 * Check if style rotation is due.
 */
export function isStyleRotationDue(state: CreativeEvolutionState): boolean {
  // Rotate every N generations
  if (state.generationCount > 0 && state.generationCount % STYLE_ROTATION_FREQUENCY === 0) {
    return true;
  }

  // Rotate if same atmosphere winning for more than 20 consecutive generations
  const recentAtmospheres = state.testedStyles.slice(-20).map(s => s.atmosphere);
  const uniqueAtmospheres = new Set(recentAtmospheres).size;
  if (recentAtmospheres.length >= 20 && uniqueAtmospheres <= 2) {
    return true;
  }

  // Rotate if it has been more than 14 days since a new style was tested
  if (state.lastNewStyleTestedAt) {
    const daysSince = getDaysSince(state.lastNewStyleTestedAt);
    if (daysSince > STYLE_ROTATION_DAYS) {
      return true;
    }
  }

  return false;
}

/**
 * Get days since a date string.
 */
function getDaysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get an untested atmosphere for style rotation.
 */
export function getUntestedAtmosphere(
  state: CreativeEvolutionState,
  category: string
): string | null {
  const pools = getVariationPools(category as any);
  const testedSet = new Set(state.testedAtmospheres);

  for (const atmosphere of pools.atmospheres) {
    if (!testedSet.has(atmosphere)) {
      return atmosphere;
    }
  }

  // All tested, return random
  return pools.atmospheres[Math.floor(Math.random() * pools.atmospheres.length)];
}

/**
 * Check if a challenger is genuinely different from winner.
 */
export function isChallengerDifferent(
  challengerVariantType: string,
  challengerAtmosphere: string,
  winningFormula: WinningFormula | null
): boolean {
  if (!winningFormula) return true;

  // Must differ in variant type OR atmosphere
  const differentVariantType = challengerVariantType !== winningFormula.variantType;
  const differentAtmosphere = challengerAtmosphere !== winningFormula.atmosphere;

  return differentVariantType || differentAtmosphere;
}

// ===========================================
// PERFORMANCE ANALYSIS
// ===========================================

/**
 * Get the best performing variant historically based on ROAS.
 */
async function getBestPerformingVariant(
  storeId: string,
  env: Env
): Promise<AdVariant | null> {
  const result = await env.DB.prepare(`
    SELECT
      ga.ab_variant,
      AVG(ap.roas) as avg_roas,
      COUNT(*) as ad_count
    FROM generated_ads ga
    JOIN ad_performance ap ON ga.id = ap.ad_id
    WHERE ga.store_id = ?
      AND ga.ab_variant IS NOT NULL
      AND ap.roas > 0
    GROUP BY ga.ab_variant
    HAVING ad_count >= 3
    ORDER BY avg_roas DESC
    LIMIT 1
  `).bind(storeId).first<{ ab_variant: string; avg_roas: number; ad_count: number }>();

  if (result?.ab_variant && ['A', 'B', 'C'].includes(result.ab_variant)) {
    return result.ab_variant as AdVariant;
  }

  return null;
}

/**
 * Get winning formula details.
 */
export async function getWinningFormula(
  storeId: string,
  env: Env
): Promise<WinningFormula | null> {
  const result = await env.DB.prepare(`
    SELECT
      ga.variant_type_used,
      ga.atmosphere_used,
      AVG(ap.roas) as avg_roas,
      COUNT(*) as ad_count
    FROM generated_ads ga
    JOIN ad_performance ap ON ga.id = ap.ad_id
    WHERE ga.store_id = ?
      AND ga.variant_type_used IS NOT NULL
      AND ap.roas > 0
    GROUP BY ga.variant_type_used, ga.atmosphere_used
    HAVING ad_count >= 3
    ORDER BY avg_roas DESC
    LIMIT 1
  `).bind(storeId).first<{
    variant_type_used: string;
    atmosphere_used: string;
    avg_roas: number;
    ad_count: number;
  }>();

  if (!result) return null;

  return {
    variantType: result.variant_type_used,
    atmosphere: result.atmosphere_used,
    copyAngle: 'benefit', // Default, could be tracked separately
    avgRoas: result.avg_roas,
    confidence: result.ad_count >= 10 ? 'high' : result.ad_count >= 5 ? 'medium' : 'low'
  };
}

/**
 * Get variants to generate based on phase.
 * Returns array of variant configs with challenger flags.
 */
export async function getVariantsToGenerate(
  phaseResult: PhaseDetectionResult,
  storeId: string,
  env: Env
): Promise<Array<{ variant: AdVariant; isChallenger: boolean }>> {
  switch (phaseResult.phase) {
    case 'LEARNING':
      // Always A, B, C - none are challengers in learning phase
      return [
        { variant: 'A', isChallenger: false },
        { variant: 'B', isChallenger: false },
        { variant: 'C', isChallenger: false }
      ];

    case 'OPTIMISING': {
      // Best variant + one challenger
      const bestVariant = await getBestPerformingVariant(storeId, env);
      const variants: AdVariant[] = ['A', 'B', 'C'];

      if (bestVariant) {
        // Use best + random challenger (must be different)
        const challengers = variants.filter(v => v !== bestVariant);
        const challenger = challengers[Math.floor(Math.random() * challengers.length)];
        return [
          { variant: bestVariant, isChallenger: false },
          { variant: challenger, isChallenger: true }
        ];
      } else {
        // No clear winner yet - use A + random other
        const challenger = variants[Math.floor(Math.random() * 2) + 1] as AdVariant;
        return [
          { variant: 'A', isChallenger: false },
          { variant: challenger, isChallenger: true }
        ];
      }
    }

    case 'EXPLOITING': {
      if (phaseResult.useWinningFormula) {
        // Exploit - use winning variant
        const bestVariant = await getBestPerformingVariant(storeId, env) || 'A';
        return [{ variant: bestVariant, isChallenger: false }];
      } else {
        // Explore - random challenger
        const variants: AdVariant[] = ['A', 'B', 'C'];
        const variant = variants[Math.floor(Math.random() * variants.length)];
        return [{ variant, isChallenger: true }];
      }
    }
  }
}

/**
 * Update store's generation phase in database.
 */
export async function updateStorePhase(
  storeId: string,
  phase: GenerationPhase,
  env: Env
): Promise<void> {
  await env.DB.prepare(`
    UPDATE stores
    SET generation_phase = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(phase, storeId).run();
}

/**
 * Generate AI rationale text based on phase and context.
 */
export function generateRationale(
  phase: PhaseDetectionResult,
  variant: AdVariant,
  isChallenger: boolean,
  bestVariantHistorically: AdVariant | null,
  isStyleRotation: boolean = false,
  evolutionState?: CreativeEvolutionState
): string {
  // Style rotation rationale
  if (isStyleRotation && evolutionState) {
    const winningAtmosphere = evolutionState.winningFormula?.atmosphere || 'current style';
    return `Your ${winningAtmosphere} style has been your strongest performer. To keep your ads feeling fresh to your audience, JAIM is testing a new style today. If it beats your current winner, we will update your formula. If not, your proven style continues.`;
  }

  switch (phase.phase) {
    case 'LEARNING':
      return `Testing ${getVariantDescription(variant)} style for this product. JAIM is building your performance baseline — after ${Math.max(0, LEARNING_DAYS_THRESHOLD - phase.storeAgeDays)} days and ${Math.max(0, LEARNING_ADS_THRESHOLD - phase.publishedAdsCount)} more published ads, you will see data-driven decisions here instead.`;

    case 'OPTIMISING':
      if (isChallenger) {
        return `This is a challenger variant testing a ${getVariantDescription(variant)} approach. ${bestVariantHistorically ? `Your current best performer is Variant ${bestVariantHistorically}.` : 'JAIM is still identifying your best performing style.'} Challengers help ensure continuous improvement.`;
      }
      return `Using your emerging best performer: ${getVariantDescription(variant)} style. Based on early performance data from ${phase.publishedAdsCount} published ads. Confidence: Medium.`;

    case 'EXPLOITING':
      if (isChallenger) {
        return `${bestVariantHistorically ? `Your ${getVariantDescription(bestVariantHistorically)} format is consistently strong.` : 'Your current formula is performing well.'} This challenger tests a ${getVariantDescription(variant)} approach — a combination you haven't tried yet. 30% of generations are challengers to keep creative fresh and discover potential new winners.`;
      }
      return `${getVariantDescription(variant)} has driven your best ROAS over the last ${phase.storeAgeDays} days. This ad follows that proven formula. Confidence: High based on ${phase.publishedAdsCount} published ads.`;
  }
}

/**
 * Get human-readable description of a variant.
 */
function getVariantDescription(variant: AdVariant): string {
  switch (variant) {
    case 'A':
      return 'clean minimal';
    case 'B':
      return 'lifestyle contextual';
    case 'C':
      return 'bold editorial';
  }
}
