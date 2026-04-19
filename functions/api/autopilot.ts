/**
 * Autopilot API - AI automation settings and actions
 * GET /api/autopilot - Get settings and recent actions
 * POST /api/autopilot - Update settings or trigger actions
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

interface Env {
  DB: D1Database;
}

interface AutopilotSettings {
  id: string;
  store_id: string;
  enabled: number;
  daily_budget_limit: number | null;
  monthly_budget_limit: number | null;
  min_roas_threshold: number;
  auto_pause_underperforming: number;
  auto_scale_winners: number;
  auto_create_ads: number;
  auto_publish_ads: number;
  pause_after_days: number;
  min_spend_before_pause: number;
  scale_roas_threshold: number;
  scale_increase_percent: number;
  active_hours: string | null;
  active_days: string | null;
  platforms: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/autopilot
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const includeActions = url.searchParams.get('actions') !== 'false';
  const actionsLimit = parseInt(url.searchParams.get('actionsLimit') || '20');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get or create settings
    let settings = await env.DB.prepare(`
      SELECT * FROM autopilot_settings WHERE store_id = ?
    `).bind(store.id).first<AutopilotSettings>();

    if (!settings) {
      // Create default settings
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO autopilot_settings (id, store_id, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(id, store.id).run();

      settings = await env.DB.prepare(`
        SELECT * FROM autopilot_settings WHERE id = ?
      `).bind(id).first<AutopilotSettings>();
    }

    const response: any = {
      success: true,
      settings: formatSettings(settings!),
    };

    // Get recent actions if requested
    if (includeActions) {
      const actions = await env.DB.prepare(`
        SELECT * FROM autopilot_actions
        WHERE store_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(store.id, actionsLimit).all();

      response.recentActions = actions.results.map((a: any) => ({
        id: a.id,
        actionType: a.action_type,
        targetType: a.target_type,
        targetId: a.target_id,
        targetName: a.target_name,
        reason: a.reason,
        details: a.details ? JSON.parse(a.details) : null,
        platform: a.platform,
        status: a.status,
        errorMessage: a.error_message,
        createdAt: a.created_at,
      }));

      // Get action stats
      const stats = await env.DB.prepare(`
        SELECT
          action_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM autopilot_actions
        WHERE store_id = ? AND created_at >= datetime('now', '-30 days')
        GROUP BY action_type
      `).bind(store.id).all();

      response.actionStats = stats.results;
    }

    return Response.json(response);
  } catch (error: any) {
    console.error('Error fetching autopilot:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST /api/autopilot
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const body = await request.json() as {
      action: string;
      settings?: Partial<AutopilotSettings>;
      actionId?: string;
    };

    const { action, settings, actionId } = body;

    switch (action) {
      case 'update_settings':
        return updateSettings(env.DB, store.id, settings!);

      case 'toggle':
        return toggleAutopilot(env.DB, store.id);

      case 'revert_action':
        return revertAction(env.DB, store.id, actionId!);

      case 'run_check':
        return runAutopilotCheck(env.DB, store.id);

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in autopilot action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// Update autopilot settings
async function updateSettings(db: D1Database, storeId: string, settings: Partial<AutopilotSettings>) {
  const allowedFields = [
    'enabled', 'daily_budget_limit', 'monthly_budget_limit', 'min_roas_threshold',
    'auto_pause_underperforming', 'auto_scale_winners', 'auto_create_ads', 'auto_publish_ads',
    'pause_after_days', 'min_spend_before_pause', 'scale_roas_threshold', 'scale_increase_percent',
    'active_hours', 'active_days', 'platforms'
  ];

  const fields: string[] = [];
  const values: any[] = [];

  for (const field of allowedFields) {
    if (field in settings) {
      fields.push(`${field} = ?`);
      let value = (settings as any)[field];

      // Convert boolean to integer for SQLite
      if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }

      // Stringify JSON fields
      if (['active_hours', 'active_days', 'platforms'].includes(field) && value !== null) {
        value = JSON.stringify(value);
      }

      values.push(value);
    }
  }

  if (fields.length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  fields.push('updated_at = datetime(\'now\')');
  values.push(storeId);

  await db.prepare(`
    UPDATE autopilot_settings SET ${fields.join(', ')} WHERE store_id = ?
  `).bind(...values).run();

  const updated = await db.prepare(`
    SELECT * FROM autopilot_settings WHERE store_id = ?
  `).bind(storeId).first<AutopilotSettings>();

  return Response.json({
    success: true,
    settings: formatSettings(updated!),
  });
}

// Toggle autopilot on/off
async function toggleAutopilot(db: D1Database, storeId: string) {
  const current = await db.prepare(`
    SELECT enabled FROM autopilot_settings WHERE store_id = ?
  `).bind(storeId).first<{ enabled: number }>();

  const newState = current?.enabled === 1 ? 0 : 1;

  await db.prepare(`
    UPDATE autopilot_settings SET enabled = ?, updated_at = datetime('now')
    WHERE store_id = ?
  `).bind(newState, storeId).run();

  // Log the action
  await db.prepare(`
    INSERT INTO autopilot_actions (id, store_id, action_type, reason, status, created_at)
    VALUES (?, ?, ?, ?, 'completed', datetime('now'))
  `).bind(
    crypto.randomUUID(),
    storeId,
    newState === 1 ? 'autopilot_enabled' : 'autopilot_disabled',
    'Manual toggle by user'
  ).run();

  return Response.json({
    success: true,
    enabled: newState === 1,
  });
}

// Revert an autopilot action
async function revertAction(db: D1Database, storeId: string, actionId: string) {
  const action = await db.prepare(`
    SELECT * FROM autopilot_actions WHERE id = ? AND store_id = ?
  `).bind(actionId, storeId).first();

  if (!action) {
    return Response.json({ error: 'Action not found' }, { status: 404 });
  }

  // Mark action as reverted
  await db.prepare(`
    UPDATE autopilot_actions SET status = 'reverted' WHERE id = ?
  `).bind(actionId).run();

  // TODO: Actually revert the action (unpause ad, reduce budget, etc.)

  return Response.json({
    success: true,
    reverted: true,
    actionId,
  });
}

// Run autopilot check (manual trigger)
async function runAutopilotCheck(db: D1Database, storeId: string) {
  // This would trigger the autopilot logic
  // In production, this would be run by a scheduled worker

  const settings = await db.prepare(`
    SELECT * FROM autopilot_settings WHERE store_id = ?
  `).bind(storeId).first<AutopilotSettings>();

  if (!settings || settings.enabled !== 1) {
    return Response.json({
      success: false,
      error: 'Autopilot is not enabled',
    });
  }

  // Log the manual check
  await db.prepare(`
    INSERT INTO autopilot_actions (id, store_id, action_type, reason, status, created_at)
    VALUES (?, ?, 'manual_check', 'Manual check triggered by user', 'completed', datetime('now'))
  `).bind(crypto.randomUUID(), storeId).run();

  return Response.json({
    success: true,
    message: 'Autopilot check triggered',
    // In production, this would return what actions were taken
    actions: [],
  });
}

// Format settings for API response
function formatSettings(settings: AutopilotSettings) {
  return {
    enabled: settings.enabled === 1,
    budgetLimits: {
      daily: settings.daily_budget_limit,
      monthly: settings.monthly_budget_limit,
    },
    thresholds: {
      minRoas: settings.min_roas_threshold,
      scaleRoas: settings.scale_roas_threshold,
      minSpendBeforePause: settings.min_spend_before_pause,
    },
    automation: {
      autoPauseUnderperforming: settings.auto_pause_underperforming === 1,
      autoScaleWinners: settings.auto_scale_winners === 1,
      autoCreateAds: settings.auto_create_ads === 1,
      autoPublishAds: settings.auto_publish_ads === 1,
    },
    timing: {
      pauseAfterDays: settings.pause_after_days,
      scaleIncreasePercent: settings.scale_increase_percent,
      activeHours: settings.active_hours ? JSON.parse(settings.active_hours) : null,
      activeDays: settings.active_days ? JSON.parse(settings.active_days) : null,
    },
    platforms: settings.platforms ? JSON.parse(settings.platforms) : [],
    updatedAt: settings.updated_at,
  };
}
