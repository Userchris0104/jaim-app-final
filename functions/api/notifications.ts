/**
 * Notifications API - User notifications management
 * GET /api/notifications - List notifications
 * POST /api/notifications - Mark as read, dismiss, or create
 * DELETE /api/notifications - Delete notification
 */

import { getStoreFromCookieOrFallback } from '../lib/store-cookie';

interface Env {
  DB: D1Database;
}

// GET /api/notifications
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);

    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    // Build query
    let query = 'SELECT * FROM notifications WHERE store_id = ? AND dismissed = 0';
    const params: any[] = [store.id];

    if (unreadOnly) {
      query += ' AND read = 0';
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = await env.DB.prepare(query).bind(...params).all();

    // Get unread count
    const unreadCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE store_id = ? AND read = 0 AND dismissed = 0
    `).bind(store.id).first<{ count: number }>();

    return Response.json({
      success: true,
      notifications: notifications.results.map((n: any) => ({
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        actionUrl: n.action_url,
        actionLabel: n.action_label,
        read: n.read === 1,
        createdAt: n.created_at,
        readAt: n.read_at,
      })),
      unreadCount: unreadCount?.count || 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// POST /api/notifications
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    const body = await request.json() as {
      action: string;
      notificationId?: string;
      notificationIds?: string[];
      notification?: {
        type: string;
        category: string;
        title: string;
        message?: string;
        actionUrl?: string;
        actionLabel?: string;
      };
    };

    const { action, notificationId, notificationIds, notification } = body;

    switch (action) {
      case 'mark_read':
        if (notificationId) {
          await env.DB.prepare(`
            UPDATE notifications SET read = 1, read_at = datetime('now')
            WHERE id = ? AND store_id = ?
          `).bind(notificationId, store.id).run();
        }
        return Response.json({ success: true });

      case 'mark_all_read':
        await env.DB.prepare(`
          UPDATE notifications SET read = 1, read_at = datetime('now')
          WHERE store_id = ? AND read = 0
        `).bind(store.id).run();
        return Response.json({ success: true });

      case 'dismiss':
        if (notificationId) {
          await env.DB.prepare(`
            UPDATE notifications SET dismissed = 1
            WHERE id = ? AND store_id = ?
          `).bind(notificationId, store.id).run();
        }
        return Response.json({ success: true });

      case 'dismiss_multiple':
        if (notificationIds && notificationIds.length > 0) {
          const placeholders = notificationIds.map(() => '?').join(',');
          await env.DB.prepare(`
            UPDATE notifications SET dismissed = 1
            WHERE id IN (${placeholders}) AND store_id = ?
          `).bind(...notificationIds, store.id).run();
        }
        return Response.json({ success: true });

      case 'create':
        if (!notification) {
          return Response.json({ error: 'Notification data required' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        // Note: In production, we'd get user_id from auth session
        // For now using a placeholder
        await env.DB.prepare(`
          INSERT INTO notifications (
            id, user_id, store_id, type, category, title, message,
            action_url, action_label, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          id,
          'system', // Placeholder user_id
          store.id,
          notification.type,
          notification.category,
          notification.title,
          notification.message || null,
          notification.actionUrl || null,
          notification.actionLabel || null
        ).run();

        return Response.json({ success: true, notificationId: id });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in notification action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};

// DELETE /api/notifications
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const notificationId = url.searchParams.get('id');

  try {
    const { store } = await getStoreFromCookieOrFallback(env.DB, request);
    if (!store) {
      return Response.json({ error: 'No store connected' }, { status: 400 });
    }

    if (notificationId) {
      await env.DB.prepare(`
        DELETE FROM notifications WHERE id = ? AND store_id = ?
      `).bind(notificationId, store.id).run();
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
