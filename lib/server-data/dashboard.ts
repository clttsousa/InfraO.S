import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { baseOrderSelect, mapOrderRow, type ActivityRow, type DashboardStatRow, type ServiceOrderRow } from "@/lib/server-data/shared";
import type { DashboardData } from "@/types";

async function getDashboardDataUncached(): Promise<DashboardData> {
  const [statsResult, trendResult, dueTodayResult, overdueResult, staleResult, activitiesResult, techSummaryResult] = await Promise.all([
    query<DashboardStatRow>(`
      select
        count(*) filter (where status = 'ABERTA')::text as abertas,
        count(*) filter (where status = 'EM_ACOMPANHAMENTO')::text as acompanhamento,
        count(*) filter (where status = 'PENDENTE')::text as pendentes,
        count(*) filter (
          where deadline_at is not null and status not in ('FINALIZADA', 'CANCELADA') and deadline_at < now()
        )::text as atrasadas,
        count(*) filter (
          where status = 'FINALIZADA' and (finalized_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
        )::text as finalizadas_hoje
      from service_orders
    `),
    query<{
      opened_24h: string;
      opened_prev_24h: string;
      finished_24h: string;
      finished_prev_24h: string;
    }>(`
      select
        count(*) filter (where created_at >= now() - interval '24 hours')::text as opened_24h,
        count(*) filter (where created_at >= now() - interval '48 hours' and created_at < now() - interval '24 hours')::text as opened_prev_24h,
        count(*) filter (where finalized_at is not null and finalized_at >= now() - interval '24 hours')::text as finished_24h,
        count(*) filter (where finalized_at is not null and finalized_at >= now() - interval '48 hours' and finalized_at < now() - interval '24 hours')::text as finished_prev_24h
      from service_orders
    `),
    query<ServiceOrderRow>(`
      ${baseOrderSelect}
      where so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at >= now() and (so.deadline_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
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

  const stats = statsResult.rows[0] ?? {
    abertas: "0",
    acompanhamento: "0",
    pendentes: "0",
    atrasadas: "0",
    finalizadas_hoje: "0"
  };
  const trend = trendResult.rows[0] ?? {
    opened_24h: "0",
    opened_prev_24h: "0",
    finished_24h: "0",
    finished_prev_24h: "0"
  };

  return {
    stats: {
      abertas: Number(stats.abertas),
      acompanhamento: Number(stats.acompanhamento),
      pendentes: Number(stats.pendentes),
      atrasadas: Number(stats.atrasadas),
      finalizadasHoje: Number(stats.finalizadas_hoje)
    },
    insights: {
      opened24h: Number(trend.opened_24h),
      openedPrevious24h: Number(trend.opened_prev_24h),
      finished24h: Number(trend.finished_24h),
      finishedPrevious24h: Number(trend.finished_prev_24h)
    },
    dueToday: dueTodayResult.rows.map(mapOrderRow),
    overdue: overdueResult.rows.map(mapOrderRow),
    stale: staleResult.rows.map(mapOrderRow),
    activities: activitiesResult.rows.map((row) => ({
      id: row.id,
      actor: row.actor_name ?? "Sistema",
      description: row.note ? row.action_type : row.action_type,
      when: formatDateTime(row.created_at)
    })),
    technicianSummary: techSummaryResult.rows.map((row) => ({
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

const getDashboardDataCached = unstable_cache(getDashboardDataUncached, ["dashboard-data-v3.7"], { revalidate: 60, tags: ["dashboard"] });

export async function getDashboardData(): Promise<DashboardData> {
  return getDashboardDataCached();
}
