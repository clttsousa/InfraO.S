import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { PRESENCE_AWAY_WINDOW_MINUTES, PRESENCE_ONLINE_WINDOW_MINUTES, getPresenceLabel } from "@/lib/presence";
import { isUuid } from "@/lib/validation";
import type { InternalUserItem, TechnicianItem } from "@/types";

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
      count(distinct so.id) filter (where so.status not in ('FINALIZADA', 'CANCELADA'))::text as abertas,
      count(distinct so.id) filter (
        where so.deadline_at is not null and so.status not in ('FINALIZADA', 'CANCELADA') and so.deadline_at < now()
      )::text as atrasadas,
      count(distinct so.id) filter (where so.status = 'PENDENTE')::text as pendentes,
      count(distinct so.id) filter (where so.status = 'FINALIZADA')::text as finalizadas
    from technicians t
    left join service_orders so on (
      so.technician_id = t.id
      or exists (
        select 1
        from service_order_technicians sot
        where sot.service_order_id = so.id
          and sot.technician_id = t.id
          and sot.role = 'SUPPORT'
      )
    )
    group by t.id, t.full_name, t.phone, t.is_active
    order by t.full_name asc
  `);

  return result.rows.map((row) => ({
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
    last_seen_at: string | null;
    presence_status: "ONLINE" | "AUSENTE" | "OFFLINE";
    created_at: string;
  }>(`
    select
      id,
      full_name,
      email,
      role,
      is_active,
      last_login_at,
      last_seen_at,
      case
        when is_active = false then 'OFFLINE'
        when last_seen_at is null then 'OFFLINE'
        when last_seen_at >= now() - make_interval(mins => ${PRESENCE_ONLINE_WINDOW_MINUTES}) then 'ONLINE'
        when last_seen_at >= now() - make_interval(mins => ${PRESENCE_AWAY_WINDOW_MINUTES}) then 'AUSENTE'
        else 'OFFLINE'
      end as presence_status,
      created_at
    from internal_users
    order by last_seen_at desc nulls last, last_login_at desc nulls last, full_name asc
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    active: row.is_active,
    lastAccess: formatDateTime(row.last_login_at),
    lastLogin: formatDateTime(row.last_login_at),
    lastActivity: formatDateTime(row.last_seen_at),
    lastLoginAtIso: row.last_login_at,
    lastSeenAtIso: row.last_seen_at,
    presenceStatus: row.presence_status,
    presenceLabel: getPresenceLabel(row.presence_status),
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
