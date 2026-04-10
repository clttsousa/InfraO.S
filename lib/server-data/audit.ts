import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import type { AuditEventItem } from "@/types";

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
  created_at: string;
};

type AuditEventsFilters = {
  orderQuery?: string;
  actorUserId?: string;
  actionType?: string;
  from?: string;
  to?: string;
  limit?: number;
};

function mapAuditEvent(row: AuditEventRow): AuditEventItem {
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
    when: formatDateTime(row.created_at),
    createdAtIso: row.created_at
  };
}

export async function getServiceOrderAuditEvents(serviceOrderId: string): Promise<AuditEventItem[]> {
  if (!isUuid(serviceOrderId)) return [];

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
}

export async function getAuditEvents(filters: AuditEventsFilters = {}): Promise<AuditEventItem[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const safeLimit = Math.min(Math.max(filters.limit ?? 200, 1), 500);

  if (filters.orderQuery?.trim()) {
    params.push(`%${filters.orderQuery.trim()}%`);
    const index = params.length;
    where.push(`(so.order_number ilike $${index} or ae.entity_id::text ilike $${index})`);
  }

  if (filters.actorUserId && isUuid(filters.actorUserId)) {
    params.push(filters.actorUserId);
    const index = params.length;
    where.push(`ae.actor_user_id = $${index}::uuid`);
  }

  if (filters.actionType?.trim()) {
    params.push(filters.actionType.trim());
    const index = params.length;
    where.push(`ae.action_type = $${index}`);
  }

  if (filters.from?.trim()) {
    params.push(`${filters.from.trim()}T00:00:00`);
    const index = params.length;
    where.push(`ae.created_at >= $${index}::timestamptz`);
  }

  if (filters.to?.trim()) {
    params.push(`${filters.to.trim()}T23:59:59`);
    const index = params.length;
    where.push(`ae.created_at <= $${index}::timestamptz`);
  }

  params.push(safeLimit);
  const limitIndex = params.length;
  const whereClause = where.length ? `where ${where.join(" and ")}` : "";

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
      ${whereClause}
      order by ae.created_at desc
      limit $${limitIndex}
    `,
    params
  );

  return result.rows.map(mapAuditEvent);
}

