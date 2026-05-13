import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import type { NotificationEntityFilter, NotificationEntityType, NotificationFeedFilter, NotificationItem, NotificationSeverity, NotificationSeverityFilter, NotificationSummary } from "@/types";

type CountRow = { total: string };
type AlertIdRow = { notification_id: string };
type AppNotificationCountRow = { unread: string; read: string; smart: string; critical: string; important: string; attention: string };
type FeedRow = {
  id: string;
  title: string;
  description: string;
  href: string;
  level: NotificationItem["level"];
  severity: NotificationSeverity;
  event_type: string | null;
  entity_type: NotificationEntityType;
  entity_id: string | null;
  group_key: string | null;
  action_label: string | null;
  created_at: string;
  read: boolean;
  category: NotificationItem["category"];
};

type NotificationSummaryFilters = {
  filter?: NotificationFeedFilter;
  severity?: NotificationSeverityFilter;
  entity?: NotificationEntityFilter;
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

function normalizeSeverity(value?: string): NotificationSeverityFilter {
  if (["all", "info", "attention", "important", "critical"].includes(value ?? "")) return value as NotificationSeverityFilter;
  return "all";
}

function normalizeEntity(value?: string): NotificationEntityFilter {
  if (["all", "order", "intervention", "system"].includes(value ?? "")) return value as NotificationEntityFilter;
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

function mapFeedRow(row: FeedRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    href: row.href,
    level: row.level,
    severity: row.severity,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    groupKey: row.group_key,
    actionLabel: row.action_label,
    when: formatDateTime(row.created_at),
    whenIso: row.created_at,
    read: row.read,
    category: row.category
  };
}

function buildAppFeedSql(readMode: "unread" | "read" | "both") {
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
      coalesce(
        an.action_url,
        case
          when coalesce(an.entity_type, case when an.related_event_id is not null then 'intervention' else 'system' end) = 'order' and an.entity_id is not null then '/orders?selected=' || an.entity_id::text
          when coalesce(an.entity_type, case when an.related_event_id is not null then 'intervention' else 'system' end) = 'intervention' and coalesce(an.entity_id, an.related_event_id) is not null then '/intervencoes?selected=' || coalesce(an.entity_id, an.related_event_id)::text
          else '/notifications'
        end
      ) as href,
      case
        when coalesce(an.severity, 'info') in ('critical', 'important') then 'danger'
        when coalesce(an.severity, 'info') = 'attention' then 'warning'
        else 'info'
      end as level,
      coalesce(an.severity, 'info') as severity,
      an.type as event_type,
      coalesce(an.entity_type, case when an.related_event_id is not null then 'intervention' else 'system' end) as entity_type,
      coalesce(an.entity_id, an.related_event_id)::text as entity_id,
      an.group_key,
      an.action_label,
      coalesce(an.read_at, an.created_at) as created_at,
      (an.read_at is not null) as read,
      case
        when an.rule_id is not null then 'smart'
        when coalesce(an.entity_type, case when an.related_event_id is not null then 'intervention' else 'system' end) = 'intervention' then 'intervention'
        when coalesce(an.entity_type, 'system') = 'order' then 'smart'
        else 'activity'
      end as category
    from app_notifications an
    where $1::uuid is not null
      and an.user_id = $1::uuid
      and (an.muted_until is null or an.muted_until <= now())
      and (an.snoozed_until is null or an.snoozed_until <= now())
      ${readClause}
  `;
}

const orderFeedSql = `
  select
    concat('late-', so.id::text, '-', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' atrasada') as title,
    concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · prazo ', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as description,
    concat('/orders?selected=', so.id::text) as href,
    'danger' as level,
    'critical' as severity,
    'order_late' as event_type,
    'order' as entity_type,
    so.id::text as entity_id,
    'orders:late' as group_key,
    'Ver O.S.' as action_label,
    so.deadline_at as created_at,
    false as read,
    'late' as category
  from service_orders so
  where ${lateCondition("so")}

  union all

  select
    concat('today-', so.id::text, '-', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' vence hoje') as title,
    concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · acompanhe antes do encerramento do dia') as description,
    concat('/orders?selected=', so.id::text) as href,
    'warning' as level,
    'attention' as severity,
    'order_due_today' as event_type,
    'order' as entity_type,
    so.id::text as entity_id,
    'orders:due_today' as group_key,
    'Abrir O.S.' as action_label,
    so.deadline_at as created_at,
    false as read,
    'dueToday' as category
  from service_orders so
  where ${dueTodayCondition("so")}

  union all

  select
    concat('stale-', so.id::text, '-', to_char(so.updated_at at time zone '${APP_TIME_ZONE}', 'YYYYMMDDHH24MI')) as id,
    concat('O.S. ', so.order_number, ' sem atualização') as title,
    concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · última mudança em ', to_char(so.updated_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as description,
    concat('/orders?selected=', so.id::text) as href,
    'warning' as level,
    'attention' as severity,
    'order_stale' as event_type,
    'order' as entity_type,
    so.id::text as entity_id,
    'orders:stale' as group_key,
    'Ver O.S.' as action_label,
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
    'info' as severity,
    l.action_type as event_type,
    'system' as entity_type,
    l.id::text as entity_id,
    'system:activity' as group_key,
    'Ver dashboard' as action_label,
    l.created_at,
    false as read,
    'activity' as category
  from service_order_logs l
  left join internal_users iu on iu.id = l.internal_user_id
  where l.created_at >= now() - interval '30 days'
`;

function buildBaseFeedSql(filter: NotificationFeedFilter) {
  const appUnreadSql = buildAppFeedSql("unread");
  const appReadSql = buildAppFeedSql("read");

  const feedSqlByFilter: Record<NotificationFeedFilter, string> = {
    all: `${appUnreadSql} union all ${orderFeedSql} union all ${activityFeedSql}`,
    interventions: `${appUnreadSql}`,
    orders: `${appUnreadSql} union all ${orderFeedSql}`,
    system: `${appUnreadSql} union all ${activityFeedSql}`,
    read: appReadSql
  };

  return feedSqlByFilter[filter];
}

function buildOuterWhere({ filter, severity, entity }: { filter: NotificationFeedFilter; severity: NotificationSeverityFilter; entity: NotificationEntityFilter }) {
  const clauses: string[] = [];
  if (severity !== "all") clauses.push(`feed.severity = '${severity}'`);
  if (entity !== "all") clauses.push(`feed.entity_type = '${entity}'`);
  if (filter === "interventions") clauses.push(`feed.entity_type = 'intervention'`);
  if (filter === "orders") clauses.push(`feed.entity_type = 'order'`);
  if (filter === "system") clauses.push(`feed.entity_type = 'system'`);
  return clauses.length ? `where ${clauses.join(" and ")}` : "";
}

async function getFeedItems({ filter, severity, entity, page, pageSize, sessionId }: { filter: NotificationFeedFilter; severity: NotificationSeverityFilter; entity: NotificationEntityFilter; page: number; pageSize: number; sessionId: string | null }) {
  const offset = (page - 1) * pageSize;
  const baseFeedSql = buildBaseFeedSql(filter);
  const outerWhere = buildOuterWhere({ filter, severity, entity });
  const result = await query<FeedRow>(
    `
      select *
      from (
        ${baseFeedSql}
      ) feed
      ${outerWhere}
      order by created_at desc nulls last
      limit $2 offset $3
    `,
    [sessionId, pageSize, offset]
  );

  return result.rows.map(mapFeedRow);
}

async function getFeedTotal({ filter, severity, entity, sessionId }: { filter: NotificationFeedFilter; severity: NotificationSeverityFilter; entity: NotificationEntityFilter; sessionId: string | null }) {
  const result = await query<CountRow>(
    `select count(*)::text as total from (${buildBaseFeedSql(filter)}) feed ${buildOuterWhere({ filter, severity, entity })}`,
    [sessionId]
  );
  return Number(result.rows[0]?.total ?? 0);
}

async function getGroupedAlerts(sessionId: string | null): Promise<NotificationSummary["groupedAlerts"]> {
  const appGroups = sessionId
    ? (await query<{ group_key: string; total: string; severity: NotificationSeverity; entity_type: NotificationEntityType }>(`
        select coalesce(group_key, type) as group_key, count(*)::text as total, max(severity)::text as severity, max(coalesce(entity_type, 'system'))::text as entity_type
        from app_notifications
        where user_id = $1::uuid and read_at is null
        group by coalesce(group_key, type)
        order by count(*) desc
        limit 6
      `, [sessionId])).rows
    : [];

  return appGroups.map((row) => ({
    key: row.group_key,
    title: row.group_key.replace(/[:_]/g, " "),
    description: `${row.total} alerta(s) inteligente(s) agrupado(s).`,
    count: Number(row.total),
    href: `/notifications?entity=${row.entity_type}`,
    severity: row.severity,
    entityType: row.entity_type
  }));
}

export async function getNotificationSummary(filters: NotificationSummaryFilters = {}): Promise<NotificationSummary> {
  const session = await getSessionUser();
  const sessionId = session?.id ?? null;
  const filter = normalizeFilter(filters.filter);
  const severityFilter = normalizeSeverity(filters.severity);
  const entityFilter = normalizeEntity(filters.entity);
  const pageSize = sanitizePageSize(filters.pageSize);
  const requestedPage = getPositivePage(filters.page);

  const [lateCountResult, dueTodayCountResult, staleCountResult, activityCountResult, appCountResult, lateIdsResult, dueTodayIdsResult, staleIdsResult, interventionIdsResult, itemsTotal, groupedAlerts] = await Promise.all([
    query<CountRow>(`select count(*)::text as total from service_orders so where ${lateCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_orders so where ${dueTodayCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_orders so where ${staleCondition("so")}`),
    query<CountRow>(`select count(*)::text as total from service_order_logs where created_at >= now() - interval '30 days'`),
    sessionId
      ? query<AppNotificationCountRow>(`
          select
            count(*) filter (where read_at is null)::text as unread,
            count(*) filter (where read_at is not null)::text as read,
            count(*) filter (where read_at is null and rule_id is not null)::text as smart,
            count(*) filter (where read_at is null and severity = 'critical')::text as critical,
            count(*) filter (where read_at is null and severity = 'important')::text as important,
            count(*) filter (where read_at is null and severity = 'attention')::text as attention
          from app_notifications
          where user_id = $1::uuid
        `, [sessionId])
      : Promise.resolve({ rows: [{ unread: "0", read: "0", smart: "0", critical: "0", important: "0", attention: "0" }] } as { rows: AppNotificationCountRow[] }),
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
      : Promise.resolve({ rows: [] } as { rows: AlertIdRow[] }),
    getFeedTotal({ filter, severity: severityFilter, entity: entityFilter, sessionId }),
    getGroupedAlerts(sessionId)
  ]);

  const lateCount = Number(lateCountResult.rows[0]?.total ?? 0);
  const dueTodayCount = Number(dueTodayCountResult.rows[0]?.total ?? 0);
  const staleCount = Number(staleCountResult.rows[0]?.total ?? 0);
  const activityCount = Number(activityCountResult.rows[0]?.total ?? 0);
  const interventionCount = Number(appCountResult.rows[0]?.unread ?? 0);
  const readCount = Number(appCountResult.rows[0]?.read ?? 0);
  const smartCount = Number(appCountResult.rows[0]?.smart ?? 0);
  const appCritical = Number(appCountResult.rows[0]?.critical ?? 0);
  const appImportant = Number(appCountResult.rows[0]?.important ?? 0);
  const appAttention = Number(appCountResult.rows[0]?.attention ?? 0);

  const totalPages = Math.max(1, Math.ceil(itemsTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const items = await getFeedItems({ filter, severity: severityFilter, entity: entityFilter, page, pageSize, sessionId });

  return {
    total: lateCount + dueTodayCount + staleCount + interventionCount,
    counts: {
      late: lateCount,
      dueToday: dueTodayCount,
      stale: staleCount,
      recentActivities: activityCount,
      interventions: interventionCount,
      read: readCount,
      critical: lateCount + appCritical,
      important: appImportant,
      attention: dueTodayCount + staleCount + appAttention,
      smart: smartCount
    },
    items,
    groupedAlerts,
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
    filter,
    severityFilter,
    entityFilter
  };
}
