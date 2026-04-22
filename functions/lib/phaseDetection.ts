/**
 * Phase Detection - Smart Generation Logic
 *
 * // PHASE_GATING: AI reasoning unlocks only after 30 days AND 10+ published ads.
 * // Before that always 3 variants, no exceptions.
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
 *     - 1 challenger to keep testing
 *
 * EXPLOITING:
 *   - Condition: 30+ days AND 30+ published ads
 *   - Action: Use exploit/explore ratio
 *     - 70% chance: Generate 1 winning formula variant
 *     - 30% chance: Generate 1 challenger variant
 */

import type {
  Env,
  GenerationPhase,
  PhaseDetectionResult,
  AdVariant,
  StoreRecord
} from './types';

// ===========================================
// CONSTANTS
// ===========================================

const LEARNING_DAYS_THRESHOLD = 30;
const LEARNING_ADS_THRESHOLD = 10;
const OPTIMISING_ADS_THRESHOLD = 30;
const EXPLOIT_PROBABILITY = 0.7;

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
    isChallenger: false,  // First variant is winner, second is challenger
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
        // Use best + random challenger
        const challengers = variants.filter(v => v !== bestVariant);
        const challenger = challengers[Math.floor(Math.random() * challengers.length)];
        return [
          { variant: bestVariant, isChallenger: false },
          { variant: challenger, isChallenger: true }
        ];
      } else {
        // No clear winner yet - use A + random other
        const challenger = variants[Math.floor(Math.random() * 2) + 1] as AdVariant;  // B or C
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
  bestVariantHistorically: AdVariant | null
): string {
  switch (phase.phase) {
    case 'LEARNING':
      return `Testing a ${getVariantDescription(variant)} style for this product. JAIM is building your performance baseline — after ${Math.max(0, LEARNING_DAYS_THRESHOLD - phase.storeAgeDays)} days and ${Math.max(0, LEARNING_ADS_THRESHOLD - phase.publishedAdsCount)} more published ads, you will see data-driven decisions here instead.`;

    case 'OPTIMISING':
      if (isChallenger) {
        return `This is a challenger variant testing a ${getVariantDescription(variant)} approach. ${bestVariantHistorically ? `Your current best performer is Variant ${bestVariantHistorically}.` : 'JAIM is still identifying your best performing style.'} Challengers help ensure continuous improvement.`;
      }
      return `Using your emerging best performer: ${getVariantDescription(variant)} style. Based on early performance data from ${phase.publishedAdsCount} published ads. Confidence: Medium.`;

    case 'EXPLOITING':
      if (isChallenger) {
        return `${bestVariantHistorically ? `Your ${getVariantDescription(bestVariantHistorically)} format is consistently strong.` : 'Your current formula is performing well.'} This challenger tests a ${getVariantDescription(variant)} approach to see if a different style can beat your current best.`;
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
