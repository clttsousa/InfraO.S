import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { getServiceOrderAuditEvents } from "@/lib/server-data/audit";
import { baseOrderSelect, buildOrderFilters, mapOrderDetail, mapOrderRow, type ServiceOrderRow } from "@/lib/server-data/shared";
import type { OrderFilters, ServiceOrderItem, ServiceOrderListResult, ServiceOrderLogItem, ServiceOrderNoteItem } from "@/types";

async function getServiceOrderRows(filters: OrderFilters, withPagination = true) {
  const built = buildOrderFilters(filters);
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const offset = (page - 1) * pageSize;
  const paginationSql = withPagination ? `limit ${pageSize} offset ${offset}` : "";

  return query<ServiceOrderRow>(
    `
      ${baseOrderSelect}
      ${built.clause}
      ${built.orderBy}
      ${paginationSql}
    `,
    built.params
  );
}

export async function getServiceOrders(filters: OrderFilters): Promise<ServiceOrderItem[]> {
  const result = await getServiceOrderRows(filters, false);
  return result.rows.map(mapOrderRow);
}

export async function getServiceOrdersPageData(filters: OrderFilters): Promise<ServiceOrderListResult> {
  const built = buildOrderFilters(filters);
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const [countResult, rowsResult] = await Promise.all([
    query<{ total: string }>(`select count(*)::text as total from service_orders so ${built.clause}`, built.params),
    getServiceOrderRows(filters, true)
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);

  return {
    items: rowsResult.rows.map(mapOrderRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function getServiceOrderDetail(id: string) {
  if (!isUuid(id)) return null;

  const result = await query<ServiceOrderRow>(
    `
      ${baseOrderSelect}
      where so.id = $1
      limit 1
    `,
    [id]
  );

  const row = result.rows[0];
  if (!row) return null;

  const [notesResult, logsResult] = await Promise.all([
    query<{ id: string; author_name: string | null; note: string; created_at: string }>(
      `
        select n.id, iu.full_name as author_name, n.note, n.created_at
        from service_order_notes n
        left join internal_users iu on iu.id = n.internal_user_id
        where n.service_order_id = $1
        order by n.created_at desc
      `,
      [id]
    ),
    query<{ id: string; actor_name: string | null; action_type: string; note: string | null; created_at: string }>(
      `
        select l.id, iu.full_name as actor_name, l.action_type, l.note, l.created_at
        from service_order_logs l
        left join internal_users iu on iu.id = l.internal_user_id
        where l.service_order_id = $1
        order by l.created_at desc
      `,
      [id]
    )
  ]);

  const notes: ServiceOrderNoteItem[] = notesResult.rows.map((note) => ({
    id: note.id,
    author: note.author_name ?? "Sistema",
    note: note.note,
    when: formatDateTime(note.created_at)
  }));

  const logs: ServiceOrderLogItem[] = logsResult.rows.map((log) => ({
    id: log.id,
    actor: log.actor_name ?? "Sistema",
    description: log.action_type,
    note: log.note,
    when: formatDateTime(log.created_at)
  }));

  const auditEvents = await getServiceOrderAuditEvents(id);

  return {
    ...mapOrderDetail(row, notes, logs),
    auditEvents
  };
}
