import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatPriority,
  formatStatus,
  toDateTimeLocalValue
} from "@/lib/format";
import { isUuid } from "@/lib/validation";
import type {
  DashboardData,
  InternalUserItem,
  OrderFilters,
  ReportFilters,
  ReportsData,
  ServiceOrderDetail,
  ServiceOrderItem,
  ServiceOrderListResult,
  ServiceOrderLogItem,
  ServiceOrderNoteItem,
  TechnicianItem
} from "@/types";

type ServiceOrderRow = {
  id: string;
  order_number: string;
  opened_at: string | null;
  opened_by: string | null;
  opening_description: string;
  client_code: string | null;
  client_name: string | null;
  address_text: string | null;
  location_link: string | null;
  technician_id: string | null;
  technician_name: string | null;
  internal_owner_id: string | null;
  internal_owner_name: string | null;
  priority: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  status: "ABERTA" | "ENCAMINHADA" | "EM_ACOMPANHAMENTO" | "PENDENTE" | "FINALIZADA" | "CANCELADA";
  deadline_at: string | null;
  internal_note: string | null;
  finalized_at: string | null;
  finalized_by_name: string | null;
  closing_note: string | null;
  canceled_at: string | null;
  canceled_by_name: string | null;
  cancellation_note: string | null;
  reopened_at: string | null;
  reopened_by_name: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
  is_late: boolean;
  is_due_today: boolean;
  is_stale: boolean;
};

type ActivityRow = {
  id: string;
  actor_name: string | null;
  action_type: string;
  note: string | null;
  created_at: string;
};

type DashboardStatRow = {
  abertas: string;
  acompanhamento: string;
  pendentes: string;
  atrasadas: string;
  finalizadas_hoje: string;
};

const baseOrderSelect = `
  select
    so.id,
    so.order_number,
    so.opened_at,
    so.opened_by,
    so.opening_description,
    so.client_code,
    so.client_name,
    so.address_text,
    so.location_link,
    so.technician_id,
    t.full_name as technician_name,
    so.internal_owner_id,
    iu.full_name as internal_owner_name,
    so.priority,
    so.status,
    so.deadline_at,
    so.internal_note,
    so.finalized_at,
    iu_final.full_name as finalized_by_name,
    so.closing_note,
    so.canceled_at,
    iu_cancel.full_name as canceled_by_name,
    so.cancellation_note,
    so.reopened_at,
    iu_reopen.full_name as reopened_by_name,
    iu_created.full_name as created_by_name,
    iu_updated.full_name as updated_by_name,
    so.created_at,
    so.updated_at,
    (
      so.deadline_at is not null
      and so.status not in ('FINALIZADA', 'CANCELADA')
      and so.deadline_at < now()
    ) as is_late,
    (
      so.deadline_at::date = now()::date
      and so.status not in ('FINALIZADA', 'CANCELADA')
    ) as is_due_today,
    (
      so.updated_at < now() - interval '24 hours'
      and so.status not in ('FINALIZADA', 'CANCELADA')
    ) as is_stale
  from service_orders so
  left join technicians t on t.id = so.technician_id
  left join internal_users iu on iu.id = so.internal_owner_id
  left join internal_users iu_final on iu_final.id = so.finalized_by_user_id
  left join internal_users iu_cancel on iu_cancel.id = so.canceled_by_user_id
  left join internal_users iu_reopen on iu_reopen.id = so.reopened_by_user_id
  left join internal_users iu_created on iu_created.id = so.created_by_user_id
  left join internal_users iu_updated on iu_updated.id = so.updated_by_user_id
`;

function mapOrderRow(row: ServiceOrderRow): ServiceOrderItem {
  return {
    id: row.id,
    number: row.order_number,
    openedAt: formatDateTime(row.opened_at),
    openedBy: row.opened_by ?? "—",
    openingDescription: row.opening_description,
    clientCode: row.client_code,
    clientName: row.client_name,
    address: row.address_text,
    locationLink: row.location_link,
    technicianId: row.technician_id,
    internalOwnerId: row.internal_owner_id,
    assignedTechnician: row.technician_name ?? "Não definido",
    internalOwner: row.internal_owner_name ?? "Não definido",
    priority: formatPriority(row.priority),
    status: formatStatus(row.status, row.is_late),
    rawStatus: row.status,
    rawPriority: row.priority,
    deadline: formatDateTime(row.deadline_at),
    deadlineAt: row.deadline_at,
    internalNote: row.internal_note ?? "Sem observação interna.",
    openedAtIso: row.opened_at,
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
    isLate: row.is_late,
    isDueToday: row.is_due_today,
    isStale: row.is_stale
  };
}

function normalizeReportFilters(filters: ReportFilters) {
  return {
    from: filters.from ?? "",
    to: filters.to ?? "",
    technicianId: isUuid(filters.technicianId) ? filters.technicianId : "",
    status: filters.status ?? "",
    priority: filters.priority ?? ""
  };
}

function buildOrderFilters(filters: OrderFilters) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const index = params.length;
    where.push(`(
      so.order_number ilike $${index}
      or coalesce(so.client_name, '') ilike $${index}
      or coalesce(so.opening_description, '') ilike $${index}
    )`);
  }

  if (filters.technicianId && isUuid(filters.technicianId)) {
    params.push(filters.technicianId);
    where.push(`so.technician_id = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    where.push(`so.status = $${params.length}`);
  }

  if (filters.priority) {
    params.push(filters.priority);
    where.push(`so.priority = $${params.length}`);
  }

  if (filters.from) {
    params.push(filters.from);
    where.push(`coalesce(so.opened_at::date, so.created_at::date) >= $${params.length}::date`);
  }

  if (filters.to) {
    params.push(filters.to);
    where.push(`coalesce(so.opened_at::date, so.created_at::date) <= $${params.length}::date`);
  }

  if (filters.lateOnly) {
    where.push(`so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()`);
  }

  if (filters.dueToday) {
    where.push(`so.deadline_at::date = now()::date and so.status not in ('FINALIZADA', 'CANCELADA')`);
  }

  if (filters.staleOnly) {
    where.push(`so.updated_at < now() - interval '24 hours' and so.status not in ('FINALIZADA', 'CANCELADA')`);
  }

  const sortMap: Record<NonNullable<OrderFilters["sortBy"]>, string> = {
    deadline: `case when so.deadline_at is null then 1 else 0 end, so.deadline_at`,
    updated: `so.updated_at`,
    opened: `coalesce(so.opened_at, so.created_at)`,
    orderNumber: `so.order_number`,
    status: `so.status`,
    priority: `case so.priority when 'URGENTE' then 1 when 'ALTA' then 2 when 'MEDIA' then 3 else 4 end`
  };

  const sortBy = filters.sortBy ?? "deadline";
  const sortDir = filters.sortDir === "desc" ? "desc" : "asc";
  const sortExpression = sortMap[sortBy] ?? sortMap.deadline;
  const orderBy = `order by
    case when (so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()) then 0 else 1 end,
    ${sortExpression} ${sortDir},
    so.updated_at desc`;

  return {
    clause: where.length ? `where ${where.join(" and ")}` : "",
    params,
    orderBy
  };
}

function buildReportFilters(filters: ReportFilters, alias = "so") {
  const normalized = normalizeReportFilters(filters);
  const where: string[] = [];
  const params: unknown[] = [];

  if (normalized.from) {
    params.push(normalized.from);
    where.push(`coalesce(${alias}.opened_at::date, ${alias}.created_at::date) >= $${params.length}::date`);
  }

  if (normalized.to) {
    params.push(normalized.to);
    where.push(`coalesce(${alias}.opened_at::date, ${alias}.created_at::date) <= $${params.length}::date`);
  }

  if (normalized.technicianId) {
    params.push(normalized.technicianId);
    where.push(`${alias}.technician_id = $${params.length}`);
  }

  if (normalized.status) {
    params.push(normalized.status);
    where.push(`${alias}.status = $${params.length}`);
  }

  if (normalized.priority) {
    params.push(normalized.priority);
    where.push(`${alias}.priority = $${params.length}`);
  }

  return {
    normalized,
    clause: where.length ? `where ${where.join(" and ")}` : "",
    params
  };
}

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
    query<{ total: string }>(
      `select count(*)::text as total from service_orders so ${built.clause}`,
      built.params
    ),
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

export async function getServiceOrderDetail(id: string): Promise<ServiceOrderDetail | null> {
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

  const item = mapOrderRow(row);
  const notes: ServiceOrderNoteItem[] = notesResult.rows.map((note: { id: string; author_name: string | null; note: string; created_at: string }) => ({
    id: note.id,
    author: note.author_name ?? "Sistema",
    note: note.note,
    when: formatDateTime(note.created_at)
  }));

  const logs: ServiceOrderLogItem[] = logsResult.rows.map((log: { id: string; actor_name: string | null; action_type: string; note: string | null; created_at: string }) => ({
    id: log.id,
    actor: log.actor_name ?? "Sistema",
    description: log.action_type,
    note: log.note,
    when: formatDateTime(log.created_at)
  }));

  return {
    ...item,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    createdByName: row.created_by_name ?? "Sistema",
    updatedByName: row.updated_by_name ?? row.created_by_name ?? "Sistema",
    finalizedAt: row.finalized_at ? formatDateTime(row.finalized_at) : null,
    finalizedByName: row.finalized_by_name,
    closingNote: row.closing_note,
    canceledAt: row.canceled_at ? formatDateTime(row.canceled_at) : null,
    canceledByName: row.canceled_by_name,
    cancellationNote: row.cancellation_note,
    reopenedAt: row.reopened_at ? formatDateTime(row.reopened_at) : null,
    reopenedByName: row.reopened_by_name,
    openingDescriptionRaw: row.opening_description,
    openedAtInput: toDateTimeLocalValue(row.opened_at),
    deadlineInput: toDateTimeLocalValue(row.deadline_at),
    notes,
    logs
  };
}

async function getDashboardDataUncached(): Promise<DashboardData> {
  const [statsResult, dueTodayResult, overdueResult, staleResult, activitiesResult, techSummaryResult] = await Promise.all([
    query<DashboardStatRow>(`
      select
        count(*) filter (where status = 'ABERTA')::text as abertas,
        count(*) filter (where status = 'EM_ACOMPANHAMENTO')::text as acompanhamento,
        count(*) filter (where status = 'PENDENTE')::text as pendentes,
        count(*) filter (
          where deadline_at is not null and status not in ('FINALIZADA', 'CANCELADA') and deadline_at < now()
        )::text as atrasadas,
        count(*) filter (
          where status = 'FINALIZADA' and finalized_at::date = now()::date
        )::text as finalizadas_hoje
      from service_orders
    `),
    query<ServiceOrderRow>(`
      ${baseOrderSelect}
      where so.deadline_at::date = now()::date and so.status not in ('FINALIZADA', 'CANCELADA')
      order by so.deadline_at asc
      limit 5
    `),
    query<ServiceOrderRow>(`
      ${baseOrderSelect}
      where so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()
      order by so.deadline_at asc
      limit 5
    `),
    query<ServiceOrderRow>(`
      ${baseOrderSelect}
      where so.updated_at < now() - interval '24 hours' and so.status not in ('FINALIZADA', 'CANCELADA')
      order by so.updated_at asc
      limit 5
    `),
    query<ActivityRow>(`
      select l.id, iu.full_name as actor_name, l.action_type, l.note, l.created_at
      from service_order_logs l
      left join internal_users iu on iu.id = l.internal_user_id
      order by l.created_at desc
      limit 8
    `),
    query<{
      id: string;
      full_name: string;
      abertas: string;
      pendentes: string;
      atrasadas: string;
      finalizadas: string;
      phone: string | null;
      is_active: boolean;
    }>(`
      select
        t.id,
        t.full_name,
        t.phone,
        t.is_active,
        count(*) filter (where so.status not in ('FINALIZADA', 'CANCELADA'))::text as abertas,
        count(*) filter (where so.status = 'PENDENTE')::text as pendentes,
        count(*) filter (
          where so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()
        )::text as atrasadas,
        count(*) filter (where so.status = 'FINALIZADA')::text as finalizadas
      from technicians t
      left join service_orders so on so.technician_id = t.id
      group by t.id, t.full_name, t.phone, t.is_active
      order by t.full_name asc
    `)
  ]);

  const stats = statsResult.rows[0] ?? { abertas: "0", acompanhamento: "0", pendentes: "0", atrasadas: "0", finalizadas_hoje: "0" };

  return {
    stats: {
      abertas: Number(stats.abertas),
      acompanhamento: Number(stats.acompanhamento),
      pendentes: Number(stats.pendentes),
      atrasadas: Number(stats.atrasadas),
      finalizadasHoje: Number(stats.finalizadas_hoje)
    },
    dueToday: dueTodayResult.rows.map(mapOrderRow),
    overdue: overdueResult.rows.map(mapOrderRow),
    stale: staleResult.rows.map(mapOrderRow),
    activities: activitiesResult.rows.map((row: ActivityRow) => ({
      id: row.id,
      actor: row.actor_name ?? "Sistema",
      description: row.note ? `${row.action_type}` : row.action_type,
      when: formatDateTime(row.created_at)
    })),
    technicianSummary: techSummaryResult.rows.map((row: { id: string; full_name: string; abertas: string; pendentes: string; atrasadas: string; finalizadas: string; phone: string | null; is_active: boolean }) => ({
      id: row.id,
      name: row.full_name,
      phone: row.phone ?? "",
      active: row.is_active,
      openOrders: Number(row.abertas),
      pendingOrders: Number(row.pendentes),
      lateOrders: Number(row.atrasadas),
      finishedOrders: Number(row.finalizadas)
    }))
  };
}

const getDashboardDataCached = unstable_cache(getDashboardDataUncached, ["dashboard-data-v2.8"], { revalidate: 60, tags: ["dashboard"] });
export async function getDashboardData(): Promise<DashboardData> {
  return getDashboardDataCached();
}

export async function getTechnicians(): Promise<TechnicianItem[]> {
  const result = await query<{
    id: string;
    full_name: string;
    phone: string | null;
    is_active: boolean;
    abertas: string;
    atrasadas: string;
    pendentes: string;
    finalizadas: string;
  }>(`
    select
      t.id,
      t.full_name,
      t.phone,
      t.is_active,
      count(*) filter (where so.status not in ('FINALIZADA', 'CANCELADA'))::text as abertas,
      count(*) filter (
        where so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()
      )::text as atrasadas,
      count(*) filter (where so.status = 'PENDENTE')::text as pendentes,
      count(*) filter (where so.status = 'FINALIZADA')::text as finalizadas
    from technicians t
    left join service_orders so on so.technician_id = t.id
    group by t.id, t.full_name, t.phone, t.is_active
    order by t.full_name asc
  `);

  return result.rows.map((row: { id: string; full_name: string; phone: string | null; is_active: boolean; abertas: string; atrasadas: string; pendentes: string; finalizadas: string }) => ({
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? "",
    active: row.is_active,
    openOrders: Number(row.abertas),
    lateOrders: Number(row.atrasadas),
    pendingOrders: Number(row.pendentes),
    finishedOrders: Number(row.finalizadas)
  }));
}

export async function getTechnicianById(id: string) {
  if (!isUuid(id)) return null;
  const result = await query<{ id: string; full_name: string; phone: string | null; is_active: boolean }>(
    `select id, full_name, phone, is_active from technicians where id = $1 limit 1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, name: row.full_name, phone: row.phone ?? "", active: row.is_active };
}

export async function getInternalUsers(): Promise<InternalUserItem[]> {
  const result = await query<{
    id: string;
    full_name: string;
    email: string;
    role: "ADMIN" | "OPERADOR";
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
  }>(`
    select id, full_name, email, role, is_active, last_login_at, created_at
    from internal_users
    order by full_name asc
  `);

  return result.rows.map((row: { id: string; full_name: string; email: string; role: "ADMIN" | "OPERADOR"; is_active: boolean; last_login_at: string | null; created_at: string }) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    active: row.is_active,
    lastAccess: formatDateTime(row.last_login_at),
    createdAt: formatDate(row.created_at)
  }));
}

export async function getInternalUserById(id: string) {
  if (!isUuid(id)) return null;
  const result = await query<{ id: string; full_name: string; email: string; role: "ADMIN" | "OPERADOR"; is_active: boolean }>(
    `select id, full_name, email, role, is_active from internal_users where id = $1 limit 1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, name: row.full_name, email: row.email, role: row.role, active: row.is_active };
}

async function getReportsDataUncached(filters: ReportFilters): Promise<ReportsData> {
  const built = buildReportFilters(filters);

  const [summaryResult, statusResult, priorityResult, technicianResult] = await Promise.all([
    query<{ total_orders: string; late_orders: string; avg_hours_to_finish: string | null; finished_orders: string }>(
      `
        select
          count(*)::text as total_orders,
          count(*) filter (
            where so.deadline_at is not null
              and so.status not in ('FINALIZADA', 'CANCELADA')
              and so.deadline_at < now()
          )::text as late_orders,
          round((avg(extract(epoch from (so.finalized_at - coalesce(so.opened_at, so.created_at))) / 3600) filter (where so.status = 'FINALIZADA'))::numeric, 1)::text as avg_hours_to_finish,
          count(*) filter (where so.status = 'FINALIZADA')::text as finished_orders
        from service_orders so
        ${built.clause}
      `,
      built.params
    ),
    query<{ label: string; total: string }>(
      `
        select so.status as label, count(*)::text as total
        from service_orders so
        ${built.clause}
        group by so.status
        order by count(*) desc, so.status asc
      `,
      built.params
    ),
    query<{ label: string; total: string }>(
      `
        select so.priority as label, count(*)::text as total
        from service_orders so
        ${built.clause}
        group by so.priority
        order by count(*) desc, so.priority asc
      `,
      built.params
    ),
    query<{
      technician_id: string;
      technician_name: string;
      total_orders: string;
      finished_orders: string;
      late_orders: string;
      pending_orders: string;
      avg_hours_to_finish: string | null;
    }>(
      `
        select
          coalesce(t.id::text, 'unassigned') as technician_id,
          coalesce(t.full_name, 'Não definido') as technician_name,
          count(*)::text as total_orders,
          count(*) filter (where so.status = 'FINALIZADA')::text as finished_orders,
          count(*) filter (
            where so.deadline_at is not null
              and so.status not in ('FINALIZADA', 'CANCELADA')
              and so.deadline_at < now()
          )::text as late_orders,
          count(*) filter (where so.status = 'PENDENTE')::text as pending_orders,
          round((avg(extract(epoch from (so.finalized_at - coalesce(so.opened_at, so.created_at))) / 3600) filter (where so.status = 'FINALIZADA'))::numeric, 1)::text as avg_hours_to_finish
        from service_orders so
        left join technicians t on t.id = so.technician_id
        ${built.clause}
        group by t.id, t.full_name
        order by count(*) desc, coalesce(t.full_name, 'Não definido') asc
      `,
      built.params
    )
  ]);

  const summary = summaryResult.rows[0] ?? {
    total_orders: "0",
    late_orders: "0",
    avg_hours_to_finish: null,
    finished_orders: "0"
  };

  return {
    filters: built.normalized,
    summary: {
      totalOrders: Number(summary.total_orders),
      lateOrders: Number(summary.late_orders),
      avgHoursToFinish: Number(summary.avg_hours_to_finish ?? 0),
      finishedOrders: Number(summary.finished_orders),
      pendingOrders: technicianResult.rows.reduce((acc: number, row: { pending_orders: string }) => acc + Number(row.pending_orders), 0)
    },
    byStatus: statusResult.rows.map((row: { label: string; total: string }) => ({ label: row.label, total: Number(row.total) })),
    byPriority: priorityResult.rows.map((row: { label: string; total: string }) => ({ label: row.label, total: Number(row.total) })),
    byTechnician: technicianResult.rows.map((row: { technician_id: string; technician_name: string; total_orders: string; finished_orders: string; late_orders: string; pending_orders: string; avg_hours_to_finish: string | null }) => ({
      technicianId: row.technician_id,
      technicianName: row.technician_name,
      totalOrders: Number(row.total_orders),
      finishedOrders: Number(row.finished_orders),
      lateOrders: Number(row.late_orders),
      pendingOrders: Number(row.pending_orders),
      avgHoursToFinish: Number(row.avg_hours_to_finish ?? 0)
    }))
  };
}

const getReportsDataCached = unstable_cache(
  async (serializedFilters: string) => getReportsDataUncached(JSON.parse(serializedFilters) as ReportFilters),
  ["reports-data-v2.8"],
  { revalidate: 300, tags: ["reports"] }
);

export async function getReportsData(filters: ReportFilters): Promise<ReportsData> {
  return getReportsDataCached(JSON.stringify(normalizeReportFilters(filters)));
}

export function mapReportStatusLabel(label: string) {
  const dictionary: Record<string, string> = {
    ABERTA: "Aberta",
    ENCAMINHADA: "Encaminhada",
    EM_ACOMPANHAMENTO: "Em acompanhamento",
    PENDENTE: "Pendente",
    FINALIZADA: "Finalizada",
    CANCELADA: "Cancelada",
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente"
  };

  return dictionary[label] ?? label;
}

export function formatReportAvgHours(value: number) {
  return formatHours(value);
}
