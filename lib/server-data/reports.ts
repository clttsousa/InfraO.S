import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { buildReportFilters, formatReportAvgHours, mapReportStatusLabel } from "@/lib/server-data/shared";
import type { ReportFilters, ReportsData } from "@/types";

async function getReportsDataUncached(filters: ReportFilters): Promise<ReportsData> {
  const built = buildReportFilters(filters);
  const technicianBreakdownParams = [...built.params];
  const technicianBreakdownClause = built.normalized.technicianId
    ? `${built.clause || "where 1=1"} and ti.technician_id = $${technicianBreakdownParams.length + 1}`
    : built.clause;

  if (built.normalized.technicianId) {
    technicianBreakdownParams.push(built.normalized.technicianId);
  }

  const [summaryResult, statusResult, priorityResult, technicianResult] = await Promise.all([
    query<{ total_orders: string; late_orders: string; avg_hours_to_finish: string | null; finished_orders: string; pending_orders: string }>(
      `
        select
          count(*)::text as total_orders,
          count(*) filter (
            where so.deadline_at is not null
              and so.status not in ('FINALIZADA', 'CANCELADA')
              and so.deadline_at < now()
          )::text as late_orders,
          round((avg(extract(epoch from (so.finalized_at - coalesce(so.opened_at, so.created_at))) / 3600) filter (where so.status = 'FINALIZADA'))::numeric, 1)::text as avg_hours_to_finish,
          count(*) filter (where so.status = 'FINALIZADA')::text as finished_orders,
          count(*) filter (where so.status = 'PENDENTE')::text as pending_orders
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
        with technician_involvement as (
          select so_primary.id as service_order_id, so_primary.technician_id
          from service_orders so_primary
          where so_primary.technician_id is not null
          union all
          select sot.service_order_id, sot.technician_id
          from service_order_technicians sot
          where sot.role = 'SUPPORT'
        )
        select
          coalesce(t.id::text, 'unassigned') as technician_id,
          coalesce(t.full_name, 'Não definido') as technician_name,
          count(distinct so.id)::text as total_orders,
          count(distinct so.id) filter (where so.status = 'FINALIZADA')::text as finished_orders,
          count(distinct so.id) filter (
            where so.deadline_at is not null
              and so.status not in ('FINALIZADA', 'CANCELADA')
              and so.deadline_at < now()
          )::text as late_orders,
          count(distinct so.id) filter (where so.status = 'PENDENTE')::text as pending_orders,
          round((avg(extract(epoch from (so.finalized_at - coalesce(so.opened_at, so.created_at))) / 3600) filter (where so.status = 'FINALIZADA'))::numeric, 1)::text as avg_hours_to_finish
        from service_orders so
        left join technician_involvement ti on ti.service_order_id = so.id
        left join technicians t on t.id = ti.technician_id
        ${technicianBreakdownClause}
        group by t.id, t.full_name
        order by count(distinct so.id) desc, coalesce(t.full_name, 'Não definido') asc
      `,
      technicianBreakdownParams
    )
  ]);

  const summary = summaryResult.rows[0] ?? {
    total_orders: "0",
    late_orders: "0",
    avg_hours_to_finish: null,
    finished_orders: "0",
    pending_orders: "0"
  };

  return {
    filters: built.normalized,
    summary: {
      totalOrders: Number(summary.total_orders),
      lateOrders: Number(summary.late_orders),
      avgHoursToFinish: Number(summary.avg_hours_to_finish ?? 0),
      finishedOrders: Number(summary.finished_orders),
      pendingOrders: Number(summary.pending_orders)
    },
    byStatus: statusResult.rows.map((row) => ({ label: row.label, total: Number(row.total) })),
    byPriority: priorityResult.rows.map((row) => ({ label: row.label, total: Number(row.total) })),
    byTechnician: technicianResult.rows.map((row) => ({
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
  ["reports-data-v5.1"],
  { revalidate: 300, tags: ["reports"] }
);

export async function getReportsData(filters: ReportFilters): Promise<ReportsData> {
  return getReportsDataCached(JSON.stringify(buildReportFilters(filters).normalized));
}

export { mapReportStatusLabel, formatReportAvgHours };
