import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { PRESENCE_AWAY_WINDOW_MINUTES, PRESENCE_ONLINE_WINDOW_MINUTES, getPresenceLabel } from "@/lib/presence";
import { isUuid } from "@/lib/validation";
import type { InternalUserFilters, InternalUserItem, InternalUsersListResult, PresenceStatus, TechnicianItem } from "@/types";

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

type InternalUserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "OPERADOR";
  is_active: boolean;
  last_login_at: string | null;
  last_seen_at: string | null;
  presence_status: PresenceStatus;
  created_at: string;
};

const INTERNAL_USER_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_INTERNAL_USER_PAGE_SIZE = 25;

function sanitizeUserPageSize(value: string | number | undefined) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_INTERNAL_USER_PAGE_SIZE;
  return INTERNAL_USER_PAGE_SIZE_OPTIONS.includes(normalized as (typeof INTERNAL_USER_PAGE_SIZE_OPTIONS)[number]) ? normalized : DEFAULT_INTERNAL_USER_PAGE_SIZE;
}

function getPositivePage(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function mapInternalUserRow(row: InternalUserRow): InternalUserItem {
  return {
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
  };
}

function internalUserPresenceCase(alias = "iu") {
  return `case
    when ${alias}.is_active = false then 'OFFLINE'
    when ${alias}.last_seen_at is null then 'OFFLINE'
    when ${alias}.last_seen_at >= now() - make_interval(mins => ${PRESENCE_ONLINE_WINDOW_MINUTES}) then 'ONLINE'
    when ${alias}.last_seen_at >= now() - make_interval(mins => ${PRESENCE_AWAY_WINDOW_MINUTES}) then 'AUSENTE'
    else 'OFFLINE'
  end`;
}

function buildInternalUserFilters(filters: InternalUserFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  const accountStatus = filters.accountStatus ?? "all";
  const role = filters.role ?? "all";
  const presence = filters.presence ?? "all";

  if (filters.q?.trim()) {
    params.push(`%${filters.q.trim()}%`);
    const index = params.length;
    where.push(`(u.full_name ilike $${index} or u.email ilike $${index} or u.role::text ilike $${index})`);
  }

  if (accountStatus === "active") where.push("u.is_active = true");
  if (accountStatus === "inactive") where.push("u.is_active = false");
  if (role === "ADMIN" || role === "OPERADOR") {
    params.push(role);
    where.push(`u.role = $${params.length}`);
  }
  if (presence === "ONLINE" || presence === "AUSENTE" || presence === "OFFLINE") {
    params.push(presence);
    where.push(`u.presence_status = $${params.length}`);
  }

  return { clause: where.length ? `where ${where.join(" and ")}` : "", params };
}

export async function getInternalUsersPageData(filters: InternalUserFilters = {}): Promise<InternalUsersListResult> {
  const pageSize = sanitizeUserPageSize(filters.pageSize);
  const requestedPage = getPositivePage(filters.page);
  const built = buildInternalUserFilters(filters);
  const presenceCase = internalUserPresenceCase("iu");
  const baseCte = `
    with user_rows as (
      select
        iu.id,
        iu.full_name,
        iu.email,
        iu.role,
        iu.is_active,
        iu.last_login_at,
        iu.last_seen_at,
        ${presenceCase} as presence_status,
        iu.created_at
      from internal_users iu
    )
  `;

  const [summaryResult, countResult] = await Promise.all([
    query<{
      total: string;
      active: string;
      admins: string;
      inactive: string;
      online: string;
      away: string;
    }>(`
      select
        count(*)::text as total,
        count(*) filter (where iu.is_active = true)::text as active,
        count(*) filter (where iu.role = 'ADMIN')::text as admins,
        count(*) filter (where iu.is_active = false)::text as inactive,
        count(*) filter (where ${presenceCase} = 'ONLINE')::text as online,
        count(*) filter (where ${presenceCase} = 'AUSENTE')::text as away
      from internal_users iu
    `),
    query<{ total: string }>(
      `
        ${baseCte}
        select count(*)::text as total
        from user_rows u
        ${built.clause}
      `,
      built.params
    )
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const rowsResult = await query<InternalUserRow>(
    `
      ${baseCte}
      select *
      from user_rows u
      ${built.clause}
      order by u.last_seen_at desc nulls last, u.last_login_at desc nulls last, u.full_name asc
      limit $${built.params.length + 1} offset $${built.params.length + 2}
    `,
    [...built.params, pageSize, offset]
  );

  const summaryRow = summaryResult.rows[0];
  return {
    items: rowsResult.rows.map(mapInternalUserRow),
    total,
    page,
    pageSize,
    totalPages,
    summary: {
      total: Number(summaryRow?.total ?? 0),
      active: Number(summaryRow?.active ?? 0),
      admins: Number(summaryRow?.admins ?? 0),
      inactive: Number(summaryRow?.inactive ?? 0),
      online: Number(summaryRow?.online ?? 0),
      away: Number(summaryRow?.away ?? 0)
    }
  };
}

export async function getInternalUsers(): Promise<InternalUserItem[]> {
  const result = await query<InternalUserRow>(`
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

  return result.rows.map(mapInternalUserRow);
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
