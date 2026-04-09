import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
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
  service_order_id: string | null;
  order_number: string | null;
};

type AlertIdRow = { notification_id: string };

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

async function getNotificationSummaryUncached(): Promise<NotificationSummary> {
  const [lateCountResult, dueTodayCountResult, staleCountResult, lateRows, dueTodayRows, staleRows, activityRows, lateIdsResult, dueTodayIdsResult, staleIdsResult] = await Promise.all([
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
      select l.id, iu.full_name as actor_name, l.action_type, l.created_at, l.service_order_id::text as service_order_id, so.order_number
      from service_order_logs l
      left join internal_users iu on iu.id = l.internal_user_id
      left join service_orders so on so.id = l.service_order_id
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
    `)
  ]);

  const lateCount = Number(lateCountResult.rows[0]?.total ?? 0);
  const dueTodayCount = Number(dueTodayCountResult.rows[0]?.total ?? 0);
  const staleCount = Number(staleCountResult.rows[0]?.total ?? 0);

  const items: NotificationItem[] = [
    ...lateRows.rows.map((row) => ({
      id: `late-${row.id}-${row.deadline_at ? formatNotificationDateKey(row.deadline_at) : 'sem-prazo'}`,
      title: `O.S. ${row.order_number} atrasada`,
      description: `${row.client_name ?? 'Sem cliente'} · prazo ${row.deadline_at ? formatDateTime(row.deadline_at) : 'não informado'}`,
      href: `/orders?selected=${row.id}` ,
      actionLabel: "Abrir O.S.",
      level: 'danger' as const,
      when: row.deadline_at ? formatDateTime(row.deadline_at) : undefined,
      category: 'late' as const
    })),
    ...dueTodayRows.rows.map((row) => ({
      id: `today-${row.id}-${row.deadline_at ? formatNotificationDateKey(row.deadline_at) : 'sem-prazo'}`,
      title: `O.S. ${row.order_number} vence hoje`,
      description: `${row.client_name ?? 'Sem cliente'} · acompanhe antes do encerramento do dia`,
      href: `/orders?selected=${row.id}` ,
      actionLabel: "Abrir O.S.",
      level: 'warning' as const,
      when: row.deadline_at ? formatDateTime(row.deadline_at) : undefined,
      category: 'dueToday' as const
    })),
    ...staleRows.rows.map((row) => ({
      id: `stale-${row.id}-${formatNotificationDateKey(row.updated_at)}`,
      title: `O.S. ${row.order_number} sem atualização`,
      description: `${row.client_name ?? 'Sem cliente'} · última mudança em ${formatDateTime(row.updated_at)}`,
      href: `/orders?selected=${row.id}` ,
      actionLabel: "Abrir O.S.",
      level: 'info' as const,
      when: formatDateTime(row.updated_at),
      category: 'stale' as const
    })),
    ...activityRows.rows.map((row) => ({
      id: `activity-${row.id}`,
      title: `${row.actor_name ?? 'Sistema'} movimentou ${row.order_number ? `a O.S. ${row.order_number}` : 'uma O.S.'}` ,
      description: row.action_type,
      href: row.service_order_id ? `/orders?selected=${row.service_order_id}` : '/dashboard',
      actionLabel: row.service_order_id ? 'Abrir ordem relacionada' : 'Abrir dashboard',
      level: 'success' as const,
      when: formatDateTime(row.created_at),
      category: 'activity' as const
    }))
  ].slice(0, 10);

  return {
    total: lateCount + dueTodayCount + staleCount,
    counts: {
      late: lateCount,
      dueToday: dueTodayCount,
      stale: staleCount,
      recentActivities: activityRows.rows.length
    },
    items,
    activeAlertIds: {
      late: lateIdsResult.rows.map((row) => row.notification_id),
      dueToday: dueTodayIdsResult.rows.map((row) => row.notification_id),
      stale: staleIdsResult.rows.map((row) => row.notification_id)
    },
    checkedAt: formatDateTime(new Date().toISOString())
  };
}

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

const getNotificationSummaryCached = unstable_cache(getNotificationSummaryUncached, ['notification-summary-v5.1.1'], {
  revalidate: 30,
  tags: ['dashboard']
});

export async function getNotificationSummary(): Promise<NotificationSummary> {
  return getNotificationSummaryCached();
}
