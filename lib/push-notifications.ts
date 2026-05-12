import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { sendWebPush, type PushSubscriptionRecord, type WebPushPayload } from "@/lib/web-push";

export type PushSubscriptionPayload = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type PushSubscriptionRow = PushSubscriptionRecord & {
  id: string;
  user_id: string;
};

type NotificationPushRow = {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  related_event_id: string | null;
};

export function isValidPushSubscriptionPayload(payload: PushSubscriptionPayload): payload is Required<PushSubscriptionPayload> & { keys: { p256dh: string; auth: string } } {
  return Boolean(
    payload &&
      typeof payload.endpoint === "string" &&
      payload.endpoint.startsWith("https://") &&
      payload.keys &&
      typeof payload.keys.p256dh === "string" &&
      payload.keys.p256dh.length > 20 &&
      typeof payload.keys.auth === "string" &&
      payload.keys.auth.length > 8
  );
}

export async function getPushSubscriptionStatus(userId: string) {
  const result = await query<{ total: string; active: string; last_used_at: string | null }>(
    `
      select
        count(*)::text as total,
        count(*) filter (where enabled = true)::text as active,
        max(last_used_at)::text as last_used_at
      from push_subscriptions
      where user_id = $1::uuid
    `,
    [userId]
  );

  const row = result.rows[0];
  return {
    configured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()),
    total: Number(row?.total ?? 0),
    active: Number(row?.active ?? 0),
    lastUsedAt: row?.last_used_at ?? null
  };
}

export async function savePushSubscription(userId: string, payload: PushSubscriptionPayload, userAgent: string | null) {
  if (!isValidPushSubscriptionPayload(payload)) {
    throw new Error("Inscrição push inválida ou incompleta.");
  }

  const result = await query<{ id: string }>(
    `
      insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, enabled)
      values ($1::uuid, $2, $3, $4, $5, true)
      on conflict (endpoint)
      do update set
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        enabled = true,
        updated_at = now()
      returning id::text
    `,
    [userId, payload.endpoint, payload.keys.p256dh, payload.keys.auth, userAgent]
  );

  return result.rows[0];
}

export async function disablePushSubscription(userId: string, endpoint?: string) {
  if (endpoint) {
    const result = await query(
      `update push_subscriptions set enabled = false, updated_at = now() where user_id = $1::uuid and endpoint = $2`,
      [userId, endpoint]
    );
    return result.rowCount ?? 0;
  }

  const result = await query(`update push_subscriptions set enabled = false, updated_at = now() where user_id = $1::uuid and enabled = true`, [userId]);
  return result.rowCount ?? 0;
}

function notificationToPushPayload(row: NotificationPushRow): WebPushPayload {
  return {
    title: row.title,
    body: row.message,
    url: row.related_event_id ? `/intervencoes?selected=${row.related_event_id}` : "/notifications",
    notificationId: row.id,
    eventId: row.related_event_id,
    tag: row.related_event_id ? `infraos-intervention-${row.related_event_id}` : `infraos-notification-${row.id}`
  };
}

async function insertDeliveryLog(params: {
  client?: PoolClient;
  notificationId: string;
  userId: string | null;
  status: "sent" | "failed" | "skipped";
  errorMessage?: string | null;
  sentAt?: boolean;
}) {
  const sql = `
    insert into notification_delivery_logs (notification_id, user_id, channel, status, error_message, sent_at)
    values ($1::uuid, $2::uuid, 'pwa', $3, $4, ${params.sentAt ? "now()" : "null"})
  `;
  const values = [params.notificationId, params.userId, params.status, params.errorMessage ?? null];
  if (params.client) {
    await params.client.query(sql, values);
    return;
  }
  await query(sql, values);
}

export async function sendPushForNotifications(notificationIds: string[]) {
  const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const notificationsResult = await query<NotificationPushRow>(
    `
      select id::text, user_id::text, title, message, related_event_id::text
      from app_notifications
      where id = any($1::uuid[])
      order by created_at asc
    `,
    [uniqueIds]
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of notificationsResult.rows) {
    if (!notification.user_id) {
      skipped += 1;
      await insertDeliveryLog({ notificationId: notification.id, userId: null, status: "skipped", errorMessage: "Notificação sem usuário vinculado." });
      continue;
    }

    const subscriptions = await query<PushSubscriptionRow>(
      `
        select id::text, user_id::text, endpoint, p256dh, auth
        from push_subscriptions
        where user_id = $1::uuid and enabled = true
        order by updated_at desc
      `,
      [notification.user_id]
    );

    if (!subscriptions.rows.length) {
      skipped += 1;
      await insertDeliveryLog({ notificationId: notification.id, userId: notification.user_id, status: "skipped", errorMessage: "Usuário sem dispositivo PWA ativo." });
      continue;
    }

    const payload = notificationToPushPayload(notification);
    for (const subscription of subscriptions.rows) {
      const result = await sendWebPush(subscription, payload).catch((error) => ({
        ok: false as const,
        skipped: false as const,
        status: 0,
        message: error instanceof Error ? error.message : "Falha inesperada ao enviar push."
      }));

      if (result.ok) {
        sent += 1;
        await query(`update push_subscriptions set last_used_at = now(), updated_at = now() where id = $1::uuid`, [subscription.id]);
        await insertDeliveryLog({ notificationId: notification.id, userId: notification.user_id, status: "sent", sentAt: true });
        continue;
      }

      if (result.skipped) {
        skipped += 1;
        await insertDeliveryLog({ notificationId: notification.id, userId: notification.user_id, status: "skipped", errorMessage: result.message });
        continue;
      }

      failed += 1;
      if ([404, 410].includes(result.status)) {
        await query(`update push_subscriptions set enabled = false, updated_at = now() where id = $1::uuid`, [subscription.id]);
      }
      await insertDeliveryLog({ notificationId: notification.id, userId: notification.user_id, status: "failed", errorMessage: result.message.slice(0, 600) });
    }
  }

  return { sent, failed, skipped };
}

export async function sendTestPushToUser(userId: string) {
  const result = await query<{ id: string }>(
    `
      insert into app_notifications (user_id, title, message, type, notification_key)
      values ($1::uuid, 'InfraOS — teste de notificação', 'Se você recebeu este aviso, a notificação tipo app está ativa neste dispositivo.', 'intervention_reminder', $2)
      returning id::text
    `,
    [userId, `pwa-test:${userId}:${Date.now()}`]
  );
  const notificationId = result.rows[0]?.id;
  if (!notificationId) return { sent: 0, failed: 0, skipped: 1 };
  return sendPushForNotifications([notificationId]);
}
