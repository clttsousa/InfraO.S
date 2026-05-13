import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { formatInterventionStatus } from "@/lib/interventions";
import { baseOrderSelect, mapOrderRow, type ActivityRow, type DashboardStatRow, type ServiceOrderRow } from "@/lib/server-data/shared";
import type { DashboardData, InterventionStatusDb } from "@/types";


type DashboardInterventionRow = {
  id: string;
  title: string;
  location_name: string;
  start_at: string;
  end_at: string;
  status: InterventionStatusDb;
  points_count: string;
  is_late: boolean;
};

type DashboardInterventionSummaryRow = {
  today: string;
  tomorrow: string;
  late: string;
};

type DashboardCountRow = {
  total: string;
};

function toInterventionTimeLabel(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${formatter.format(new Date(startAt))} às ${formatter.format(new Date(endAt))}`;
}

async function getDashboardDataUncached(): Promise<DashboardData> {
  const [statsResult, dueTodayResult, overdueResult, staleResult, activitiesResult, techSummaryResult, interventionsResult, interventionSummaryResult, dueTodayCountResult, staleCountResult, pendingRemindersResult, failedNotificationRulesResult] = await Promise.all([
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
    `),
    query<DashboardInterventionRow>(`
      select
        ie.id::text,
        ie.title,
        ie.location_name,
        ie.start_at::text,
        ie.end_at::text,
        ie.status,
        coalesce(point_counts.points_count, 0)::text as points_count,
        (ie.status = 'ATRASADO' or (ie.status not in ('CONCLUIDO', 'CANCELADO') and ie.end_at < now())) as is_late
      from infra_events ie
      left join lateral (
        select count(*) as points_count from infra_event_points iep where iep.event_id = ie.id
      ) point_counts on true
      where ie.archived_at is null
        and ie.status not in ('CONCLUIDO', 'CANCELADO')
        and (
          (ie.start_at at time zone '${APP_TIME_ZONE}')::date between (now() at time zone '${APP_TIME_ZONE}')::date and ((now() at time zone '${APP_TIME_ZONE}')::date + interval '1 day')::date
          or ie.end_at < now()
        )
      order by
        case when ie.end_at < now() then 0 else 1 end,
        ie.start_at asc
      limit 6
    `),
    query<DashboardInterventionSummaryRow>(`
      select
        count(*) filter (where status not in ('CONCLUIDO', 'CANCELADO') and (start_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date)::text as today,
        count(*) filter (where status not in ('CONCLUIDO', 'CANCELADO') and (start_at at time zone '${APP_TIME_ZONE}')::date = ((now() at time zone '${APP_TIME_ZONE}')::date + interval '1 day')::date)::text as tomorrow,
        count(*) filter (where status not in ('CONCLUIDO', 'CANCELADO') and (status = 'ATRASADO' or end_at < now()))::text as late
      from infra_events
      where archived_at is null
    `),
    query<DashboardCountRow>(`
      select count(*)::text as total
      from service_orders
      where deadline_at is not null
        and status not in ('FINALIZADA', 'CANCELADA')
        and deadline_at >= now()
        and (deadline_at at time zone '${APP_TIME_ZONE}')::date = (now() at time zone '${APP_TIME_ZONE}')::date
    `),
    query<DashboardCountRow>(`
      select count(*)::text as total
      from service_orders
      where updated_at < now() - interval '24 hours'
        and status not in ('FINALIZADA', 'CANCELADA')
    `),
    query<DashboardCountRow>(`
      select count(*)::text as total
      from reminders r
      join infra_events ie on ie.id = r.event_id
      where r.status = 'pending'
        and ie.archived_at is null
        and ie.status not in ('CONCLUIDO', 'CANCELADO')
    `),
    query<DashboardCountRow>(`
      select count(*)::text as total
      from notification_rule_logs
      where error_message is not null
        and created_at >= now() - interval '24 hours'
    `).catch(() => ({ rows: [{ total: "0" }] } as { rows: DashboardCountRow[] }))
  ]);

  const stats = statsResult.rows[0] ?? {
    abertas: "0",
    acompanhamento: "0",
    pendentes: "0",
    atrasadas: "0",
    finalizadas_hoje: "0"
  };

  const interventionSummaryRow = interventionSummaryResult.rows[0] ?? { today: "0", tomorrow: "0", late: "0" };

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
    })),
    interventions: interventionsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      locationName: row.location_name,
      startAt: formatDateTime(row.start_at),
      endAt: formatDateTime(row.end_at),
      startAtIso: row.start_at,
      endAtIso: row.end_at,
      timeLabel: toInterventionTimeLabel(row.start_at, row.end_at),
      pointsCount: Number(row.points_count ?? 0),
      status: formatInterventionStatus(row.status, Boolean(row.is_late)),
      rawStatus: row.status,
      isLate: Boolean(row.is_late)
    })),
    interventionSummary: {
      today: Number(interventionSummaryRow.today ?? 0),
      tomorrow: Number(interventionSummaryRow.tomorrow ?? 0),
      late: Number(interventionSummaryRow.late ?? 0)
    },
    operationalSummary: {
      overdueOrders: Number(stats.atrasadas ?? 0),
      dueTodayOrders: Number(dueTodayCountResult.rows[0]?.total ?? dueTodayResult.rows.length),
      staleOrders: Number(staleCountResult.rows[0]?.total ?? staleResult.rows.length),
      todayInterventions: Number(interventionSummaryRow.today ?? 0),
      tomorrowInterventions: Number(interventionSummaryRow.tomorrow ?? 0),
      lateInterventions: Number(interventionSummaryRow.late ?? 0),
      criticalNotifications: Number(stats.atrasadas ?? 0) + Number(interventionSummaryRow.late ?? 0),
      pendingReminders: Number(pendingRemindersResult.rows[0]?.total ?? 0),
      failedNotificationRules: Number(failedNotificationRulesResult.rows[0]?.total ?? 0)
    }
  };
}

const getDashboardDataCached = unstable_cache(getDashboardDataUncached, ["dashboard-data-v6.18"], { revalidate: 60, tags: ["dashboard"] });

export async function getDashboardData(): Promise<DashboardData> {
  return getDashboardDataCached();
}
