import type { PoolClient } from "pg";
import { db, query } from "@/lib/db";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";
import { publishRealtimeEvent } from "@/lib/realtime";
import { sendPushForNotifications } from "@/lib/push-notifications";
import type { NotificationEntityType, NotificationSeverity, UserRole } from "@/types";

export type NotificationRuleEventType =
  | "order_unassigned"
  | "order_assigned"
  | "order_due_soon"
  | "order_late"
  | "order_stale"
  | "order_status_changed"
  | "order_reopened"
  | "order_canceled"
  | "intervention_today"
  | "intervention_tomorrow"
  | "intervention_not_concluded"
  | "intervention_canceled"
  | "intervention_reminder_pending"
  | "system_cron_failed"
  | "system_notification_error"
  | "system_login_failed"
  | "system_user_created"
  | "system_role_changed";

export type NotificationRecipientStrategy =
  | "responsible"
  | "technician"
  | "creator"
  | "admins"
  | "operators"
  | "all"
  | `user:${string}`;

export type NotificationChannel = "internal" | "pwa" | "email_future" | "whatsapp_future" | "webhook_future";

export type NotificationRuleItem = {
  id: string;
  name: string;
  description?: string | null;
  eventType: NotificationRuleEventType | string;
  entityType: NotificationEntityType;
  conditions: Record<string, unknown>;
  severity: NotificationSeverity;
  recipientStrategy: NotificationRecipientStrategy[];
  channels: NotificationChannel[];
  template: string;
  actionLabel?: string | null;
  actionUrlTemplate?: string | null;
  cooldownMinutes: number;
  quietHours: Record<string, unknown>;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRuleLogItem = {
  id: string;
  ruleId?: string | null;
  ruleName: string;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  matched: boolean;
  notificationId?: string | null;
  reason?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  receiveInternal: boolean;
  receivePush: boolean;
  muteInfo: boolean;
  keepCriticalEnabled: boolean;
  muteUntil?: string | null;
  quietHours: Record<string, unknown>;
  mutedRuleIds: string[];
};

export const NOTIFICATION_SEVERITY_OPTIONS: Array<{ value: NotificationSeverity; label: string; tone: string }> = [
  { value: "info", label: "Informativa", tone: "info" },
  { value: "attention", label: "Atenção", tone: "warning" },
  { value: "important", label: "Importante", tone: "danger" },
  { value: "critical", label: "Crítica", tone: "danger" }
];

export const NOTIFICATION_EVENT_OPTIONS: Array<{ value: NotificationRuleEventType; label: string; entityType: NotificationEntityType }> = [
  { value: "order_unassigned", label: "O.S. criada sem responsável", entityType: "order" },
  { value: "order_assigned", label: "O.S. atribuída ao usuário", entityType: "order" },
  { value: "order_due_soon", label: "O.S. vencendo em X horas", entityType: "order" },
  { value: "order_late", label: "O.S. atrasada", entityType: "order" },
  { value: "order_stale", label: "O.S. sem atualização há X horas", entityType: "order" },
  { value: "order_status_changed", label: "Status da O.S. alterado", entityType: "order" },
  { value: "order_reopened", label: "O.S. reaberta", entityType: "order" },
  { value: "order_canceled", label: "O.S. cancelada", entityType: "order" },
  { value: "intervention_today", label: "Intervenção hoje", entityType: "intervention" },
  { value: "intervention_tomorrow", label: "Intervenção amanhã", entityType: "intervention" },
  { value: "intervention_not_concluded", label: "Intervenção não concluída", entityType: "intervention" },
  { value: "intervention_canceled", label: "Intervenção cancelada", entityType: "intervention" },
  { value: "intervention_reminder_pending", label: "Lembrete de intervenção pendente", entityType: "intervention" },
  { value: "system_cron_failed", label: "Falha de cron", entityType: "system" },
  { value: "system_notification_error", label: "Erro ao gerar notificação", entityType: "system" },
  { value: "system_login_failed", label: "Tentativa de login falha", entityType: "system" },
  { value: "system_user_created", label: "Usuário criado", entityType: "system" },
  { value: "system_role_changed", label: "Perfil/permissão alterado", entityType: "system" }
];

export const RECIPIENT_STRATEGY_OPTIONS: Array<{ value: NotificationRecipientStrategy; label: string }> = [
  { value: "responsible", label: "Responsável da O.S./intervenção" },
  { value: "technician", label: "Técnico atribuído" },
  { value: "creator", label: "Criador da O.S./registro" },
  { value: "admins", label: "Administradores" },
  { value: "operators", label: "Operadores" },
  { value: "all", label: "Todos da operação" }
];

export const CHANNEL_OPTIONS: Array<{ value: NotificationChannel; label: string }> = [
  { value: "internal", label: "Notificação interna" },
  { value: "pwa", label: "Push PWA" },
  { value: "email_future", label: "E-mail futuro" },
  { value: "whatsapp_future", label: "WhatsApp futuro" },
  { value: "webhook_future", label: "Webhook futuro" }
];

const EVENT_ENTITY: Record<string, NotificationEntityType> = Object.fromEntries(NOTIFICATION_EVENT_OPTIONS.map((item) => [item.value, item.entityType])) as Record<string, NotificationEntityType>;

type RuleRow = {
  id: string;
  name: string;
  description: string | null;
  event_type: string;
  entity_type: NotificationEntityType;
  conditions: Record<string, unknown> | null;
  severity: NotificationSeverity;
  recipient_strategy: unknown;
  channels: unknown;
  template: string;
  action_label: string | null;
  action_url_template: string | null;
  cooldown_minutes: number;
  quiet_hours: Record<string, unknown> | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type LogRow = {
  id: string;
  rule_id: string | null;
  rule_name: string | null;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  matched: boolean;
  notification_id: string | null;
  reason: string | null;
  error_message: string | null;
  created_at: string;
};

type UserOptionRow = { id: string; full_name: string; email: string; role: UserRole; is_active: boolean };

type CandidateRow = {
  entity_id: string | null;
  entity_type: NotificationEntityType;
  title: string;
  message: string;
  action_url: string;
  group_key: string;
  responsible_user_id: string | null;
  technician_user_id: string | null;
  creator_user_id: string | null;
  metadata: Record<string, unknown> | null;
};

type RunResult = {
  ok: true;
  checkedRules: number;
  matched: number;
  notificationsCreated: number;
  skippedByCooldown: number;
  skippedByPreference: number;
  failed: number;
  pushDelivery?: unknown;
};

function normalizeArray<T extends string>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean) as T[];
  return fallback;
}

function mapRule(row: RuleRow): NotificationRuleItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    eventType: row.event_type,
    entityType: row.entity_type,
    conditions: row.conditions ?? {},
    severity: row.severity,
    recipientStrategy: normalizeArray<NotificationRecipientStrategy>(row.recipient_strategy, ["admins"]),
    channels: normalizeArray<NotificationChannel>(row.channels, ["internal"]),
    template: row.template,
    actionLabel: row.action_label,
    actionUrlTemplate: row.action_url_template,
    cooldownMinutes: Number(row.cooldown_minutes ?? 60),
    quietHours: row.quiet_hours ?? {},
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at)
  };
}

function safeConditions(value: FormDataEntryValue | null, fallback: Record<string, unknown>) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : fallback;
  } catch {
    return fallback;
  }
}

export function inferEntityType(eventType: string): NotificationEntityType {
  return EVENT_ENTITY[eventType] ?? "system";
}

export function getDefaultConditionForEvent(eventType: string): Record<string, unknown> {
  switch (eventType) {
    case "order_due_soon":
      return { hours_before: 2 };
    case "order_stale":
      return { hours_without_update: 24 };
    case "intervention_today":
      return { day: "today" };
    case "intervention_tomorrow":
      return { day: "tomorrow" };
    case "intervention_reminder_pending":
      return { status: "pending" };
    default:
      return {};
  }
}

export function parseRuleFormData(formData: FormData, createdBy?: string | null) {
  const eventType = String(formData.get("eventType") ?? "order_late").trim();
  const entityType = inferEntityType(eventType);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "info") as NotificationSeverity;
  const channels = formData.getAll("channels").map(String).filter(Boolean) as NotificationChannel[];
  const recipientStrategy = formData.getAll("recipientStrategy").map(String).filter(Boolean) as NotificationRecipientStrategy[];
  const template = String(formData.get("template") ?? "").trim();
  const actionLabel = String(formData.get("actionLabel") ?? "").trim();
  const actionUrlTemplate = String(formData.get("actionUrlTemplate") ?? "").trim();
  const cooldownMinutes = Math.max(0, Math.min(10080, Math.floor(Number(formData.get("cooldownMinutes") ?? 60) || 60)));
  const isActive = formData.get("isActive") === "on";
  const conditions = safeConditions(formData.get("conditions"), getDefaultConditionForEvent(eventType));

  if (!name) throw new Error("Informe o nome da regra.");
  if (!NOTIFICATION_EVENT_OPTIONS.some((item) => item.value === eventType)) throw new Error("Tipo de evento inválido.");
  if (!NOTIFICATION_SEVERITY_OPTIONS.some((item) => item.value === severity)) throw new Error("Severidade inválida.");
  if (!template) throw new Error("Informe o template da mensagem.");

  return {
    name,
    description: description || null,
    eventType,
    entityType,
    conditions,
    severity,
    recipientStrategy: recipientStrategy.length ? recipientStrategy : ["admins"],
    channels: channels.length ? channels : ["internal"],
    template,
    actionLabel: actionLabel || null,
    actionUrlTemplate: actionUrlTemplate || null,
    cooldownMinutes,
    isActive,
    createdBy: createdBy ?? null
  };
}

export async function getNotificationRulesPageData(userId: string) {
  try {
    const [rulesResult, logsResult, usersResult, prefsResult, statsResult] = await Promise.all([
      query<RuleRow>(`select * from notification_rules order by is_active desc, updated_at desc, name asc`),
      query<LogRow>(`
        select nrl.*, nr.name as rule_name
        from notification_rule_logs nrl
        left join notification_rules nr on nr.id = nrl.rule_id
        order by nrl.created_at desc
        limit 20
      `),
      query<UserOptionRow>(`select id::text, full_name, email, role, is_active from internal_users order by is_active desc, role asc, full_name asc`),
      query<{
        receive_internal: boolean;
        receive_push: boolean;
        mute_info: boolean;
        keep_critical_enabled: boolean;
        mute_until: string | null;
        quiet_hours: Record<string, unknown> | null;
        muted_rule_ids: string[] | null;
      }>(`
        insert into notification_preferences (user_id)
        values ($1::uuid)
        on conflict (user_id) do update set user_id = excluded.user_id
        returning receive_internal, receive_push, mute_info, keep_critical_enabled, mute_until::text, quiet_hours, muted_rule_ids
      `, [userId]),
      query<{ active: string; inactive: string; critical: string; recent_errors: string }>(`
        select
          count(*) filter (where is_active = true)::text as active,
          count(*) filter (where is_active = false)::text as inactive,
          count(*) filter (where severity = 'critical')::text as critical,
          (select count(*)::text from notification_rule_logs where error_message is not null and created_at >= now() - interval '7 days') as recent_errors
        from notification_rules
      `)
    ]);

    const pref = prefsResult.rows[0];
    return {
      migrationReady: true,
      rules: rulesResult.rows.map(mapRule),
      logs: logsResult.rows.map((row): NotificationRuleLogItem => ({
        id: row.id,
        ruleId: row.rule_id,
        ruleName: row.rule_name ?? "Regra removida",
        entityType: row.entity_type,
        entityId: row.entity_id,
        matched: row.matched,
        notificationId: row.notification_id,
        reason: row.reason,
        errorMessage: row.error_message,
        createdAt: formatDateTime(row.created_at)
      })),
      users: usersResult.rows,
      preferences: {
        receiveInternal: pref?.receive_internal ?? true,
        receivePush: pref?.receive_push ?? true,
        muteInfo: pref?.mute_info ?? false,
        keepCriticalEnabled: pref?.keep_critical_enabled ?? true,
        muteUntil: pref?.mute_until ?? null,
        quietHours: pref?.quiet_hours ?? { enabled: false, from: "18:00", to: "08:00" },
        mutedRuleIds: pref?.muted_rule_ids ?? []
      } satisfies NotificationPreferences,
      stats: {
        active: Number(statsResult.rows[0]?.active ?? 0),
        inactive: Number(statsResult.rows[0]?.inactive ?? 0),
        critical: Number(statsResult.rows[0]?.critical ?? 0),
        recentErrors: Number(statsResult.rows[0]?.recent_errors ?? 0)
      }
    };
  } catch (error) {
    return {
      migrationReady: false,
      error: error instanceof Error ? error.message : "Migration de notificações inteligentes ainda não aplicada.",
      rules: [] as NotificationRuleItem[],
      logs: [] as NotificationRuleLogItem[],
      users: [] as UserOptionRow[],
      preferences: {
        receiveInternal: true,
        receivePush: true,
        muteInfo: false,
        keepCriticalEnabled: true,
        muteUntil: null,
        quietHours: { enabled: false, from: "18:00", to: "08:00" },
        mutedRuleIds: []
      } satisfies NotificationPreferences,
      stats: { active: 0, inactive: 0, critical: 0, recentErrors: 0 }
    };
  }
}

function textFromTemplate(template: string, values: Record<string, unknown>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => String(values[key] ?? "—"));
}

function getNumberCondition(conditions: Record<string, unknown>, key: string, fallback: number) {
  const value = Number(conditions[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function getCandidatesForRule(client: PoolClient, rule: NotificationRuleItem): Promise<CandidateRow[]> {
  switch (rule.eventType) {
    case "order_unassigned":
      return (await client.query<CandidateRow>(`
        select
          so.id::text as entity_id,
          'order'::text as entity_type,
          concat('O.S. ', so.order_number, ' sem responsável') as title,
          concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local informado'), ' · ', so.status) as message,
          concat('/orders?selected=', so.id::text) as action_url,
          'orders:unassigned' as group_key,
          so.internal_owner_id::text as responsible_user_id,
          null::text as technician_user_id,
          so.created_by_user_id::text as creator_user_id,
          jsonb_build_object('order_number', so.order_number, 'client_name', coalesce(so.client_name, so.address_text, 'Sem cliente/local'), 'entity_id', so.id::text) as metadata
        from service_orders so
        where so.status not in ('FINALIZADA', 'CANCELADA')
          and so.internal_owner_id is null
          and so.technician_id is null
        order by so.created_at desc
        limit 50
      `)).rows;
    case "order_due_soon": {
      const hours = getNumberCondition(rule.conditions, "hours_before", 2);
      return (await client.query<CandidateRow>(`
        select
          so.id::text as entity_id,
          'order'::text as entity_type,
          concat('O.S. ', so.order_number, ' vencendo') as title,
          concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · prazo ', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/orders?selected=', so.id::text) as action_url,
          'orders:due_soon' as group_key,
          so.internal_owner_id::text as responsible_user_id,
          null::text as technician_user_id,
          so.created_by_user_id::text as creator_user_id,
          jsonb_build_object('order_number', so.order_number, 'client_name', coalesce(so.client_name, so.address_text, 'Sem cliente/local'), 'deadline', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI'), 'hours_before', $1::int, 'entity_id', so.id::text) as metadata
        from service_orders so
        where so.deadline_at is not null
          and so.status not in ('FINALIZADA', 'CANCELADA')
          and so.deadline_at >= now()
          and so.deadline_at <= now() + ($1::text || ' hours')::interval
        order by so.deadline_at asc
        limit 80
      `, [hours])).rows;
    }
    case "order_late":
      return (await client.query<CandidateRow>(`
        select
          so.id::text as entity_id,
          'order'::text as entity_type,
          concat('O.S. ', so.order_number, ' atrasada') as title,
          concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · prazo ', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/orders?selected=', so.id::text) as action_url,
          'orders:late' as group_key,
          so.internal_owner_id::text as responsible_user_id,
          null::text as technician_user_id,
          so.created_by_user_id::text as creator_user_id,
          jsonb_build_object('order_number', so.order_number, 'client_name', coalesce(so.client_name, so.address_text, 'Sem cliente/local'), 'deadline', to_char(so.deadline_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI'), 'entity_id', so.id::text) as metadata
        from service_orders so
        where so.deadline_at is not null
          and so.status not in ('FINALIZADA', 'CANCELADA')
          and so.deadline_at < now()
        order by so.deadline_at asc
        limit 80
      `)).rows;
    case "order_stale": {
      const hours = getNumberCondition(rule.conditions, "hours_without_update", 24);
      return (await client.query<CandidateRow>(`
        select
          so.id::text as entity_id,
          'order'::text as entity_type,
          concat('O.S. ', so.order_number, ' sem atualização') as title,
          concat(coalesce(so.client_name, so.address_text, 'Sem cliente/local'), ' · última mudança ', to_char(so.updated_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/orders?selected=', so.id::text) as action_url,
          'orders:stale' as group_key,
          so.internal_owner_id::text as responsible_user_id,
          null::text as technician_user_id,
          so.created_by_user_id::text as creator_user_id,
          jsonb_build_object('order_number', so.order_number, 'client_name', coalesce(so.client_name, so.address_text, 'Sem cliente/local'), 'hours_without_update', $1::int, 'entity_id', so.id::text) as metadata
        from service_orders so
        where so.status not in ('FINALIZADA', 'CANCELADA')
          and so.updated_at < now() - ($1::text || ' hours')::interval
        order by so.updated_at asc
        limit 80
      `, [hours])).rows;
    }
    case "intervention_today":
    case "intervention_tomorrow": {
      const dayOffset = rule.eventType === "intervention_tomorrow" ? 1 : 0;
      return (await client.query<CandidateRow>(`
        select
          ie.id::text as entity_id,
          'intervention'::text as entity_type,
          ie.title,
          concat(ie.location_name, ' · ', to_char(ie.start_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/intervencoes?selected=', ie.id::text) as action_url,
          case when $1::int = 1 then 'interventions:tomorrow' else 'interventions:today' end as group_key,
          ie.responsible_user_id::text as responsible_user_id,
          null::text as technician_user_id,
          ie.created_by::text as creator_user_id,
          jsonb_build_object('title', ie.title, 'location_name', ie.location_name, 'entity_id', ie.id::text) as metadata
        from infra_events ie
        where ie.archived_at is null
          and ie.status not in ('CONCLUIDO', 'CANCELADO')
          and (ie.start_at at time zone '${APP_TIME_ZONE}')::date = ((now() at time zone '${APP_TIME_ZONE}')::date + ($1::int || ' days')::interval)::date
        order by ie.start_at asc
        limit 80
      `, [dayOffset])).rows;
    }
    case "intervention_not_concluded":
      return (await client.query<CandidateRow>(`
        select
          ie.id::text as entity_id,
          'intervention'::text as entity_type,
          concat('Intervenção não concluída: ', ie.title) as title,
          concat(ie.location_name, ' · janela encerrada ', to_char(ie.end_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/intervencoes?selected=', ie.id::text) as action_url,
          'interventions:not_concluded' as group_key,
          ie.responsible_user_id::text as responsible_user_id,
          null::text as technician_user_id,
          ie.created_by::text as creator_user_id,
          jsonb_build_object('title', ie.title, 'location_name', ie.location_name, 'entity_id', ie.id::text) as metadata
        from infra_events ie
        where ie.archived_at is null
          and ie.status not in ('CONCLUIDO', 'CANCELADO')
          and ie.end_at < now()
        order by ie.end_at asc
        limit 80
      `)).rows;
    case "intervention_reminder_pending":
      return (await client.query<CandidateRow>(`
        select
          ie.id::text as entity_id,
          'intervention'::text as entity_type,
          concat('Lembrete pendente: ', ie.title) as title,
          concat(ie.location_name, ' · lembrete ', to_char(r.remind_at at time zone '${APP_TIME_ZONE}', 'DD/MM/YYYY HH24:MI')) as message,
          concat('/intervencoes?selected=', ie.id::text) as action_url,
          'interventions:reminders_pending' as group_key,
          ie.responsible_user_id::text as responsible_user_id,
          null::text as technician_user_id,
          ie.created_by::text as creator_user_id,
          jsonb_build_object('title', ie.title, 'location_name', ie.location_name, 'entity_id', ie.id::text) as metadata
        from reminders r
        join infra_events ie on ie.id = r.event_id
        where r.status = 'pending'
          and r.remind_at <= now()
          and ie.archived_at is null
          and ie.status not in ('CONCLUIDO', 'CANCELADO')
        order by r.remind_at asc
        limit 80
      `)).rows;
    case "system_cron_failed":
      return (await client.query<CandidateRow>(`
        select
          null::text as entity_id,
          'system'::text as entity_type,
          'Falha em rotina do InfraOS' as title,
          concat('Existe lembrete com falha: ', coalesce(r.error_message, 'sem detalhe')) as message,
          '/settings' as action_url,
          'system:cron_failed' as group_key,
          null::text as responsible_user_id,
          null::text as technician_user_id,
          null::text as creator_user_id,
          jsonb_build_object('reason', coalesce(r.error_message, 'Falha sem detalhe')) as metadata
        from reminders r
        where r.status = 'failed'
          and r.processed_at >= now() - interval '7 days'
        order by r.processed_at desc nulls last
        limit 20
      `)).rows;
    default:
      return [];
  }
}

async function resolveRecipients(client: PoolClient, rule: NotificationRuleItem, candidate: CandidateRow) {
  const ids = new Set<string>();
  const strategies = rule.recipientStrategy.length ? rule.recipientStrategy : ["admins"];

  async function addByRole(role: UserRole) {
    const rows = (await client.query<{ id: string }>(`select id::text from internal_users where role = $1 and is_active = true`, [role])).rows;
    rows.forEach((row) => ids.add(row.id));
  }

  for (const strategy of strategies) {
    if (strategy === "responsible" && candidate.responsible_user_id) ids.add(candidate.responsible_user_id);
    if (strategy === "technician" && candidate.technician_user_id) ids.add(candidate.technician_user_id);
    if (strategy === "creator" && candidate.creator_user_id) ids.add(candidate.creator_user_id);
    if (strategy === "admins") await addByRole("ADMIN");
    if (strategy === "operators") await addByRole("OPERADOR");
    if (strategy === "all") {
      const rows = (await client.query<{ id: string }>(`select id::text from internal_users where is_active = true`)).rows;
      rows.forEach((row) => ids.add(row.id));
    }
    if (strategy.startsWith("user:")) ids.add(strategy.slice(5));
  }

  return [...ids];
}

async function shouldSkipByPreference(client: PoolClient, userId: string, rule: NotificationRuleItem) {
  const pref = (await client.query<{
    receive_internal: boolean;
    mute_info: boolean;
    keep_critical_enabled: boolean;
    mute_until: string | null;
    muted_rule_ids: string[] | null;
  }>(`
    insert into notification_preferences (user_id)
    values ($1::uuid)
    on conflict (user_id) do update set user_id = excluded.user_id
    returning receive_internal, mute_info, keep_critical_enabled, mute_until::text, muted_rule_ids
  `, [userId])).rows[0];

  const isCritical = rule.severity === "critical";
  if (isCritical && pref?.keep_critical_enabled) return false;
  if (pref && !pref.receive_internal) return true;
  if (pref?.mute_info && rule.severity === "info") return true;
  if (pref?.mute_until && new Date(pref.mute_until).getTime() > Date.now()) return true;
  if ((pref?.muted_rule_ids ?? []).includes(rule.id)) return true;
  return false;
}

function getCooldownBucket(minutes: number) {
  if (minutes <= 0) return String(Date.now());
  const ms = minutes * 60 * 1000;
  return String(Math.floor(Date.now() / ms));
}

async function logRule(client: PoolClient, input: { ruleId: string; entityType?: NotificationEntityType | null; entityId?: string | null; matched: boolean; notificationId?: string | null; reason?: string | null; errorMessage?: string | null }) {
  await client.query(
    `insert into notification_rule_logs (rule_id, entity_type, entity_id, matched, notification_id, reason, error_message)
     values ($1::uuid, $2, $3::uuid, $4, $5::uuid, $6, left($7, 600))`,
    [input.ruleId, input.entityType ?? null, input.entityId ?? null, input.matched, input.notificationId ?? null, input.reason ?? null, input.errorMessage ?? null]
  );
}

export async function runNotificationRulesOnce(): Promise<RunResult> {
  const client = await db.connect();
  const createdNotificationIds: string[] = [];
  let checkedRules = 0;
  let matched = 0;
  let notificationsCreated = 0;
  let skippedByCooldown = 0;
  let skippedByPreference = 0;
  let failed = 0;
  let committed = false;

  try {
    await client.query("begin");
    const rules = (await client.query<RuleRow>(`select * from notification_rules where is_active = true order by severity desc, updated_at desc limit 100`)).rows.map(mapRule);
    checkedRules = rules.length;

    for (const rule of rules) {
      try {
        const candidates = await getCandidatesForRule(client, rule);
        if (!candidates.length) {
          await logRule(client, { ruleId: rule.id, entityType: rule.entityType, matched: false, reason: "Nenhuma entidade encontrada para a regra." });
          continue;
        }

        for (const candidate of candidates) {
          const recipients = await resolveRecipients(client, rule, candidate);
          if (!recipients.length) {
            await logRule(client, { ruleId: rule.id, entityType: candidate.entity_type, entityId: candidate.entity_id, matched: true, reason: "Regra encontrou entidade, mas sem destinatário ativo." });
            matched += 1;
            continue;
          }

          const metadata = candidate.metadata ?? {};
          const title = candidate.title;
          const message = textFromTemplate(rule.template, { ...metadata, title: candidate.title, entity_id: candidate.entity_id, reason: candidate.message });
          const actionUrl = textFromTemplate(rule.actionUrlTemplate || candidate.action_url, { ...metadata, entity_id: candidate.entity_id });
          const bucket = getCooldownBucket(rule.cooldownMinutes);
          const baseKey = `rule:${rule.id}:${candidate.entity_type}:${candidate.entity_id ?? "system"}:${bucket}`;

          for (const userId of recipients) {
            if (await shouldSkipByPreference(client, userId, rule)) {
              skippedByPreference += 1;
              await client.query(
                `insert into notification_deliveries (user_id, rule_id, channel, status, error_message)
                 values ($1::uuid, $2::uuid, 'internal', 'muted', 'Ignorado por preferência do usuário.')`,
                [userId, rule.id]
              );
              continue;
            }

            const inserted = await client.query<{ id: string }>(
              `insert into app_notifications (user_id, title, message, type, related_event_id, notification_key, severity, entity_type, entity_id, action_url, action_label, group_key, rule_id, metadata)
               values ($1::uuid, $2, $3, $4, case when $5 = 'intervention' then $6::uuid else null end, $7, $8, $5, $6::uuid, $9, $10, $11, $12::uuid, $13::jsonb)
               on conflict (user_id, notification_key) do nothing
               returning id::text`,
              [userId, title || candidate.title, message || candidate.message, rule.eventType, candidate.entity_type, candidate.entity_id, baseKey, rule.severity, actionUrl, rule.actionLabel ?? "Abrir", candidate.group_key, rule.id, JSON.stringify(metadata)]
            );

            if (inserted.rows[0]) {
              const notificationId = inserted.rows[0].id;
              createdNotificationIds.push(notificationId);
              notificationsCreated += 1;
              await client.query(
                `insert into notification_deliveries (notification_id, user_id, rule_id, channel, status, sent_at)
                 values ($1::uuid, $2::uuid, $3::uuid, 'internal', 'sent', now())`,
                [notificationId, userId, rule.id]
              );
              await logRule(client, { ruleId: rule.id, entityType: candidate.entity_type, entityId: candidate.entity_id, matched: true, notificationId, reason: "Notificação criada pelo motor de regras." });
              publishRealtimeEvent({ type: "notification.created", scope: "notifications", entityId: notificationId, payload: { sourceType: "smart_rule", ruleId: rule.id, title: title || candidate.title, userId } });
            } else {
              skippedByCooldown += 1;
              await client.query(
                `insert into notification_deliveries (user_id, rule_id, channel, status, error_message)
                 values ($1::uuid, $2::uuid, 'internal', 'cooldown', 'Ignorado por janela de cooldown/idempotência.')`,
                [userId, rule.id]
              );
              await logRule(client, { ruleId: rule.id, entityType: candidate.entity_type, entityId: candidate.entity_id, matched: true, reason: "Ignorado por cooldown/idempotência." });
            }
          }
          matched += 1;
        }
      } catch (error) {
        failed += 1;
        await logRule(client, { ruleId: rule.id, entityType: rule.entityType, matched: false, errorMessage: error instanceof Error ? error.message : "Falha ao executar regra." });
      }
    }

    await client.query("commit");
    committed = true;

    const pushDelivery = createdNotificationIds.length
      ? await sendPushForNotifications(createdNotificationIds).catch((error) => ({ sent: 0, failed: createdNotificationIds.length, skipped: 0, error: error instanceof Error ? error.message : "Falha ao entregar push." }))
      : { sent: 0, failed: 0, skipped: 0 };

    return { ok: true, checkedRules, matched, notificationsCreated, skippedByCooldown, skippedByPreference, failed, pushDelivery };
  } catch (error) {
    if (!committed) await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
