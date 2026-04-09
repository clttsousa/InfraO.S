import { APP_TIME_ZONE, formatDateTime, formatHours, formatPriority, formatStatus, toDateTimeLocalValue } from "@/lib/format";
import { isUuid } from "@/lib/validation";
import { sanitizeExternalHttpUrl } from "@/lib/url-safety";
import type {
  OrderFilters,
  OrderSortDirection,
  OrderSortField,
  ReportFilters,
  ServiceOrderDetail,
  ServiceOrderItem,
  ServiceOrderLogItem,
  ServiceOrderNoteItem
} from "@/types";

export type ServiceOrderRow = {
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
  support_technician_ids: string[] | null;
  support_technician_names: string[] | null;
  support_technician_count: number | string | null;
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

export type ActivityRow = {
  id: string;
  actor_name: string | null;
  action_type: string;
  note: string | null;
  created_at: string;
};

export type DashboardStatRow = {
  abertas: string;
  acompanhamento: string;
  pendentes: string;
  atrasadas: string;
  finalizadas_hoje: string;
};

export const baseOrderSelect = `
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
    support.support_technician_ids,
    support.support_technician_names,
    support.support_technician_count,
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
      so.deadline_at is not null
      and so.status not in ('FINALIZADA', 'CANCELADA')
      and so.deadline_at >= now()
      and (so.deadline_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
    ) as is_due_today,
    (
      so.updated_at < now() - interval '24 hours'
      and so.status not in ('FINALIZADA', 'CANCELADA')
    ) as is_stale
  from service_orders so
  left join technicians t on t.id = so.technician_id
  left join lateral (
    select
      coalesce(array_agg(st.id::text order by st.full_name) filter (where st.id is not null), '{}'::text[]) as support_technician_ids,
      coalesce(array_agg(st.full_name order by st.full_name) filter (where st.full_name is not null), '{}'::text[]) as support_technician_names,
      count(*) filter (where st.id is not null) as support_technician_count
    from service_order_technicians sot
    join technicians st on st.id = sot.technician_id
    where sot.service_order_id = so.id and sot.role = 'SUPPORT'
  ) support on true
  left join internal_users iu on iu.id = so.internal_owner_id
  left join internal_users iu_final on iu_final.id = so.finalized_by_user_id
  left join internal_users iu_cancel on iu_cancel.id = so.canceled_by_user_id
  left join internal_users iu_reopen on iu_reopen.id = so.reopened_by_user_id
  left join internal_users iu_created on iu_created.id = so.created_by_user_id
  left join internal_users iu_updated on iu_updated.id = so.updated_by_user_id
`;

export function mapOrderRow(row: ServiceOrderRow): ServiceOrderItem {
  const supportTechnicianIds = row.support_technician_ids ?? [];
  const supportTechnicianNames = row.support_technician_names ?? [];
  const supportTechnicians = supportTechnicianNames.map((name, index) => ({
    id: supportTechnicianIds[index] ?? `support-${index}`,
    name
  }));
  const supportTechnicianCount = Number(row.support_technician_count ?? supportTechnicians.length);
  const teamSummary = supportTechnicianCount > 0
    ? `${row.technician_name ?? "Não definido"} +${supportTechnicianCount} apoio${supportTechnicianCount > 1 ? "s" : ""}`
    : row.technician_name ?? "Não definido";

  return {
    id: row.id,
    number: row.order_number,
    openedAt: formatDateTime(row.opened_at),
    openedBy: row.opened_by ?? "—",
    openingDescription: row.opening_description,
    clientCode: row.client_code,
    clientName: row.client_name,
    address: row.address_text,
    locationLink: sanitizeExternalHttpUrl(row.location_link),
    technicianId: row.technician_id,
    internalOwnerId: row.internal_owner_id,
    assignedTechnician: row.technician_name ?? "Não definido",
    supportTechnicianIds,
    supportTechnicians,
    supportTechnicianCount,
    teamSummary,
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

export function mapOrderDetail(
  row: ServiceOrderRow,
  notes: ServiceOrderNoteItem[],
  logs: ServiceOrderLogItem[]
): ServiceOrderDetail {
  const item = mapOrderRow(row);

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

export function normalizeReportFilters(filters: ReportFilters) {
  return {
    from: filters.from ?? "",
    to: filters.to ?? "",
    technicianId: isUuid(filters.technicianId) ? filters.technicianId : "",
    status: filters.status ?? "",
    priority: filters.priority ?? ""
  };
}

export function buildOrderFilters(filters: OrderFilters) {
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
    const index = params.length;
    where.push(`(
      so.technician_id = $${index}
      or exists (
        select 1
        from service_order_technicians sot
        where sot.service_order_id = so.id
          and sot.technician_id = $${index}
          and sot.role = 'SUPPORT'
      )
    )`);
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
    where.push(`coalesce((so.opened_at at time zone 'America/Sao_Paulo')::date, (so.created_at at time zone 'America/Sao_Paulo')::date) >= $${params.length}::date`);
  }

  if (filters.to) {
    params.push(filters.to);
    where.push(`coalesce((so.opened_at at time zone 'America/Sao_Paulo')::date, (so.created_at at time zone 'America/Sao_Paulo')::date) <= $${params.length}::date`);
  }

  if (filters.lateOnly) {
    where.push(`so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()`);
  }

  if (filters.dueToday) {
    where.push(`so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at >= now() and (so.deadline_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date`);
  }

  if (filters.staleOnly) {
    where.push(`so.updated_at < now() - interval '24 hours' and so.status not in ('FINALIZADA', 'CANCELADA')`);
  }

  const sortMap: Record<OrderSortField, string> = {
    deadline: `case when so.deadline_at is null then 1 else 0 end, so.deadline_at`,
    updated: `so.updated_at`,
    opened: `coalesce(so.opened_at, so.created_at)`,
    orderNumber: `so.order_number`,
    status: `so.status`,
    priority: `case so.priority when 'URGENTE' then 1 when 'ALTA' then 2 when 'MEDIA' then 3 else 4 end`
  };

  const sortBy = filters.sortBy ?? "deadline";
  const sortDir: OrderSortDirection = filters.sortDir === "desc" ? "desc" : "asc";
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

export function buildReportFilters(filters: ReportFilters, alias = "so") {
  const normalized = normalizeReportFilters(filters);
  const where: string[] = [];
  const params: unknown[] = [];

  if (normalized.from) {
    params.push(normalized.from);
    where.push(`coalesce((${alias}.opened_at at time zone 'America/Sao_Paulo')::date, (${alias}.created_at at time zone 'America/Sao_Paulo')::date) >= $${params.length}::date`);
  }

  if (normalized.to) {
    params.push(normalized.to);
    where.push(`coalesce((${alias}.opened_at at time zone 'America/Sao_Paulo')::date, (${alias}.created_at at time zone 'America/Sao_Paulo')::date) <= $${params.length}::date`);
  }

  if (normalized.technicianId) {
    params.push(normalized.technicianId);
    const index = params.length;
    where.push(`(
      ${alias}.technician_id = $${index}
      or exists (
        select 1
        from service_order_technicians sot
        where sot.service_order_id = ${alias}.id
          and sot.technician_id = $${index}
          and sot.role = 'SUPPORT'
      )
    )`);
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
