import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import type { NotificationFeedFilter, NotificationItem, NotificationSummary } from "@/types";

type CountRow = { total: string };
type AlertIdRow = { notification_id: string };
type AppNotificationCountRow = { unread: string; read: string };
type FeedRow = {
  id: string;
  title: string;
  description: string;
  href: string;
  level: NotificationItem["level"];
  created_at: string;
  read: boolean;
  category: NotificationItem["category"];
};

type NotificationSummaryFilters = {
  filter?: NotificationFeedFilter;
  page?: number;
  pageSize?: number;
};

const NOTIFICATION_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_NOTIFICATION_PAGE_SIZE = 20;

const dueTodayCondition = (alias = "so") => `
  ${alias}.deadline_at is not null
  and ${alias}.status not in ('FINALIZADA', 'CANCELADA')
  and ${alias}.deadline_at >= now()
  and (${alias}.deadline_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date
`;

const lateCondition = (alias = "so") => `
  ${alias}.deadline_at is not null
  and ${alias}.status not in ('FINALIZADA', 'CANCELADA')
  and ${alias}.deadline_at < now()
`;

const staleCondition = (alias = "so") => `
  ${alias}.updated_at < now() - interval '24 hours'
  and ${alias}.status not in ('FINALIZADA', 'CANCELADA')
`;

function normalizeFilter(value?: string): NotificationFeedFilter {
  if (["all", "interventions", "orders", "system", "read"].includes(value ?? "")) return value as NotificationFeedFilter;
  return "all";
}

function getPositivePage(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function sanitizePageSize(value: number | string | undefined) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_NOTIFICATION_PAGE_SIZE;
  return NOTIFICATION_PAGE_SIZE_OPTIONS.includes(normalized as (typeof NOTIFICATION_PAGE_SIZE_OPTIONS)[number]) ? normalized : DEFAULT_NOTIFICATION_PAGE_SIZE;
}

function formatNotificationDateKey(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(date).replace(/[- :]/g, "");
}

function mapFeedRow(row: FeedRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    href: row.href,
    level: row.level,
    when: formatDateTime(row.created_at),
    read: row.read,
    category: row.category
  };
}

function buildAppFeedSql(sessionId: string | null, readMode: "unread" | "read" | "both") {
  if (!sessionId) {
    return `
      select * from (
        select null::text as id, null::text as title, null::text as description, null::text as href, null::text as level, null::timestamptz as created_at, false as read, null::text as category
      ) empty_app_notifications
      where false
    `;
  }

  const readClause = readMode === "read"
    ? "and an.read_at is not null"
    : readMode === "unread"
      ? "and an.read_at is null"
      : "";

  return `
    select
      an.id::text as id,
      an.title,
      an.message as description,
      case when an.related_event_id is not null then '/intervencoes?selected=' || an.related_event_id::text else '/intervencoes' end as href,
      case
        when an.type = 'intervention_late' then 'danger'
        when an.type = 'intervention_today' then 'warning'
        else 'info'
      end as level,
      coalesce(an.read_at, an.created_at) as created_at,
      (an.read_at is not null) as read,
      'intervention' as category
    from app_notifications an
    where an.user_id = $1::uuid
      ${readClause}
  `;
}

const orderFeedSql = `
  select
    concat('late-', so.id::text, '-', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' atrasada') as title,
    concat(coalesce(so.client_name, 'Sem cliente'), ' · prazo ', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as description,
    concat('/orders?selected=', so.id::text) as href,
    'danger' as level,
    so.deadline_at as created_at,
    false as read,
    'late' as category
  from service_orders so
  where ${lateCondition("so")}

  union all

  select
    concat('today-', so.id::text, '-', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' vence hoje') as title,
    concat(coalesce(so.client_name, 'Sem cliente'), ' · acompanhe antes do encerramento do dia') as description,
    concat('/orders?selected=', so.id::text) as href,
    'warning' as level,
    so.deadline_at as created_at,
    false as read,
    'dueToday' as category
  from service_orders so
  where ${dueTodayCondition("so")}

  union all

  select
    concat('stale-', so.id::text, '-', to_char(so.updated_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' sem atualização') as title,
    concat(coalesce(so.client_name, 'Sem cliente'), ' · última mudança em ', to_char(so.updated_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as description,
    concat('/orders?selected=', so.id::text) as href,
    'info' as level,
    so.updated_at as created_at,
    false as read,
    'stale' as category
  from service_orders so
  where ${staleCondition("so")}
`;

const activityFeedSql = `
  select
    concat('activity-', l.id::text) as id,
    concat(coalesce(iu.full_name, 'Sistema'), ' movimentou uma O.S.') as title,
    l.action_type as description,
    '/dashboard' as href,
    'success' as level,
    l.created_at,
    false as read,
    'activity' as category
  from service_order_logs l
  left join internal_users iu on iu.id = l.internal_user_id
  where l.created_at >= now() - interval '30 days'
`;

async function getFeedItems({ filter, page, pageSize, sessionId }: { filter: NotificationFeedFilter; page: number; pageSize: number; sessionId: string | null }) {
  const offset = (page - 1) * pageSize;
  const appUnreadSql = buildAppFeedSql(sessionId, "unread");
  const appReadSql = buildAppFeedSql(sessionId, "read");

  const feedSqlByFilter: Record<NotificationFeedFilter, string> = {
    all: `${appUnreadSql} union all ${orderFeedSql} union all ${activityFeedSql}`,
    interventions: appUnreadSql,
    orders: orderFeedSql,
    system: activityFeedSql,
    read: appReadSql
  };

  const feedSql = feedSqlByFilter[filter];
  const needsSessionParam = sessionId !== null && feedSql.includes("$1::uuid");
  const params = needsSessionParam ? [sessionId, pageSize, offset] : [pageSize, offset];
  const limitIndex = needsSessionParam ? 2 : 1;
  const offsetIndex = needsSessionParam ? 3 : 2;
  const result = await query<FeedRow>(
    `
      select *
      from (
        ${feedSql}
      ) feed
      order by created_at desc nulls last
      limit $${limitIndex} offset $${offsetIndex}
    `,
    params
  );

  return result.rows.map(mapFeedRow);
}

export async function getNotificationSummary(filters: NotificationSummaryFilters = {}): Promise<NotificationSummary> {
  const session = await getSessionUser();
  const sessionId = session?.id ?? null;
  const filter = normalizeFilter(filters.filter);
  const pageSize = sanitizePageSize(filters.pageSize);
  const requestedPage = getPositivePage(filters.page);

  const [lateCountResult, dueTodayCountResult, staleCountResult, activityCountResult, appCountResult, lateIdsResult, dueTodayIdsResult, staleIdsResult, interventionIdsResult] = await Promise.all([
    query<CountRow>(`select count(*)::text as total from service_orders so where ${lateCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_orders so where ${dueTodayCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_orders so where ${staleCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_order_logs where created_at >= now() - interval '30 days'`),
    sessionId
      ? query<AppNotificationCountRow>(`
          select
            count(*) filter (where read_at is null)::text as unread,
            count(*) filter (where read_at is not null)::text as read
          from app_notifications
          where user_id = $1::uuid
        `, [sessionId])
      : Promise.resolve({ rows: [{ unread: "0", read: "0" }] } as { rows: AppNotificationCountRow[] }),
    query<AlertIdRow>(`
      select concat('late-', id::text, '-', to_char(deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders so
      where ${lateCondition("so")}
      order by deadline_at asc
      limit 250
    `),
    query<AlertIdRow>(`
      select concat('today-', id::text, '-', to_char(deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders so
      where ${dueTodayCondition("so")}
      order by deadline_at asc
      limit 250
    `),
    query<AlertIdRow>(`
      select concat('stale-', id::text, '-', to_char(updated_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as notification_id
      from service_orders so
      where ${staleCondition("so")}
      order by updated_at asc
      limit 250
    `),
    sessionId
      ? query<AlertIdRow>(`
          select id::text as notification_id
          from app_notifications
          where user_id = $1::uuid and read_at is null
          order by created_at desc
          limit 250
        `, [sessionId])
      : Promise.resolve({ rows: [] } as { rows: AlertIdRow[] })
  ]);

  const lateCount = Number(lateCountResult.rows[0]?.total ?? 0);
  const dueTodayCount = Number(dueTodayCountResult.rows[0]?.total ?? 0);
  const staleCount = Number(staleCountResult.rows[0]?.total ?? 0);
  const activityCount = Number(activityCountResult.rows[0]?.total ?? 0);
  const interventionCount = Number(appCountResult.rows[0]?.unread ?? 0);
  const readCount = Number(appCountResult.rows[0]?.read ?? 0);
  const orderTotal = lateCount + dueTodayCount + staleCount;

  const itemsTotalByFilter: Record<NotificationFeedFilter, number> = {
    all: interventionCount + orderTotal + activityCount,
    interventions: interventionCount,
    orders: orderTotal,
    system: activityCount,
    read: readCount
  };
  const itemsTotal = itemsTotalByFilter[filter];
  const totalPages = Math.max(1, Math.ceil(itemsTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const items = await getFeedItems({ filter, page, pageSize, sessionId });

  return {
    total: lateCount + dueTodayCount + staleCount + interventionCount,
    counts: {
      late: lateCount,
      dueToday: dueTodayCount,
      stale: staleCount,
      recentActivities: activityCount,
      interventions: interventionCount,
      read: readCount
    },
    items,
    activeAlertIds: {
      late: lateIdsResult.rows.map((row) => row.notification_id),
      dueToday: dueTodayIdsResult.rows.map((row) => row.notification_id),
      stale: staleIdsResult.rows.map((row) => row.notification_id),
      intervention: interventionIdsResult.rows.map((row) => row.notification_id)
    },
    checkedAt: formatDateTime(new Date().toISOString()),
    page,
    pageSize,
    totalPages,
    itemsTotal,
    filter
  };
}
