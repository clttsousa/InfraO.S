import Link from "next/link";
import { Activity, AlertTriangle, BellRing, CheckCircle2, Clock3, DatabaseZap, Play, Plus, Radio, ShieldCheck, SlidersHorizontal, UsersRound } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FeedbackMessage, PageHeader, SelectInput, Surface, TextAreaInput, TextInput } from "@/components/shared/ui";
import { createNotificationRuleAction, runNotificationRulesAction, toggleNotificationRuleAction, updateNotificationPreferencesAction, updateNotificationRuleAction } from "@/app/(protected)/settings/notifications/actions";
import { CHANNEL_OPTIONS, NOTIFICATION_EVENT_OPTIONS, NOTIFICATION_SEVERITY_OPTIONS, RECIPIENT_STRATEGY_OPTIONS, getDefaultConditionForEvent, getNotificationRulesPageData } from "@/lib/notifications/rule-engine";
import { requireAdmin } from "@/lib/session";
import type { NotificationRuleItem } from "@/lib/notifications/rule-engine";

export const dynamic = "force-dynamic";

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function SeverityBadge({ severity }: { severity: string }) {
  const meta = {
    info: "badge-primary",
    attention: "badge-warning",
    important: "badge-danger",
    critical: "badge-danger"
  }[severity] ?? "badge-neutral";
  const label = NOTIFICATION_SEVERITY_OPTIONS.find((item) => item.value === severity)?.label ?? severity;
  return <span className={`badge-base ${meta}`}>{label}</span>;
}

function RuleForm({ rule, mode }: { rule?: NotificationRuleItem; mode: "create" | "edit" }) {
  const eventType = rule?.eventType ?? "order_late";
  const defaultConditions = JSON.stringify(rule?.conditions ?? getDefaultConditionForEvent(eventType), null, 2);
  const action = mode === "create" ? createNotificationRuleAction : updateNotificationRuleAction;

  return (
    <form action={action} className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      <div className="xl:col-span-4">
        <TextInput label="Nome" name="name" defaultValue={rule?.name ?? ""} placeholder="Ex.: O.S. vencendo em 2 horas" required />
      </div>
      <div className="xl:col-span-4">
        <SelectInput label="Tipo de evento" name="eventType" defaultValue={eventType} options={NOTIFICATION_EVENT_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
      </div>
      <div className="xl:col-span-2">
        <SelectInput label="Severidade" name="severity" defaultValue={rule?.severity ?? "important"} options={NOTIFICATION_SEVERITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
      </div>
      <div className="xl:col-span-2">
        <TextInput label="Cooldown" name="cooldownMinutes" type="number" min={0} max={10080} defaultValue={String(rule?.cooldownMinutes ?? 60)} description="Minutos" />
      </div>
      <div className="xl:col-span-6">
        <TextInput label="Descrição" name="description" defaultValue={rule?.description ?? ""} placeholder="Explique quando a regra deve ser usada" />
      </div>
      <div className="xl:col-span-6">
        <TextInput label="Ação / URL" name="actionUrlTemplate" defaultValue={rule?.actionUrlTemplate ?? "/notifications"} placeholder="/orders?selected={{entity_id}}" description="Aceita variáveis como {{entity_id}}." />
      </div>
      <div className="xl:col-span-8">
        <TextAreaInput label="Template da mensagem" name="template" rows={3} defaultValue={rule?.template ?? "Atenção: {{title}} em {{location_name}}."} required description="Variáveis úteis: {{order_number}}, {{client_name}}, {{title}}, {{location_name}}, {{deadline}}, {{entity_id}}, {{reason}}." />
      </div>
      <div className="xl:col-span-4">
        <TextInput label="Rótulo da ação" name="actionLabel" defaultValue={rule?.actionLabel ?? "Abrir"} placeholder="Ver O.S." />
        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-primary)]">
          <input type="checkbox" name="isActive" defaultChecked={rule?.isActive ?? true} />
          Regra ativa
        </label>
      </div>
      <div className="xl:col-span-6">
        <div className="app-surface-muted rounded-[var(--radius-control)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Destinatários</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RECIPIENT_STRATEGY_OPTIONS.map((item) => (
              <label key={item.value} className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" name="recipientStrategy" value={item.value} defaultChecked={(rule?.recipientStrategy ?? ["admins"]).includes(item.value)} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="xl:col-span-6">
        <div className="app-surface-muted rounded-[var(--radius-control)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Canais</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CHANNEL_OPTIONS.map((item) => (
              <label key={item.value} className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-secondary)]">
                <input type="checkbox" name="channels" value={item.value} defaultChecked={(rule?.channels ?? ["internal"]).includes(item.value)} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="xl:col-span-12">
        <TextAreaInput label="Condições JSON" name="conditions" rows={4} defaultValue={defaultConditions} description='Exemplos: {"hours_before":2}, {"hours_without_update":24}, {"day":"tomorrow"}.' />
      </div>
      <div className="xl:col-span-12 flex flex-wrap justify-end gap-2">
        <button type="submit" className="btn-base btn-primary btn-md">{mode === "create" ? <Plus className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{mode === "create" ? "Criar regra" : "Salvar regra"}</button>
      </div>
    </form>
  );
}

function RuleCard({ rule }: { rule: NotificationRuleItem }) {
  return (
    <details className="rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">{rule.name}</h3>
            <SeverityBadge severity={rule.severity} />
            <span className={`badge-base ${rule.isActive ? "badge-success" : "badge-neutral"}`}>{rule.isActive ? "Ativa" : "Inativa"}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{rule.description || NOTIFICATION_EVENT_OPTIONS.find((item) => item.value === rule.eventType)?.label || rule.eventType}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>{rule.entityType}</span>
          <span>Cooldown {rule.cooldownMinutes}min</span>
        </div>
      </summary>
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <div className="mb-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div className="app-surface-muted rounded-xl px-3 py-2"><span className="font-semibold text-[var(--text-primary)]">Evento:</span> {rule.eventType}</div>
          <div className="app-surface-muted rounded-xl px-3 py-2"><span className="font-semibold text-[var(--text-primary)]">Destinos:</span> {rule.recipientStrategy.join(", ")}</div>
          <div className="app-surface-muted rounded-xl px-3 py-2"><span className="font-semibold text-[var(--text-primary)]">Canais:</span> {rule.channels.join(", ")}</div>
        </div>
        <RuleForm rule={rule} mode="edit" />
        <form action={toggleNotificationRuleAction} className="mt-3 flex justify-end">
          <input type="hidden" name="id" value={rule.id} />
          <input type="hidden" name="nextActive" value={String(!rule.isActive)} />
          <button type="submit" className="btn-base btn-secondary btn-sm">{rule.isActive ? "Desativar regra" : "Ativar regra"}</button>
        </form>
      </div>
    </details>
  );
}

export default async function NotificationSettingsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdmin();
  const params = (await searchParams) ?? {};
  const success = getStringParam(params.success);
  const error = getStringParam(params.error);
  const data = await getNotificationRulesPageData(session.id);
  const quietHours = data.preferences.quietHours as { enabled?: boolean; from?: string; to?: string };
  const muteUntilLocal = data.preferences.muteUntil ? data.preferences.muteUntil.slice(0, 16) : "";

  return (
    <div className="settings-notifications-page app-content-fluid space-y-5 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Configurações", href: "/settings" }, { label: "Notificações inteligentes" }]} showHome />
      <Surface className="p-5">
        <PageHeader
          eyebrow="V6.18.0"
          title="Motor de Notificações Inteligentes"
          description="Configure regras operacionais com severidade, destinatários, canais, cooldown, preferências por usuário, agrupamento e logs de execução."
          actions={<><Link href="/notifications" className="btn-base btn-secondary btn-md"><BellRing className="h-4 w-4" />Central</Link><form action={runNotificationRulesAction}><button type="submit" className="btn-base btn-primary btn-md"><Play className="h-4 w-4" />Executar motor</button></form></>}
        />
        {success ? <FeedbackMessage type="success">{success}</FeedbackMessage> : null}
        {error ? <FeedbackMessage type="error">{error}</FeedbackMessage> : null}
        {!data.migrationReady ? <FeedbackMessage type="warning" title="Migration pendente">Aplique <strong>database/21_notification_rules.sql</strong> no Supabase antes de usar o motor. Detalhe técnico: {data.error}</FeedbackMessage> : null}
      </Surface>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Surface className="p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"><Radio className="h-4 w-4" />Ativas</div><div className="app-number mt-2 text-2xl font-semibold">{data.stats.active}</div></Surface>
        <Surface className="p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"><Clock3 className="h-4 w-4" />Inativas</div><div className="app-number mt-2 text-2xl font-semibold">{data.stats.inactive}</div></Surface>
        <Surface className="p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"><AlertTriangle className="h-4 w-4" />Críticas</div><div className="app-number mt-2 text-2xl font-semibold">{data.stats.critical}</div></Surface>
        <Surface className="p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]"><DatabaseZap className="h-4 w-4" />Erros 7d</div><div className="app-number mt-2 text-2xl font-semibold">{data.stats.recentErrors}</div></Surface>
      </div>

      <Surface className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[var(--primary)]" />
          <div><h2 className="app-title text-lg font-semibold">Nova regra</h2><p className="text-sm text-[var(--text-secondary)]">Comece com regras simples e use cooldown para evitar spam operacional.</p></div>
        </div>
        <RuleForm mode="create" />
      </Surface>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
        <Surface className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[var(--primary)]" />
            <div><h2 className="app-title text-lg font-semibold">Regras configuradas</h2><p className="text-sm text-[var(--text-secondary)]">Editar, ativar/desativar e revisar destinatários por regra.</p></div>
          </div>
          <div className="space-y-3">
            {data.rules.length ? data.rules.map((rule) => <RuleCard key={rule.id} rule={rule} />) : <div className="app-surface-muted rounded-[var(--radius-panel)] p-5 text-sm text-[var(--text-secondary)]">Nenhuma regra cadastrada ainda.</div>}
          </div>
        </Surface>

        <div className="space-y-5">
          <Surface className="p-5">
            <div className="mb-4 flex items-center gap-2"><UsersRound className="h-5 w-5 text-[var(--primary)]" /><h2 className="app-title text-lg font-semibold">Minhas preferências</h2></div>
            <form action={updateNotificationPreferencesAction} className="space-y-3">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" name="receiveInternal" defaultChecked={data.preferences.receiveInternal} />Receber notificações internas</label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" name="receivePush" defaultChecked={data.preferences.receivePush} />Receber Push PWA quando disponível</label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" name="muteInfo" defaultChecked={data.preferences.muteInfo} />Silenciar informativas</label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm"><input type="checkbox" name="keepCriticalEnabled" defaultChecked={data.preferences.keepCriticalEnabled} />Manter críticas sempre ativas</label>
              <TextInput label="Pausar até" name="muteUntil" type="datetime-local" defaultValue={muteUntilLocal} />
              <div className="app-surface-muted rounded-xl p-3">
                <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="quietEnabled" defaultChecked={Boolean(quietHours.enabled)} />Horário silencioso simples</label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <TextInput label="De" name="quietFrom" type="time" defaultValue={quietHours.from ?? "18:00"} />
                  <TextInput label="Até" name="quietTo" type="time" defaultValue={quietHours.to ?? "08:00"} />
                </div>
              </div>
              <button type="submit" className="btn-base btn-primary btn-md w-full"><ShieldCheck className="h-4 w-4" />Salvar preferências</button>
            </form>
          </Surface>

          <Surface className="p-5">
            <div className="mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-[var(--primary)]" /><h2 className="app-title text-lg font-semibold">Logs recentes</h2></div>
            <div className="space-y-3">
              {data.logs.length ? data.logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                  <div className="flex items-start justify-between gap-2"><span className="font-semibold text-[var(--text-primary)]">{log.ruleName}</span><span className={`badge-base ${log.errorMessage ? "badge-danger" : log.matched ? "badge-success" : "badge-neutral"}`}>{log.errorMessage ? "Erro" : log.matched ? "Match" : "Sem match"}</span></div>
                  <p className="mt-1 text-[var(--text-secondary)]">{log.errorMessage || log.reason || "Execução registrada."}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{log.createdAt}</p>
                </div>
              )) : <div className="app-surface-muted rounded-xl p-4 text-sm text-[var(--text-secondary)]">Nenhum log de regra ainda. Execute o motor manualmente ou pelo cron.</div>}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
