import { query } from "@/lib/db";
import { sanitizeOrderPageSize } from "@/lib/filter-params";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { getServiceOrderAuditEvents } from "@/lib/server-data/audit";
import { baseOrderSelect, buildOrderFilters, mapOrderDetail, mapOrderRow, type ServiceOrderRow } from "@/lib/server-data/shared";
import type { OrderFilters, ServiceOrderItem, ServiceOrderListResult, ServiceOrderLogItem, ServiceOrderNoteItem } from "@/types";

async function getServiceOrderRows(filters: OrderFilters, withPagination = true) {
  const built = buildOrderFilters(filters);
  const pageSize = sanitizeOrderPageSize(filters.pageSize);
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const offset = (page - 1) * pageSize;
  const paginationSql = withPagination ? `limit $${built.params.length + 1} offset $${built.params.length + 2}` : "";
  const queryParams = withPagination ? [...built.params, pageSize, offset] : built.params;

  return query<ServiceOrderRow>(
    `
      ${baseOrderSelect}
      ${built.clause}
      ${built.orderBy}
      ${paginationSql}
    `,
    queryParams
  );
}

export async function getServiceOrders(filters: OrderFilters): Promise<ServiceOrderItem[]> {
  const result = await getServiceOrderRows(filters, false);
  return result.rows.map(mapOrderRow);
}

export async function getServiceOrdersPageData(filters: OrderFilters): Promise<ServiceOrderListResult> {
  const built = buildOrderFilters(filters);
  const pageSize = sanitizeOrderPageSize(filters.pageSize);
  const requestedPage = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;

  const countResult = await query<{ total: string; late: string; due_today: string; stale: string }>(
    `
      select
        count(*)::text as total,
        count(*) filter (
          where so.deadline_at is not null
            and so.status not in ('FINALIZADA', 'CANCELADA')
            and so.deadline_at < now()
        )::text as late,
        count(*) filter (
          where so.deadline_at is not null
            and so.status not in ('FINALIZADA', 'CANCELADA')
            and so.deadline_at >= now()
            and (so.deadline_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
        )::text as due_today,
        count(*) filter (
          where so.updated_at < now() - interval '24 hours'
            and so.status not in ('FINALIZADA', 'CANCELADA')
        )::text as stale
      from service_orders so
      ${built.clause}
    `,
    built.params
  );
  const countRow = countResult.rows[0];
  const total = Number(countRow?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const rowsResult = await getServiceOrderRows({ ...filters, page, pageSize }, true);

  return {
    items: rowsResult.rows.map(mapOrderRow),
    total,
    page,
    pageSize,
    totalPages,
    summary: {
      late: Number(countRow?.late ?? 0),
      dueToday: Number(countRow?.due_today ?? 0),
      stale: Number(countRow?.stale ?? 0)
    }
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
