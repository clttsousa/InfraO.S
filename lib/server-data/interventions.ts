import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import { query } from "@/lib/db";
import { formatDate, formatDateTime, APP_TIME_ZONE } from "@/lib/format";
import { formatInterventionStatus, formatInterventionType } from "@/lib/interventions";
import { REMINDER_STATUS_LABELS, REMINDER_TYPE_LABELS, normalizeReminderConfig } from "@/lib/intervention-reminder-config";
import { isUuid } from "@/lib/validation";
import type {
  InterventionDetail,
  InterventionFilters,
  InterventionItem,
  InterventionListResult,
  InterventionPointItem,
  InterventionQuickFilter,
  InterventionReminderItem,
  ReminderStatusDb,
  ReminderTypeDb,
  InterventionSourceDb,
  InterventionStatusDb,
  InterventionSummary,
  InterventionTypeDb
} from "@/types";

type InterventionRow = {
  id: string;
  title: string;
  type: InterventionTypeDb;
  location_name: string;
  start_at: string;
  end_at: string;
  status: InterventionStatusDb;
  source: InterventionSourceDb;
  original_message: string | null;
  notes: string | null;
  responsible_user_id: string | null;
  responsible_name: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  reminder_config: unknown;
  points_count: string | number;
  reminders_count: string | number;
  next_reminder_at: string | null;
  is_late: boolean;
};

type InterventionPointRow = {
  id: string;
  label: string;
  maps_url: string;
  created_at: string;
  updated_at: string;
};

type InterventionReminderRow = {
  id: string;
  reminder_type: ReminderTypeDb;
  remind_at: string;
  status: ReminderStatusDb;
  processed_at: string | null;
  error_message: string | null;
};

const typeValues = new Set<string>(INTERVENTION_TYPE_OPTIONS.map((item) => item.value));
const statusValues = new Set<string>(INTERVENTION_STATUS_OPTIONS.map((item) => item.value));
const sourceValues = new Set<string>(INTERVENTION_SOURCE_OPTIONS.map((item) => item.value));

const INTERVENTION_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_INTERVENTION_PAGE_SIZE = 20;

function getPositiveInt(value: string | number | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function sanitizeInterventionPageSize(value: string | number | undefined) {
  const parsed = getPositiveInt(value, DEFAULT_INTERVENTION_PAGE_SIZE);
  return INTERVENTION_PAGE_SIZE_OPTIONS.includes(parsed as (typeof INTERVENTION_PAGE_SIZE_OPTIONS)[number]) ? parsed : DEFAULT_INTERVENTION_PAGE_SIZE;
}

function normalizeQuickFilter(value?: string): InterventionQuickFilter {
  if (["today", "tomorrow", "week", "late", "concluded", "canceled"].includes(value ?? "")) {
    return value as InterventionQuickFilter;
  }
  return "all";
}

function getOptionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

function toTimeLabel(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${formatter.format(start)} às ${formatter.format(end)}`;
}

function toDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function toTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function buildInterventionFilters(filters: InterventionFilters) {
  const clauses = ["ie.archived_at is null"];
  const params: unknown[] = [];

  const addParam = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const quick = normalizeQuickFilter(filters.quick);

  if (filters.q) {
    const param = addParam(`%${filters.q.trim()}%`);
    clauses.push(`(ie.title ilike ${param} or ie.location_name ilike ${param} or ie.type::text ilike ${param} or ie.source::text ilike ${param} or ie.status::text ilike ${param} or coalesce(ie.original_message, '') ilike ${param} or coalesce(ie.notes, '') ilike ${param})`);
  }

  if (filters.type && typeValues.has(filters.type)) {
    clauses.push(`ie.type = ${addParam(filters.type)}`);
  }

  if (filters.location) {
    clauses.push(`ie.location_name ilike ${addParam(`%${filters.location.trim()}%`)}`);
  }

  if (filters.status && statusValues.has(filters.status)) {
    clauses.push(`ie.status = ${addParam(filters.status)}`);
  }

  if (filters.source && sourceValues.has(filters.source)) {
    clauses.push(`ie.source = ${addParam(filters.source)}`);
  }

  if (filters.responsibleId && isUuid(filters.responsibleId)) {
    clauses.push(`ie.responsible_user_id = ${addParam(filters.responsibleId)}::uuid`);
  }

  if (filters.from) {
    clauses.push(`ie.start_at >= (${addParam(filters.from)}::date at time zone '${APP_TIME_ZONE}')`);
  }

  if (filters.to) {
    clauses.push(`ie.start_at < ((${addParam(filters.to)}::date + interval '1 day') at time zone '${APP_TIME_ZONE}')`);
  }

  if (quick === "today") {
    clauses.push(`(ie.start_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date`);
  }

  if (quick === "tomorrow") {
    clauses.push(`(ie.start_at at time zone '${APP_TIME_ZONE}')::date = ((now() at time zone '${APP_TIME_ZONE}')::date + interval '1 day')::date`);
  }

  if (quick === "week") {
    clauses.push(`ie.start_at >= ((now() at time zone '${APP_TIME_ZONE}')::date at time zone '${APP_TIME_ZONE}')`);
    clauses.push(`ie.start_at < (((now() at time zone '${APP_TIME_ZONE}')::date + interval '7 day') at time zone '${APP_TIME_ZONE}')`);
  }

  if (quick === "late") {
    clauses.push(`ie.status not in ('CONCLUIDO', 'CANCELADO') and (ie.status = 'ATRASADO' or ie.end_at < now())`);
  }

  if (quick === "concluded") {
    clauses.push(`ie.status = 'CONCLUIDO'`);
  }

  if (quick === "canceled") {
    clauses.push(`ie.status = 'CANCELADO'`);
  }

  return {
    clause: clauses.length ? `where ${clauses.join(" and ")}` : "",
    params
  };
}

const baseInterventionSelect = `
  select
    ie.id::text,
    ie.title,
    ie.type,
    ie.location_name,
    ie.start_at,
    ie.end_at,
    ie.status,
    ie.source,
    ie.original_message,
    ie.notes,
    ie.responsible_user_id::text,
    responsible.full_name as responsible_name,
    creator.full_name as created_by_name,
    ie.created_at,
    ie.updated_at,
    ie.reminder_config,
    coalesce(point_counts.points_count, 0)::text as points_count,
    coalesce(reminder_counts.reminders_count, 0)::text as reminders_count,
    reminder_counts.next_reminder_at::text as next_reminder_at,
    (ie.status = 'ATRASADO' or (ie.status not in ('CONCLUIDO', 'CANCELADO') and ie.end_at < now())) as is_late
  from infra_events ie
  left join internal_users creator on creator.id = ie.created_by
  left join internal_users responsible on responsible.id = ie.responsible_user_id
  left join lateral (
    select count(*) as points_count
    from infra_event_points iep
    where iep.event_id = ie.id
  ) point_counts on true
  left join lateral (
    select
      count(*) filter (where r.status = 'pending') as reminders_count,
      min(r.remind_at) filter (where r.status = 'pending') as next_reminder_at
    from reminders r
    where r.event_id = ie.id
  ) reminder_counts on true
`;

export function parseInterventionFilters(params: Record<string, string | string[] | undefined>): InterventionFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  return {
    q: get("q"),
    quick: normalizeQuickFilter(get("quick")),
    type: get("type"),
    location: get("location"),
    status: get("status"),
    source: get("source"),
    responsibleId: get("responsible"),
    from: get("from"),
    to: get("to"),
    page: getPositiveInt(get("page"), 1),
    pageSize: sanitizeInterventionPageSize(get("pageSize"))
  };
}

export function buildInterventionsQuery(filters: InterventionFilters) {
  const params = new URLSearchParams();
  if (filters.quick && filters.quick !== "all") params.set("quick", filters.quick);
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.location) params.set("location", filters.location);
  if (filters.status) params.set("status", filters.status);
  if (filters.source) params.set("source", filters.source);
  if (filters.responsibleId) params.set("responsible", filters.responsibleId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== DEFAULT_INTERVENTION_PAGE_SIZE) params.set("pageSize", String(sanitizeInterventionPageSize(filters.pageSize)));
  return params;
}

function mapInterventionRow(row: InterventionRow): InterventionItem {
  const isLate = Boolean(row.is_late);
  return {
    id: row.id,
    title: row.title,
    type: formatInterventionType(row.type),
    rawType: row.type,
    locationName: row.location_name || "Não informado",
    status: formatInterventionStatus(row.status, isLate),
    rawStatus: row.status,
    source: getOptionLabel(INTERVENTION_SOURCE_OPTIONS, row.source),
    rawSource: row.source,
    startAt: formatDateTime(row.start_at),
    endAt: formatDateTime(row.end_at),
    startAtIso: row.start_at,
    endAtIso: row.end_at,
    dateLabel: formatDate(row.start_at),
    timeLabel: toTimeLabel(row.start_at, row.end_at),
    pointsCount: Number(row.points_count ?? 0),
    createdByName: row.created_by_name ?? "Sistema",
    responsibleId: row.responsible_user_id,
    responsibleName: row.responsible_name ?? "Sem responsável definido",
    notes: row.notes,
    isLate,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    remindersCount: Number(row.reminders_count ?? 0),
    nextReminderAt: row.next_reminder_at ? formatDateTime(row.next_reminder_at) : null
  };
}

function mapPointRow(row: InterventionPointRow): InterventionPointItem {
  return {
    id: row.id,
    label: row.label,
    mapsUrl: row.maps_url,
    createdAt: formatDateTime(row.created_at),
    updatedAt: row.updated_at ? formatDateTime(row.updated_at) : null
  };
}

function mapReminderRow(row: InterventionReminderRow): InterventionReminderItem {
  return {
    id: row.id,
    type: REMINDER_TYPE_LABELS[row.reminder_type] ?? row.reminder_type,
    rawType: row.reminder_type,
    remindAt: formatDateTime(row.remind_at),
    remindAtIso: row.remind_at,
    status: REMINDER_STATUS_LABELS[row.status] ?? row.status,
    rawStatus: row.status,
    processedAt: row.processed_at ? formatDateTime(row.processed_at) : null,
    errorMessage: row.error_message
  };
}

export async function getInterventionsPageData(filters: InterventionFilters): Promise<InterventionListResult> {
  const built = buildInterventionFilters(filters);
  const pageSize = sanitizeInterventionPageSize(filters.pageSize);
  const requestedPage = getPositiveInt(filters.page, 1);

  const [summaryResult, countResult] = await Promise.all([
    query<{
      today: string;
      tomorrow: string;
      week: string;
      late: string;
      concluded: string;
      canceled: string;
    }>(
      `
        select
          count(*) filter (where (start_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date)::text as today,
          count(*) filter (where (start_at at time zone '${APP_TIME_ZONE}')::date = ((now() at time zone '${APP_TIME_ZONE}')::date + interval '1 day')::date)::text as tomorrow,
          count(*) filter (where start_at >= ((now() at time zone '${APP_TIME_ZONE}')::date at time zone '${APP_TIME_ZONE}') and start_at < (((now() at time zone '${APP_TIME_ZONE}')::date + interval '7 day') at time zone '${APP_TIME_ZONE}'))::text as week,
          count(*) filter (where status not in ('CONCLUIDO', 'CANCELADO') and (status = 'ATRASADO' or end_at < now()))::text as late,
          count(*) filter (where status = 'CONCLUIDO')::text as concluded,
          count(*) filter (where status = 'CANCELADO')::text as canceled
        from infra_events
        where archived_at is null
      `
    ),
    query<{ total: string }>(
      `
        select count(*)::text as total
        from infra_events ie
        ${built.clause}
      `,
      built.params
    )
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const listResult = await query<InterventionRow>(
    `
      ${baseInterventionSelect}
      ${built.clause}
      order by
        case when ie.status not in ('CONCLUIDO', 'CANCELADO') then 0 else 1 end,
        ie.start_at asc,
        ie.updated_at desc
      limit $${built.params.length + 1} offset $${built.params.length + 2}
    `,
    [...built.params, pageSize, offset]
  );

  const summaryRow = summaryResult.rows[0];
  const summary: InterventionSummary = {
    today: Number(summaryRow?.today ?? 0),
    tomorrow: Number(summaryRow?.tomorrow ?? 0),
    week: Number(summaryRow?.week ?? 0),
    late: Number(summaryRow?.late ?? 0),
    concluded: Number(summaryRow?.concluded ?? 0),
    canceled: Number(summaryRow?.canceled ?? 0)
  };

  return {
    items: listResult.rows.map(mapInterventionRow),
    summary,
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function getInterventionDetail(id: string): Promise<InterventionDetail | null> {
  if (!isUuid(id)) return null;

  const result = await query<InterventionRow>(
    `
      ${baseInterventionSelect}
      where ie.id = $1::uuid and ie.archived_at is null
      limit 1
    `,
    [id]
  );

  const row = result.rows[0];
  if (!row) return null;

  const [pointsResult, remindersResult] = await Promise.all([
    query<InterventionPointRow>(
      `
        select id::text, label, maps_url, created_at, updated_at
        from infra_event_points
        where event_id = $1::uuid
        order by created_at asc, label asc
      `,
      [id]
    ),
    query<InterventionReminderRow>(
      `
        select id::text, reminder_type, remind_at::text, status, processed_at::text, error_message
        from reminders
        where event_id = $1::uuid
        order by remind_at asc, created_at asc
      `,
      [id]
    )
  ]);

  return {
    ...mapInterventionRow(row),
    originalMessage: row.original_message,
    dateInput: toDateInput(row.start_at),
    startTimeInput: toTimeInput(row.start_at),
    endTimeInput: toTimeInput(row.end_at),
    points: pointsResult.rows.map(mapPointRow),
    reminders: remindersResult.rows.map(mapReminderRow),
    reminderConfig: normalizeReminderConfig(row.reminder_config)
  };
}
