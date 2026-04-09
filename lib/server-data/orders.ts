import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { baseOrderSelect, buildOrderFilters, mapOrderDetail, mapOrderRow, type ServiceOrderRow } from "@/lib/server-data/shared";
import type { OrderFilters, ServiceOrderItem, ServiceOrderListResult, ServiceOrderLogItem, ServiceOrderNoteItem } from "@/types";

type OrderDetailAggregateRow = ServiceOrderRow & {
  notes_json: Array<{ id: string; author_name: string | null; note: string; created_at: string }> | null;
  logs_json: Array<{ id: string; actor_name: string | null; action_type: string; note: string | null; created_at: string }> | null;
};

async function getServiceOrderRows(filters: OrderFilters, withPagination = true) {
  const built = buildOrderFilters(filters);
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const offset = (page - 1) * pageSize;
  const paginationSql = withPagination ? `limit ${pageSize} offset ${offset}` : "";
  return query<ServiceOrderRow>(`
      ${baseOrderSelect}
      ${built.clause}
      ${built.orderBy}
      ${paginationSql}
    `, built.params);
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
  return { items: rowsResult.rows.map(mapOrderRow), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getServiceOrderDetail(id: string) {
  if (!isUuid(id)) return null;
  const result = await query<OrderDetailAggregateRow>(`
      ${baseOrderSelect}
      left join lateral (
        select coalesce(json_agg(json_build_object('id', n.id, 'author_name', iu_notes.full_name, 'note', n.note, 'created_at', n.created_at) order by n.created_at desc), '[]'::json) as notes_json
        from service_order_notes n
        left join internal_users iu_notes on iu_notes.id = n.internal_user_id
        where n.service_order_id = so.id
      ) notes_agg on true
      left join lateral (
        select coalesce(json_agg(json_build_object('id', l.id, 'actor_name', iu_logs.full_name, 'action_type', l.action_type, 'note', l.note, 'created_at', l.created_at) order by l.created_at desc), '[]'::json) as logs_json
        from service_order_logs l
        left join internal_users iu_logs on iu_logs.id = l.internal_user_id
        where l.service_order_id = so.id
      ) logs_agg on true
      where so.id = $1
      limit 1
    `, [id]);
  const row = result.rows[0];
  if (!row) return null;
  const notes: ServiceOrderNoteItem[] = (row.notes_json ?? []).map((note) => ({ id: note.id, author: note.author_name ?? "Sistema", note: note.note, when: formatDateTime(note.created_at) }));
  const logs: ServiceOrderLogItem[] = (row.logs_json ?? []).map((log) => ({ id: log.id, actor: log.actor_name ?? "Sistema", description: log.action_type, note: log.note, when: formatDateTime(log.created_at) }));
  return mapOrderDetail(row, notes, logs);
}
