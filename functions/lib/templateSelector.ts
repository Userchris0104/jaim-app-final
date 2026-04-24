/**
 * Template Selection Logic - Smart 3-Phase System
 *
 * PHASE 1 — NO DATA (new store):
 * Pick 3 random templates with gender filtering only.
 *
 * PHASE 2 — HAS DATA, STRATEGY WORKING:
 * Slot 1: Best performing template (winner)
 * Slot 2: Second best performing template
 * Slot 3: Random untested or least used
 *
 * PHASE 3 — STRATEGY STOPS WORKING:
 * Detect 20%+ ROAS decline over last 5 ads.
 * Promote second best, generate hybrid, test new.
 */

import type { Env, BrandDNA, ProductRecord, StoreRecord } from './types';
import { FASHION_TEMPLATES, type FashionTemplate, type TemplateId } from './fashionTemplates';

// ===========================================
// TYPES
// ===========================================

export interface SelectedTemplate {
  templateId: string;
  templateName: string;
  promptTemplate: string;
  rationale: string;
  isHybrid: boolean;
  isWinner: boolean;
  isUntested: boolean;
}

export interface TemplatePerformance {
  id: string;
  store_id: string;
  template_id: string;
  times_used: number;
  times_approved: number;
  times_published: number;
  total_spend: number;
  total_revenue: number;
  avg_roas: number | null;
  avg_ctr: number | null;
  approval_rate: number | null;
  last_5_roas: string | null;  // JSON array
  roas_trend: 'improving' | 'stable' | 'declining' | null;
  last_used_at: string | null;
}

export interface GeneratedTemplate {
  id: string;
  store_id: string;
  name: string;
  inspired_by: string;  // JSON array
  prompt_text: string;
  has_model: number;
  times_used: number;
  avg_roas: number | null;
  is_active: number;
}

type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL';

// ===========================================
// MAIN SELECTION FUNCTION
// ===========================================

/**
 * Select 3 templates for a product based on store performance data.
 * Returns exactly 3 templates with rationale for each.
 */
export async function selectTemplatesForProduct(
  store: StoreRecord,
  product: ProductRecord,
  brandDna: BrandDNA,
  env: Env
): Promise<SelectedTemplate[]> {
  // Detect product gender
  const gender = detectProductGender(product);

  // Load performance data for this store
  const performanceData = await loadTemplatePerformance(store.id, env);

  // Load any active hybrid templates
  const hybridTemplates = await loadActiveHybrids(store.id, env);

  // Determine phase and select accordingly
  if (performanceData.length === 0) {
    // PHASE 1: No data — random selection
    return selectPhase1Random(gender);
  }

  // Check if we have a clear winner
  const sortedByRoas = [...performanceData]
    .filter(p => p.avg_roas !== null && p.times_published >= 1)
    .sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0));

  if (sortedByRoas.length === 0) {
    // Have data but no published ads with ROAS — still Phase 1
    return selectPhase1Random(gender);
  }

  const winner = sortedByRoas[0];
  const secondBest = sortedByRoas[1] || null;

  // Check if winner is declining
  const isWinnerDeclining = checkForDecline(winner);

  if (isWinnerDeclining) {
    // PHASE 3: Winner declining — rotate and generate hybrid
    return await selectPhase3Rotation(
      winner,
      secondBest,
      performanceData,
      hybridTemplates,
      gender,
      brandDna,
      env
    );
  }

  // PHASE 2: Winner is working — keep using it
  return selectPhase2Winner(
    winner,
    secondBest,
    performanceData,
    gender
  );
}

// ===========================================
// PHASE 1 — RANDOM SELECTION
// ===========================================

/**
 * Phase 1: No performance data. Pick 3 random templates.
 * Only filter by gender compatibility.
 */
function selectPhase1Random(gender: Gender): SelectedTemplate[] {
  const available = filterTemplatesByGender(FASHION_TEMPLATES, gender);

  // Shuffle and pick 3
  const shuffled = shuffleArray([...available]);
  const selected = shuffled.slice(0, 3);

  return selected.map((template, index) => ({
    templateId: template.id,
    templateName: template.name,
    promptTemplate: template.promptTemplate,
    rationale: 'Exploring your best creative format — no previous data yet for your store.',
    isHybrid: false,
    isWinner: false,
    isUntested: true
  }));
}

// ===========================================
// PHASE 2 — WINNER WORKING
// ===========================================

/**
 * Phase 2: Winner is performing well. Keep using it.
 * Slot 1: Winner
 * Slot 2: Second best
 * Slot 3: Random untested
 */
function selectPhase2Winner(
  winner: TemplatePerformance,
  secondBest: TemplatePerformance | null,
  allPerformance: TemplatePerformance[],
  gender: Gender
): SelectedTemplate[] {
  const results: SelectedTemplate[] = [];
  const usedIds = new Set<string>();

  // Slot 1: Winner
  const winnerTemplate = getTemplateOrHybrid(winner.template_id);
  if (winnerTemplate) {
    results.push({
      templateId: winner.template_id,
      templateName: winnerTemplate.name,
      promptTemplate: winnerTemplate.promptTemplate,
      rationale: `Your top performing format — ${(winner.avg_roas || 0).toFixed(1)}x ROAS average for your store.`,
      isHybrid: winner.template_id.startsWith('hybrid_'),
      isWinner: true,
      isUntested: false
    });
    usedIds.add(winner.template_id);
  }

  // Slot 2: Second best
  if (secondBest) {
    const secondTemplate = getTemplateOrHybrid(secondBest.template_id);
    if (secondTemplate && !usedIds.has(secondBest.template_id)) {
      results.push({
        templateId: secondBest.template_id,
        templateName: secondTemplate.name,
        promptTemplate: secondTemplate.promptTemplate,
        rationale: 'Your second strongest format based on previous ad performance.',
        isHybrid: secondBest.template_id.startsWith('hybrid_'),
        isWinner: false,
        isUntested: false
      });
      usedIds.add(secondBest.template_id);
    }
  }

  // Slot 3: Random untested
  const testedIds = new Set(allPerformance.map(p => p.template_id));
  const available = filterTemplatesByGender(FASHION_TEMPLATES, gender)
    .filter(t => !testedIds.has(t.id) && !usedIds.has(t.id));

  if (available.length > 0) {
    const random = available[Math.floor(Math.random() * available.length)];
    results.push({
      templateId: random.id,
      templateName: random.name,
      promptTemplate: random.promptTemplate,
      rationale: 'Testing a new format to discover potential new winners.',
      isHybrid: false,
      isWinner: false,
      isUntested: true
    });
  } else {
    // All tested — pick least used
    const leastUsed = [...allPerformance]
      .filter(p => !usedIds.has(p.template_id))
      .sort((a, b) => a.times_used - b.times_used)[0];

    if (leastUsed) {
      const template = getTemplateOrHybrid(leastUsed.template_id);
      if (template) {
        results.push({
          templateId: leastUsed.template_id,
          templateName: template.name,
          promptTemplate: template.promptTemplate,
          rationale: 'Re-testing a format that hasn\'t been used recently.',
          isHybrid: leastUsed.template_id.startsWith('hybrid_'),
          isWinner: false,
          isUntested: false
        });
      }
    }
  }

  // Ensure we have 3 templates
  while (results.length < 3) {
    const fallback = filterTemplatesByGender(FASHION_TEMPLATES, gender)
      .find(t => !usedIds.has(t.id));
    if (fallback) {
      results.push({
        templateId: fallback.id,
        templateName: fallback.name,
        promptTemplate: fallback.promptTemplate,
        rationale: 'Testing a new format to discover potential new winners.',
        isHybrid: false,
        isWinner: false,
        isUntested: true
      });
      usedIds.add(fallback.id);
    } else {
      break;
    }
  }

  return results;
}

// ===========================================
// PHASE 3 — WINNER DECLINING
// ===========================================

/**
 * Phase 3: Winner is declining. Rotate templates and generate hybrid.
 */
async function selectPhase3Rotation(
  decliningWinner: TemplatePerformance,
  secondBest: TemplatePerformance | null,
  allPerformance: TemplatePerformance[],
  hybridTemplates: GeneratedTemplate[],
  gender: Gender,
  brandDna: BrandDNA,
  env: Env
): Promise<SelectedTemplate[]> {
  const results: SelectedTemplate[] = [];
  const usedIds = new Set<string>();

  // Slot 1: Promote second best to first slot
  if (secondBest) {
    const template = getTemplateOrHybrid(secondBest.template_id);
    if (template) {
      results.push({
        templateId: secondBest.template_id,
        templateName: template.name,
        promptTemplate: template.promptTemplate,
        rationale: 'Your previous format is declining — promoting your second best performer.',
        isHybrid: secondBest.template_id.startsWith('hybrid_'),
        isWinner: true,
        isUntested: false
      });
      usedIds.add(secondBest.template_id);
    }
  }

  // Slot 2: Generate or use existing hybrid
  const winnerTemplate = getTemplateOrHybrid(decliningWinner.template_id);
  const secondTemplate = secondBest ? getTemplateOrHybrid(secondBest.template_id) : null;

  // Check for existing active hybrid inspired by these templates
  let hybrid = hybridTemplates.find(h => {
    try {
      const inspired = JSON.parse(h.inspired_by || '[]');
      return inspired.includes(decliningWinner.template_id);
    } catch {
      return false;
    }
  });

  if (!hybrid && winnerTemplate && secondTemplate && env.ANTHROPIC_API_KEY) {
    // Generate new hybrid
    hybrid = await generateHybridTemplate(
      winnerTemplate,
      secondTemplate,
      decliningWinner,
      secondBest!,
      brandDna,
      env
    );
  }

  if (hybrid) {
    results.push({
      templateId: hybrid.id,
      templateName: hybrid.name,
      promptTemplate: hybrid.prompt_text,
      rationale: 'JAIM created this custom format inspired by your two best performing templates.',
      isHybrid: true,
      isWinner: false,
      isUntested: true
    });
    usedIds.add(hybrid.id);
  }

  // Slot 3: Random untested
  const testedIds = new Set(allPerformance.map(p => p.template_id));
  const available = filterTemplatesByGender(FASHION_TEMPLATES, gender)
    .filter(t => !testedIds.has(t.id) && !usedIds.has(t.id));

  if (available.length > 0) {
    const random = available[Math.floor(Math.random() * available.length)];
    results.push({
      templateId: random.id,
      templateName: random.name,
      promptTemplate: random.promptTemplate,
      rationale: 'Testing a new format to discover potential new winners.',
      isHybrid: false,
      isWinner: false,
      isUntested: true
    });
  }

  // Ensure we have 3 templates
  while (results.length < 3) {
    const fallback = filterTemplatesByGender(FASHION_TEMPLATES, gender)
      .find(t => !usedIds.has(t.id));
    if (fallback) {
      results.push({
        templateId: fallback.id,
        templateName: fallback.name,
        promptTemplate: fallback.promptTemplate,
        rationale: 'Your previous format is declining — JAIM is testing new creative directions.',
        isHybrid: false,
        isWinner: false,
        isUntested: true
      });
      usedIds.add(fallback.id);
    } else {
      break;
    }
  }

  return results;
}

// ===========================================
// HYBRID TEMPLATE GENERATION
// ===========================================

/**
 * Generate a hybrid template by combining elements from top 2 performers.
 * Uses Claude to create a new prompt inspired by both.
 */
async function generateHybridTemplate(
  template1: { name: string; promptTemplate: string },
  template2: { name: string; promptTemplate: string },
  perf1: TemplatePerformance,
  perf2: TemplatePerformance,
  brandDna: BrandDNA,
  env: Env
): Promise<GeneratedTemplate | null> {
  if (!env.ANTHROPIC_API_KEY) {
    console.warn('[HYBRID] No Anthropic API key — skipping hybrid generation');
    return null;
  }

  const systemPrompt = `You are a creative director for a fashion ad platform. Two ad templates have been performing well for a store but are now declining. Create a new ad template prompt that combines the best visual elements of both templates while introducing fresh creative direction.

Template 1 (best performer): ${template1.promptTemplate}

Template 2 (second best): ${template2.promptTemplate}

Brand DNA:
- Brand name: ${brandDna.brand_name}
- Core vibe: ${brandDna.identity.core_vibe}
- Brand voice: ${brandDna.identity.brand_voice}
- Primary colors: ${brandDna.identity.primary_palette.join(', ')}

What worked:
- Template 1 achieved ${(perf1.avg_roas || 0).toFixed(1)}x ROAS over ${perf1.times_published} ads
- Template 2 achieved ${(perf2.avg_roas || 0).toFixed(1)}x ROAS over ${perf2.times_published} ads

Generate a new Gemini image prompt that:
- Combines the strongest visual elements of both templates
- Introduces a fresh visual angle or setting
- Stays true to the brand identity
- Follows the same format as the templates (BRANDING RULES section, Image 1 instruction, scene description, text overlay instructions)
- Includes all required text overlay rules with [FIELD] placeholders

Output only the prompt text. No explanation. No preamble.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: systemPrompt }
        ]
      })
    });

    if (!response.ok) {
      console.error('[HYBRID] Claude API error:', response.status);
      return null;
    }

    const data = await response.json() as {
      content: Array<{ text: string }>;
    };

    const promptText = data.content?.[0]?.text?.trim();
    if (!promptText) {
      console.error('[HYBRID] No content in Claude response');
      return null;
    }

    // Save hybrid template to database
    const hybridId = `hybrid_${Date.now()}`;
    const hybridName = `${template1.name} + ${template2.name} Hybrid`;

    await env.DB.prepare(`
      INSERT INTO generated_templates (
        id, store_id, name, inspired_by, prompt_text,
        has_model, has_text_overlay, times_used, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1)
    `).bind(
      hybridId,
      perf1.store_id,
      hybridName,
      JSON.stringify([perf1.template_id, perf2.template_id]),
      promptText,
      template1.promptTemplate.toLowerCase().includes('[gender] model') ? 1 : 0
    ).run();

    console.log('[HYBRID] Generated new hybrid template:', hybridId);

    return {
      id: hybridId,
      store_id: perf1.store_id,
      name: hybridName,
      inspired_by: JSON.stringify([perf1.template_id, perf2.template_id]),
      prompt_text: promptText,
      has_model: template1.promptTemplate.toLowerCase().includes('[gender] model') ? 1 : 0,
      times_used: 0,
      avg_roas: null,
      is_active: 1
    };
  } catch (error: any) {
    console.error('[HYBRID] Error generating hybrid:', error);
    return null;
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Detect product gender from title, tags, and type.
 */
function detectProductGender(product: ProductRecord): Gender {
  const text = `${product.title} ${product.tags || ''} ${product.product_type || ''}`.toLowerCase();

  const maleIndicators = ['men', 'male', 'guy', 'boy', 'him', 'his', "men's", 'mens'];
  const femaleIndicators = ['women', 'female', 'girl', 'her', 'lady', "women's", 'womens'];

  const hasMale = maleIndicators.some(ind => text.includes(ind));
  const hasFemale = femaleIndicators.some(ind => text.includes(ind));

  if (hasMale && !hasFemale) return 'MALE';
  if (hasFemale && !hasMale) return 'FEMALE';
  return 'NEUTRAL';
}

/**
 * Filter templates by gender compatibility.
 */
function filterTemplatesByGender(
  templates: FashionTemplate[],
  gender: Gender
): FashionTemplate[] {
  return templates.filter(t => {
    // Female-coded templates to exclude for MALE products
    const femaleCodedTemplates = ['T13_GOLDEN_HOUR'];

    // Templates with models to exclude for NEUTRAL products
    const modelTemplates = templates.filter(temp => temp.hasModel).map(temp => temp.id);

    if (gender === 'MALE' && femaleCodedTemplates.includes(t.id)) {
      return false;
    }

    if (gender === 'NEUTRAL' && modelTemplates.includes(t.id)) {
      return false;
    }

    return true;
  });
}

/**
 * Check if a template's performance is declining.
 * Decline = avg_roas dropped more than 20% over last 5 ads.
 */
function checkForDecline(perf: TemplatePerformance): boolean {
  if (!perf.last_5_roas) return false;

  try {
    const roasValues: number[] = JSON.parse(perf.last_5_roas);

    // Need at least 5 data points to declare decline
    if (roasValues.length < 5) return false;

    // Compare first half to second half
    const firstHalf = roasValues.slice(0, 2);
    const secondHalf = roasValues.slice(-2);

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    // Check for 20%+ decline
    if (firstAvg > 0 && secondAvg < firstAvg * 0.8) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get template by ID (fixed or hybrid).
 */
function getTemplateOrHybrid(templateId: string): { name: string; promptTemplate: string } | null {
  // Check fixed templates first
  const fixed = FASHION_TEMPLATES.find(t => t.id === templateId);
  if (fixed) {
    return { name: fixed.name, promptTemplate: fixed.promptTemplate };
  }

  // Hybrid templates are loaded separately and passed in
  // This function only handles fixed templates
  return null;
}

/**
 * Shuffle array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Load template performance data for a store.
 */
async function loadTemplatePerformance(
  storeId: string,
  env: Env
): Promise<TemplatePerformance[]> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM template_performance
      WHERE store_id = ?
      ORDER BY avg_roas DESC NULLS LAST
    `).bind(storeId).all<TemplatePerformance>();

    return result.results || [];
  } catch (error) {
    // Table might not exist yet
    console.warn('[SELECTOR] Could not load template performance:', error);
    return [];
  }
}

/**
 * Load active hybrid templates for a store.
 */
async function loadActiveHybrids(
  storeId: string,
  env: Env
): Promise<GeneratedTemplate[]> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM generated_templates
      WHERE store_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `).bind(storeId).all<GeneratedTemplate>();

    return result.results || [];
  } catch (error) {
    // Table might not exist yet
    console.warn('[SELECTOR] Could not load hybrid templates:', error);
    return [];
  }
}

/**
 * Record template usage for performance tracking.
 */
export async function recordTemplateUsage(
  storeId: string,
  templateId: string,
  env: Env
): Promise<void> {
  try {
    // Upsert into template_performance
    await env.DB.prepare(`
      INSERT INTO template_performance (id, store_id, template_id, times_used, first_used_at, last_used_at)
      VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
      ON CONFLICT(store_id, template_id) DO UPDATE SET
        times_used = times_used + 1,
        last_used_at = datetime('now'),
        updated_at = datetime('now')
    `).bind(
      `${storeId}_${templateId}`,
      storeId,
      templateId
    ).run();
  } catch (error) {
    console.warn('[SELECTOR] Could not record template usage:', error);
  }
}

/**
 * Update template performance with ad results.
 */
export async function updateTemplatePerformance(
  storeId: string,
  templateId: string,
  metrics: {
    approved?: boolean;
    published?: boolean;
    spend?: number;
    revenue?: number;
    impressions?: number;
    clicks?: number;
  },
  env: Env
): Promise<void> {
  try {
    const updates: string[] = ['updated_at = datetime(\'now\')'];
    const values: any[] = [];

    if (metrics.approved) {
      updates.push('times_approved = times_approved + 1');
    }
    if (metrics.published) {
      updates.push('times_published = times_published + 1');
    }
    if (metrics.spend !== undefined) {
      updates.push('total_spend = total_spend + ?');
      values.push(metrics.spend);
    }
    if (metrics.revenue !== undefined) {
      updates.push('total_revenue = total_revenue + ?');
      values.push(metrics.revenue);
    }
    if (metrics.impressions !== undefined) {
      updates.push('total_impressions = total_impressions + ?');
      values.push(metrics.impressions);
    }
    if (metrics.clicks !== undefined) {
      updates.push('total_clicks = total_clicks + ?');
      values.push(metrics.clicks);
    }

    // Recalculate metrics
    updates.push('avg_roas = CASE WHEN total_spend > 0 THEN total_revenue / total_spend ELSE NULL END');
    updates.push('avg_ctr = CASE WHEN total_impressions > 0 THEN CAST(total_clicks AS REAL) / total_impressions ELSE NULL END');
    updates.push('approval_rate = CASE WHEN times_used > 0 THEN CAST(times_approved AS REAL) / times_used ELSE NULL END');

    await env.DB.prepare(`
      UPDATE template_performance
      SET ${updates.join(', ')}
      WHERE store_id = ? AND template_id = ?
    `).bind(...values, storeId, templateId).run();
  } catch (error) {
    console.warn('[SELECTOR] Could not update template performance:', error);
  }
}

/**
 * Update ROAS history for trend tracking.
 */
export async function updateRoasHistory(
  storeId: string,
  templateId: string,
  newRoas: number,
  env: Env
): Promise<void> {
  try {
    // Get current history
    const current = await env.DB.prepare(`
      SELECT last_5_roas FROM template_performance
      WHERE store_id = ? AND template_id = ?
    `).bind(storeId, templateId).first<{ last_5_roas: string | null }>();

    let history: number[] = [];
    if (current?.last_5_roas) {
      try {
        history = JSON.parse(current.last_5_roas);
      } catch {
        history = [];
      }
    }

    // Add new value, keep last 5
    history.push(newRoas);
    if (history.length > 5) {
      history = history.slice(-5);
    }

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (history.length >= 3) {
      const firstHalf = history.slice(0, Math.floor(history.length / 2));
      const secondHalf = history.slice(Math.floor(history.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.1) trend = 'improving';
      else if (secondAvg < firstAvg * 0.9) trend = 'declining';
    }

    await env.DB.prepare(`
      UPDATE template_performance
      SET last_5_roas = ?, roas_trend = ?, updated_at = datetime('now')
      WHERE store_id = ? AND template_id = ?
    `).bind(
      JSON.stringify(history),
      trend,
      storeId,
      templateId
    ).run();
  } catch (error) {
    console.warn('[SELECTOR] Could not update ROAS history:', error);
  }
}
