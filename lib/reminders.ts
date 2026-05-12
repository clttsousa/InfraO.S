import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { publishRealtimeEvent } from "@/lib/realtime";
import { sendPushForNotifications } from "@/lib/push-notifications";
import type { InterventionStatusDb } from "@/types";

type ReminderType = "one_day_before" | "same_day" | "two_hours_before" | "thirty_minutes_before";

type DueReminderRow = {
  reminder_id: string;
  reminder_type: ReminderType;
  remind_at: string;
  event_id: string;
  title: string;
  location_name: string;
  start_at: string;
  end_at: string;
  status: InterventionStatusDb;
  responsible_user_id: string | null;
  points_count: string;
};

type NotificationRecipientRow = {
  id: string;
};

const DEFAULT_REMINDER_TYPES: ReminderType[] = ["one_day_before", "same_day"];

function reminderLabel(type: ReminderType) {
  switch (type) {
    case "one_day_before":
      return "amanhã";
    case "same_day":
      return "hoje";
    case "two_hours_before":
      return "em 2 horas";
    case "thirty_minutes_before":
      return "em 30 minutos";
    default:
      return "em breve";
  }
}

function notificationType(type: ReminderType) {
  return type === "same_day" ? "intervention_today" : "intervention_reminder";
}

function buildNotificationTitle(row: DueReminderRow) {
  if (row.reminder_type === "same_day") return `Intervenção hoje: ${row.title}`;
  if (row.reminder_type === "one_day_before") return `Intervenção amanhã: ${row.title}`;
  return `Intervenção ${reminderLabel(row.reminder_type)}: ${row.title}`;
}

function buildNotificationMessage(row: DueReminderRow) {
  const points = Number(row.points_count ?? 0);
  const pointsLabel = points === 1 ? "1 ponto cadastrado" : `${points} pontos cadastrados`;
  return `${row.location_name} · ${formatDateTime(row.start_at)} até ${formatDateTime(row.end_at)} · ${pointsLabel}`;
}

function buildNotificationKey(row: DueReminderRow) {
  const localDateKey = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(row.start_at));
  return `intervention:${row.event_id}:${row.reminder_type}:${localDateKey}`;
}

async function upsertReminder(client: PoolClient, eventId: string, reminderType: ReminderType, expression: string) {
  await client.query(
    `
      insert into reminders (event_id, reminder_type, remind_at, status, processed_at, error_message)
      select $1::uuid, $2, ${expression}, 'pending', null, null
      from infra_events
      where id = $1::uuid
      on conflict (event_id, reminder_type)
      do update set
        remind_at = excluded.remind_at,
        status = 'pending',
        processed_at = null,
        error_message = null,
        updated_at = now()
    `,
    [eventId, reminderType]
  );
}

export async function syncInterventionReminders(client: PoolClient, eventId: string) {
  const eventResult = await client.query<{ status: InterventionStatusDb }>(
    `select status from infra_events where id = $1::uuid and archived_at is null`,
    [eventId]
  );
  const event = eventResult.rows[0];
  if (!event) return;

  if (["CONCLUIDO", "CANCELADO"].includes(event.status)) {
    await client.query(
      `update reminders set status = 'canceled', updated_at = now() where event_id = $1::uuid and status = 'pending'`,
      [eventId]
    );
    return;
  }

  await upsertReminder(
    client,
    eventId,
    "one_day_before",
    `((((start_at at time zone '${APP_TIME_ZONE}')::date - interval '1 day') + time '08:00') at time zone '${APP_TIME_ZONE}')`
  );
  await upsertReminder(
    client,
    eventId,
    "same_day",
    `(((start_at at time zone '${APP_TIME_ZONE}')::date + time '08:00') at time zone '${APP_TIME_ZONE}')`
  );

  await client.query(
    `update reminders set status = 'canceled', updated_at = now() where event_id = $1::uuid and reminder_type <> all($2::text[]) and status = 'pending'`,
    [eventId, DEFAULT_REMINDER_TYPES]
  );
}

async function getRecipients(client: PoolClient, _responsibleUserId: string | null) {
  // V6.11: lembretes de intervenção são operacionais e globais.
  // Todos os usuários internos ativos recebem a notificação interna; o push PWA
  // é enviado depois para todos os dispositivos ativos de cada usuário.
  const result = await client.query<NotificationRecipientRow>(
    `select id::text from internal_users where is_active = true order by role asc, full_name asc`
  );
  return result.rows;
}

async function createNotificationsForReminder(client: PoolClient, row: DueReminderRow) {
  const recipients = await getRecipients(client, row.responsible_user_id);
  if (!recipients.length) return [] as Array<{ id: string; user_id: string }>;

  const title = buildNotificationTitle(row);
  const message = buildNotificationMessage(row);
  const type = notificationType(row.reminder_type);
  const key = buildNotificationKey(row);
  const inserted = await client.query<{ id: string; user_id: string }>(
    `
      insert into app_notifications (user_id, title, message, type, related_event_id, notification_key)
      select recipient.id::uuid, $2, $3, $4, $5::uuid, $6
      from jsonb_to_recordset($1::jsonb) as recipient(id text)
      on conflict (user_id, notification_key) do nothing
      returning id::text, user_id::text
    `,
    [JSON.stringify(recipients), title, message, type, row.event_id, key]
  );

  if (inserted.rows.length) {
    await client.query(
      `insert into notification_delivery_logs (notification_id, user_id, channel, status, sent_at)
       select item.id::uuid, item.user_id::uuid, 'internal', 'sent', now()
       from jsonb_to_recordset($1::jsonb) as item(id text, user_id text)`,
      [JSON.stringify(inserted.rows)]
    );
  }

  for (const notification of inserted.rows) {
    publishRealtimeEvent({
      type: "notification.created",
      scope: "notifications",
      entityId: notification.id,
      payload: {
        sourceType: "intervention.reminder",
        eventId: row.event_id,
        userId: notification.user_id,
        title,
        reminderType: row.reminder_type
      }
    });
  }

  return inserted.rows;
}

async function createLateInterventionNotifications(client: PoolClient) {
  const lateResult = await client.query<DueReminderRow>(
    `
      select
        concat('late-', ie.id::text) as reminder_id,
        'same_day'::text as reminder_type,
        now()::text as remind_at,
        ie.id::text as event_id,
        ie.title,
        ie.location_name,
        ie.start_at::text,
        ie.end_at::text,
        ie.status,
        ie.responsible_user_id::text,
        coalesce(point_counts.points_count, 0)::text as points_count
      from infra_events ie
      left join lateral (
        select count(*) as points_count from infra_event_points iep where iep.event_id = ie.id
      ) point_counts on true
      where ie.archived_at is null
        and ie.status not in ('CONCLUIDO', 'CANCELADO')
        and ie.end_at < now()
      order by ie.end_at asc
      limit 25
    `
  );

  const createdNotifications: Array<{ id: string; user_id: string }> = [];
  for (const row of lateResult.rows) {
    const recipients = await getRecipients(client, row.responsible_user_id);
    if (!recipients.length) continue;
    const key = `intervention:${row.event_id}:late`;
    const points = Number(row.points_count ?? 0);
    const pointsLabel = points === 1 ? "1 ponto cadastrado" : `${points} pontos cadastrados`;
    const inserted = await client.query<{ id: string; user_id: string }>(
      `
        insert into app_notifications (user_id, title, message, type, related_event_id, notification_key)
        select recipient.id::uuid, $2, $3, 'intervention_late', $4::uuid, $5
        from jsonb_to_recordset($1::jsonb) as recipient(id text)
        on conflict (user_id, notification_key) do nothing
        returning id::text, user_id::text
      `,
      [
        JSON.stringify(recipients),
        `Intervenção atrasada: ${row.title}`,
        `${row.location_name} · janela encerrada em ${formatDateTime(row.end_at)} · ${pointsLabel}`,
        row.event_id,
        key
      ]
    );

    if (inserted.rows.length) {
      await client.query(
        `insert into notification_delivery_logs (notification_id, user_id, channel, status, sent_at)
         select item.id::uuid, item.user_id::uuid, 'internal', 'sent', now()
         from jsonb_to_recordset($1::jsonb) as item(id text, user_id text)`,
        [JSON.stringify(inserted.rows)]
      );
    }

    createdNotifications.push(...inserted.rows);
    for (const notification of inserted.rows) {
      publishRealtimeEvent({
        type: "notification.created",
        scope: "notifications",
        entityId: notification.id,
        payload: { sourceType: "intervention.late", eventId: row.event_id, userId: notification.user_id }
      });
    }
  }
  return createdNotifications;
}

export async function processInterventionReminders() {
  const client = await db.connect();
  let processed = 0;
  let notificationsCreated = 0;
  let failed = 0;
  const createdNotificationIds: string[] = [];
  let committed = false;

  try {
    await client.query("begin");
    const dueResult = await client.query<DueReminderRow>(
      `
        select
          r.id::text as reminder_id,
          r.reminder_type,
          r.remind_at::text,
          ie.id::text as event_id,
          ie.title,
          ie.location_name,
          ie.start_at::text,
          ie.end_at::text,
          ie.status,
          ie.responsible_user_id::text,
          coalesce(point_counts.points_count, 0)::text as points_count
        from reminders r
        join infra_events ie on ie.id = r.event_id
        left join lateral (
          select count(*) as points_count from infra_event_points iep where iep.event_id = ie.id
        ) point_counts on true
        where r.status = 'pending'
          and r.remind_at <= now()
          and ie.archived_at is null
          and ie.status not in ('CONCLUIDO', 'CANCELADO')
        order by r.remind_at asc
        limit 50
        for update of r skip locked
      `
    );

    for (const row of dueResult.rows) {
      try {
        const created = await createNotificationsForReminder(client, row);
        await client.query(
          `update reminders set status = 'processed', processed_at = now(), error_message = null, updated_at = now() where id = $1::uuid`,
          [row.reminder_id]
        );
        processed += 1;
        notificationsCreated += created.length;
        createdNotificationIds.push(...created.map((notification) => notification.id));
      } catch (error) {
        failed += 1;
        await client.query(
          `update reminders set status = 'failed', processed_at = now(), error_message = left($2, 600), updated_at = now() where id = $1::uuid`,
          [row.reminder_id, error instanceof Error ? error.message : "Erro inesperado ao processar lembrete."]
        );
      }
    }

    const lateNotifications = await createLateInterventionNotifications(client);
    notificationsCreated += lateNotifications.length;
    createdNotificationIds.push(...lateNotifications.map((notification) => notification.id));
    await client.query("commit");
    committed = true;

    const pushDelivery = await sendPushForNotifications(createdNotificationIds).catch((error) => ({
      sent: 0,
      failed: createdNotificationIds.length,
      skipped: 0,
      error: error instanceof Error ? error.message : "Falha ao entregar push notifications."
    }));

    return {
      ok: true,
      processed,
      notificationsCreated,
      pushDelivery,
      failed,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    if (!committed) {
      await client.query("rollback");
    }
    throw error;
  } finally {
    client.release();
  }
}
