import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import type { NotificationItem, NotificationSummary } from "@/types";

type CountRow = { total: string };
type OrderAlertRow = {
  id: string;
  order_number: string;
  client_name: string | null;
  deadline_at: string | null;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  actor_name: string | null;
  action_type: string;
  created_at: string;
};

type AlertIdRow = { notification_id: string };

type AppNotificationRow = {
  id: string;
  title: string;
  message: string;
  type: "intervention_reminder" | "intervention_today" | "intervention_late";
  related_event_id: string | null;
  created_at: string;
};

const dueTodayCondition = `
  deadline_at is not null
  and status not in ('FINALIZADA', 'CANCELADA')
  and deadline_at >= now()
  and (deadline_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date
`;

const lateCondition = `
  deadline_at is not null
  and status not in ('FINALIZADA', 'CANCELADA')
  and deadline_at < now()
`;

const staleCondition = `
  updated_at < now() - interval '24 hours'
  and status not in ('FINALIZADA', 'CANCELADA')
`;

function formatNotificationDateKey(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date).replace(/[- :]/g, '');
}

function mapAppNotificationLevel(type: AppNotificationRow["type"]): NotificationItem["level"] {
  if (type === "intervention_late") return "danger";
  if (type === "intervention_today") return "warning";
  return "info";
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const session = await getSessionUser();
  const [lateCountResult, dueTodayCountResult, staleCountResult, lateRows, dueTodayRows, staleRows, activityRows, lateIdsResult, dueTodayIdsResult, staleIdsResult, appNotificationsResult] = await Promise.all([
    query<CountRow>(`select count(*)::text as total from service_orders where ${lateCondition}`),
    query<CountRow>(`select count(*)::text as total from service_orders where ${dueTodayCondition}`),
    query<CountRow>(`select count(*)::text as total from service_orders where ${staleCondition}`),
    query<OrderAlertRow>(`
      select id, order_number, client_name, deadline_at, updated_at
      from service_orders
      where ${lateCondition}
      order by deadline_at asc
      limit 4
    `),
    query<OrderAlertRow>(`
      select id, order_number, client_name, deadline_at, updated_at
      from service_orders
      where ${dueTodayCondition}
      order by deadline_at asc
      limit 3
    `),
    query<OrderAlertRow>(`
      select id, order_number, client_name, deadline_at, updated_at
      from service_orders
      where ${staleCondition}
      order by updated_at asc
      limit 3
    `),
    query<ActivityRow>(`
      select l.id, iu.full_name as actor_name, l.action_type, l.created_at
      from service_order_logs l
      left join internal_users iu on iu.id = l.internal_user_id
      order by l.created_at desc
      limit 4
    `),
    query<AlertIdRow>(`
      select concat('late-', id::text, '-', to_char(deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders
      where ${lateCondition}
    `),
    query<AlertIdRow>(`
      select concat('today-', id::text, '-', to_char(deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders
      where ${dueTodayCondition}
    `),
    query<AlertIdRow>(`
      select concat('stale-', id::text, '-', to_char(updated_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders
      where ${staleCondition}
    `),
    session
      ? query<AppNotificationRow>(`
          select id::text, title, message, type, related_event_id::text, created_at::text
          from app_notifications
          where user_id = $1::uuid and read_at is null
          order by created_at desc
          limit 8
        `, [session.id])
      : Promise.resolve({ rows: [] } as { rows: AppNotificationRow[] })
  ]);

  const lateCount = Number(lateCountResult.rows[0]?.total ?? 0);
  const dueTodayCount = Number(dueTodayCountResult.rows[0]?.total ?? 0);
  const staleCount = Number(staleCountResult.rows[0]?.total ?? 0);
  const interventionCount = appNotificationsResult.rows.length;

  const interventionItems: NotificationItem[] = appNotificationsResult.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.message,
    href: row.related_event_id ? `/intervencoes?selected=${row.related_event_id}` : "/intervencoes",
    level: mapAppNotificationLevel(row.type),
    when: formatDateTime(row.created_at),
    category: "intervention" as const
  }));

  const orderItems: NotificationItem[] = [
    ...lateRows.rows.map((row) => ({
      id: `late-${row.id}-${row.deadline_at ? formatNotificationDateKey(row.deadline_at) : 'sem-prazo'}`,
      title: `O.S. ${row.order_number} atrasada`,
      description: `${row.client_name ?? 'Sem cliente'} · prazo ${row.deadline_at ? formatDateTime(row.deadline_at) : 'não informado'}`,
      href: `/orders?selected=${row.id}`,
      level: 'danger' as const,
      when: row.deadline_at ? formatDateTime(row.deadline_at) : undefined,
      category: 'late' as const
    })),
    ...dueTodayRows.rows.map((row) => ({
      id: `today-${row.id}-${row.deadline_at ? formatNotificationDateKey(row.deadline_at) : 'sem-prazo'}`,
      title: `O.S. ${row.order_number} vence hoje`,
      description: `${row.client_name ?? 'Sem cliente'} · acompanhe antes do encerramento do dia`,
      href: `/orders?selected=${row.id}`,
      level: 'warning' as const,
      when: row.deadline_at ? formatDateTime(row.deadline_at) : undefined,
      category: 'dueToday' as const
    })),
    ...staleRows.rows.map((row) => ({
      id: `stale-${row.id}-${formatNotificationDateKey(row.updated_at)}`,
      title: `O.S. ${row.order_number} sem atualização`,
      description: `${row.client_name ?? 'Sem cliente'} · última mudança em ${formatDateTime(row.updated_at)}`,
      href: `/orders?selected=${row.id}`,
      level: 'info' as const,
      when: formatDateTime(row.updated_at),
      category: 'stale' as const
    })),
    ...activityRows.rows.map((row) => ({
      id: `activity-${row.id}`,
      title: `${row.actor_name ?? 'Sistema'} movimentou uma O.S.`,
      description: row.action_type,
      href: '/dashboard',
      level: 'success' as const,
      when: formatDateTime(row.created_at),
      category: 'activity' as const
    }))
  ];

  return {
    total: lateCount + dueTodayCount + staleCount + interventionCount,
    counts: {
      late: lateCount,
      dueToday: dueTodayCount,
      stale: staleCount,
      recentActivities: activityRows.rows.length,
      interventions: interventionCount
    },
    items: [...interventionItems, ...orderItems].slice(0, 14),
    activeAlertIds: {
      late: lateIdsResult.rows.map((row) => row.notification_id),
      dueToday: dueTodayIdsResult.rows.map((row) => row.notification_id),
      stale: staleIdsResult.rows.map((row) => row.notification_id),
      intervention: appNotificationsResult.rows.map((row) => row.id)
    },
    checkedAt: formatDateTime(new Date().toISOString())
  };
}
