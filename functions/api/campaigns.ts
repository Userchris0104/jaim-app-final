/**
 * Campaigns API - Campaign management
 * GET /api/campaigns - List campaigns for current store
 * GET /api/campaigns?id=xxx - Get single campaign
 * POST /api/campaigns - Create new campaign
 * PUT /api/campaigns - Update campaign
 * DELETE /api/campaigns - Delete campaign
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

interface Env {
  DB: D1Database;
}

interface Campaign {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  status: string;
  budget_type: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
  total_spent: number;
  start_date: string | null;
  end_date: string | null;
  objective: string;
  target_audience: string | null;
  platforms: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// GET /api/campaigns
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const campaignId = url.searchParams.get('id');
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Get single campaign
    if (campaignId) {
      const campaign = await env.DB.prepare(`
        SELECT * FROM campaigns WHERE id = ? AND store_id = ?
      `).bind(campaignId, store.id).first<Campaign>();

      if (!campaign) {
        return Response.json({ error: 'Campaign not found' }, { status: 404 });
      }

      // Get ads in this campaign
      const ads = await env.DB.prepare(`
        SELECT ga.* FROM generated_ads ga
        JOIN campaign_ads ca ON ga.id = ca.ad_id
        WHERE ca.campaign_id = ?
      `).bind(campaignId).all();

      return Response.json({
        success: true,
        campaign: formatCampaign(campaign),
        ads: ads.results,
      });
    }

    // List campaigns
    let query = 'SELECT * FROM campaigns WHERE store_id = ?';
    const params: any[] = [store.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const campaigns = await env.DB.prepare(query).bind(...params).all();

    const countResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM campaigns WHERE store_id = ?'
    ).bind(store.id).first<{ count: number }>();

    return Response.json({
      success: true,
      campaigns: campaigns.results.map((c: any) => formatCampaign(c)),
      total: countResult?.count || 0,
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST /api/campaigns - Create campaign
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const body = await request.json() as Partial<Campaign> & { adIds?: string[] };
    const {
      name,
      description,
      budget_type = 'daily',
      daily_budget,
      lifetime_budget,
      start_date,
      end_date,
      objective = 'conversions',
      target_audience,
      platforms,
      adIds = [],
    } = body;

    if (!name) {
      return Response.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO campaigns (
        id, store_id, name, description, status, budget_type,
        daily_budget, lifetime_budget, start_date, end_date,
        objective, target_audience, platforms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      store.id,
      name,
      description || null,
      budget_type,
      daily_budget || null,
      lifetime_budget || null,
      start_date || null,
      end_date || null,
      objective,
      target_audience ? JSON.stringify(target_audience) : null,
      platforms ? JSON.stringify(platforms) : null
    ).run();

    // Add ads to campaign
    for (const adId of adIds) {
      await env.DB.prepare(`
        INSERT INTO campaign_ads (campaign_id, ad_id, added_at)
        VALUES (?, ?, datetime('now'))
      `).bind(id, adId).run();
    }

    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).bind(id).first<Campaign>();

    return Response.json({
      success: true,
      campaign: formatCampaign(campaign!),
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// PUT /api/campaigns - Update campaign
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const body = await request.json() as Partial<Campaign> & { id: string; adIds?: string[] };
    const { id, ...updates } = body;

    if (!id) {
      return Response.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Verify campaign belongs to store
    const existing = await env.DB.prepare(
      'SELECT id FROM campaigns WHERE id = ? AND store_id = ?'
    ).bind(id, store.id).first();

    if (!existing) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name', 'description', 'status', 'budget_type', 'daily_budget',
      'lifetime_budget', 'start_date', 'end_date', 'objective', 'target_audience', 'platforms'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        fields.push(`${field} = ?`);
        let value = (updates as any)[field];
        if (field === 'target_audience' || field === 'platforms') {
          value = value ? JSON.stringify(value) : null;
        }
        values.push(value);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = datetime(\'now\')');
      values.push(id);

      await env.DB.prepare(`
        UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    // Update ads if provided
    if (body.adIds) {
      // Remove existing ads
      await env.DB.prepare('DELETE FROM campaign_ads WHERE campaign_id = ?').bind(id).run();

      // Add new ads
      for (const adId of body.adIds) {
        await env.DB.prepare(`
          INSERT INTO campaign_ads (campaign_id, ad_id, added_at)
          VALUES (?, ?, datetime('now'))
        `).bind(id, adId).run();
      }
    }

    const campaign = await env.DB.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).bind(id).first<Campaign>();

    return Response.json({
      success: true,
      campaign: formatCampaign(campaign!),
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// DELETE /api/campaigns
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    if (!id) {
      return Response.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Verify campaign belongs to store
    const existing = await env.DB.prepare(
      'SELECT id FROM campaigns WHERE id = ? AND store_id = ?'
    ).bind(id, store.id).first();

    if (!existing) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Delete campaign ads junction
    await env.DB.prepare('DELETE FROM campaign_ads WHERE campaign_id = ?').bind(id).run();

    // Delete campaign performance
    await env.DB.prepare('DELETE FROM campaign_performance WHERE campaign_id = ?').bind(id).run();

    // Delete campaign
    await env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();

    return Response.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// Helper to format campaign for API response
function formatCampaign(campaign: Campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    budgetType: campaign.budget_type,
    dailyBudget: campaign.daily_budget,
    lifetimeBudget: campaign.lifetime_budget,
    totalSpent: campaign.total_spent,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    objective: campaign.objective,
    targetAudience: campaign.target_audience ? JSON.parse(campaign.target_audience) : null,
    platforms: campaign.platforms ? JSON.parse(campaign.platforms) : [],
    metrics: {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      revenue: campaign.revenue,
      roas: campaign.roas,
    },
    createdAt: campaign.created_at,
    updatedAt: campaign.updated_at,
    publishedAt: campaign.published_at,
  };
}
