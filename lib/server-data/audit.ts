import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import type { AuditEventItem, AuditEventsFilters, AuditEventsListResult } from "@/types";

type AuditEventRow = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  scope: string;
  action_type: string;
  field_name: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  old_value: unknown;
  new_value: unknown;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | Date | null;
};

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isMissingAuditSchemaError(error: unknown) {
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "42P01" || candidate.code === "42703") return true;
  return typeof candidate.message === "string" && candidate.message.toLowerCase().includes("audit_events");
}


function mapAuditEvent(row: AuditEventRow): AuditEventItem {
  const createdAtIso = toIsoString(row.created_at);

  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    scope: row.scope,
    actionType: row.action_type,
    fieldName: row.field_name,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name ?? "Sistema",
    oldValue: row.old_value ?? null,
    newValue: row.new_value ?? null,
    note: row.note,
    metadata: row.metadata ?? null,
    when: formatDateTime(createdAtIso),
    createdAtIso
  };
}

export async function getServiceOrderAuditEvents(serviceOrderId: string): Promise<AuditEventItem[]> {
  if (!isUuid(serviceOrderId)) return [];

  try {
    const result = await query<AuditEventRow>(
      `
        select
          ae.id,
          ae.entity_type,
          ae.entity_id::text as entity_id,
          so.order_number as entity_label,
          ae.scope,
          ae.action_type,
          ae.field_name,
          ae.actor_user_id::text as actor_user_id,
          ae.actor_name,
          ae.old_value,
          ae.new_value,
          ae.note,
          ae.metadata,
          ae.created_at
        from audit_events ae
        left join service_orders so
          on ae.entity_type = 'service_order'
         and so.id = ae.entity_id
        where ae.entity_type = 'service_order'
          and ae.entity_id = $1::uuid
        order by ae.created_at desc
      `,
      [serviceOrderId]
    );

    return result.rows.map(mapAuditEvent);
  } catch (error) {
    if (isMissingAuditSchemaError(error)) return [];
    throw error;
  }
}

function sanitizeAuditPageSize(value: number | string | undefined, fallback = 50) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return [25, 50, 100].includes(normalized) ? normalized : fallback;
}

function getPositivePage(value: number | string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function buildAuditEventFilters(filters: AuditEventsFilters = {}) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.q?.trim()) {
    params.push(`%${filters.q.trim()}%`);
    const index = params.length;
    where.push(`(
      coalesce(so.order_number, '') ilike $${index}
      or coalesce(ie.title, '') ilike $${index}
      or ae.entity_id::text ilike $${index}
      or ae.entity_type ilike $${index}
      or ae.action_type ilike $${index}
      or coalesce(ae.field_name, '') ilike $${index}
      or coalesce(ae.actor_name, '') ilike $${index}
      or coalesce(ae.note, '') ilike $${index}
      or coalesce(ae.metadata::text, '') ilike $${index}
    )`);
  }

  if (filters.actorUserId && isUuid(filters.actorUserId)) {
    params.push(filters.actorUserId);
    where.push(`ae.actor_user_id = $${params.length}::uuid`);
  }

  if (filters.actionType?.trim()) {
    params.push(filters.actionType.trim());
    where.push(`ae.action_type = $${params.length}`);
  }

  if (filters.entityType?.trim()) {
    params.push(filters.entityType.trim());
    where.push(`ae.entity_type = $${params.length}`);
  }

  if (filters.from?.trim()) {
    params.push(`${filters.from.trim()}T00:00:00`);
    where.push(`ae.created_at >= $${params.length}::timestamptz`);
  }

  if (filters.to?.trim()) {
    params.push(`${filters.to.trim()}T23:59:59`);
    where.push(`ae.created_at <= $${params.length}::timestamptz`);
  }

  return { clause: where.length ? `where ${where.join(" and ")}` : "", params };
}

const auditSelect = `
  select
    ae.id,
    ae.entity_type,
    ae.entity_id::text as entity_id,
    coalesce(so.order_number, ie.title) as entity_label,
    ae.scope,
    ae.action_type,
    ae.field_name,
    ae.actor_user_id::text as actor_user_id,
    ae.actor_name,
    ae.old_value,
    ae.new_value,
    ae.note,
    ae.metadata,
    ae.created_at
  from audit_events ae
  left join service_orders so
    on ae.entity_type = 'service_order'
   and so.id = ae.entity_id
  left join infra_events ie
    on ae.entity_type = 'infra_event'
   and ie.id = ae.entity_id
`;

export async function getAuditEventsPageData(filters: AuditEventsFilters = {}): Promise<AuditEventsListResult> {
  const pageSize = sanitizeAuditPageSize(filters.pageSize ?? filters.limit, filters.limit ? Math.min(Math.max(filters.limit, 1), 100) : 50);
  const requestedPage = getPositivePage(filters.page);
  const built = buildAuditEventFilters(filters);

  try {
    const countResult = await query<{ total: string; today: string; unique_actors: string }>(
      `
        select
          count(*)::text as total,
          count(*) filter (
            where (ae.created_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
          )::text as today,
          count(distinct coalesce(ae.actor_user_id::text, ae.actor_name, 'Sistema'))::text as unique_actors
        from audit_events ae
        left join service_orders so
          on ae.entity_type = 'service_order'
         and so.id = ae.entity_id
        left join infra_events ie
          on ae.entity_type = 'infra_event'
         and ie.id = ae.entity_id
        ${built.clause}
      `,
      built.params
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;

    const result = await query<AuditEventRow>(
      `
        ${auditSelect}
        ${built.clause}
        order by ae.created_at desc
        limit $${built.params.length + 1} offset $${built.params.length + 2}
      `,
      [...built.params, pageSize, offset]
    );

    const countRow = countResult.rows[0];
    return {
      items: result.rows.map(mapAuditEvent),
      total,
      page,
      pageSize,
      totalPages,
      summary: {
        today: Number(countRow?.today ?? 0),
        uniqueActors: Number(countRow?.unique_actors ?? 0)
      }
    };
  } catch (error) {
    if (isMissingAuditSchemaError(error)) {
      return { items: [], total: 0, page: 1, pageSize, totalPages: 1, summary: { today: 0, uniqueActors: 0 } };
    }
    throw error;
  }
}

export async function getAuditEvents(filters: AuditEventsFilters = {}): Promise<AuditEventItem[]> {
  const pageData = await getAuditEventsPageData({ ...filters, page: 1, pageSize: filters.limit ?? filters.pageSize ?? 100 });
  return pageData.items;
}
