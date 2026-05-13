"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BellRing, CalendarClock, CheckCheck, Clock3, Layers3, Radio, Smartphone, Sparkles } from "lucide-react";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { DeviceNotificationSettings } from "@/components/pwa/device-notification-settings";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { EmptyState, PageHeader, Surface } from "@/components/shared/ui";
import type { NotificationEntityFilter, NotificationFeedFilter, NotificationItem, NotificationSeverity, NotificationSeverityFilter, NotificationSummary } from "@/types";

function NotificationOverviewCard({ title, value, description, tone, icon }: { title: string; value: number; description: string; tone: string; icon: ReactNode }) {
  return (
    <Surface className="notification-overview-card p-5" data-tone={tone}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="app-eyebrow text-[11px] font-medium">{title}</div>
          <div className="app-number mt-3 text-[2rem] font-semibold leading-none">{value}</div>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        <div className="notification-overview-icon">{icon}</div>
      </div>
    </Surface>
  );
}

async function markAllNotificationsRead() {
  await fetch("/api/notifications/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true })
  });
}

function buildNotificationQuery(filter: NotificationFeedFilter, page = 1, pageSize = 20, severity: NotificationSeverityFilter = "all", entity: NotificationEntityFilter = "all") {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (severity !== "all") params.set("severity", severity);
  if (entity !== "all") params.set("entity", entity);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 20) params.set("pageSize", String(pageSize));
  return params;
}

function buildNotificationHref(filter: NotificationFeedFilter, page = 1, pageSize = 20, severity: NotificationSeverityFilter = "all", entity: NotificationEntityFilter = "all") {
  const query = buildNotificationQuery(filter, page, pageSize, severity, entity).toString();
  return query ? `/notifications?${query}` : "/notifications";
}

async function runNotificationItemAction(id: string, action: "snooze" | "mute_rule") {
  const response = await fetch("/api/notifications/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action })
  });
  if (!response.ok) throw new Error("Não foi possível executar a ação da notificação.");
}

async function fetchNotificationSummary(filter: NotificationFeedFilter, page: number, pageSize: number, severity: NotificationSeverityFilter, entity: NotificationEntityFilter) {
  const query = buildNotificationQuery(filter, page, pageSize, severity, entity).toString();
  const response = await fetch(`/api/notifications/summary${query ? `?${query}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível atualizar as notificações.");
  return response.json() as Promise<NotificationSummary>;
}

function severityLabel(severity: NotificationSeverity) {
  return {
    info: "Informativa",
    attention: "Atenção",
    important: "Importante",
    critical: "Crítica"
  }[severity];
}

function severityClass(severity: NotificationSeverity) {
  return {
    info: "badge-primary",
    attention: "badge-warning",
    important: "badge-danger",
    critical: "badge-danger"
  }[severity];
}

function entityLabel(entity: string) {
  return {
    order: "Ordens",
    intervention: "Intervenções",
    system: "Sistema"
  }[entity] ?? entity;
}

function dayKey(item: NotificationItem) {
  if (!item.whenIso) return "older";
  const current = new Date();
  const date = new Date(item.whenIso);
  const startToday = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const startYesterday = startToday - 24 * 60 * 60 * 1000;
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (value >= startToday) return "today";
  if (value >= startYesterday) return "yesterday";
  return "older";
}

function buildNotificationGroups(items: NotificationItem[]) {
  const order = [
    { key: "today", label: "Hoje" },
    { key: "yesterday", label: "Ontem" },
    { key: "older", label: "Anteriores" }
  ];
  return order.map((group) => ({ ...group, items: items.filter((item) => dayKey(item) === group.key) })).filter((group) => group.items.length > 0);
}

export function NotificationsLivePage({ initialSummary }: { initialSummary: NotificationSummary }) {
  const { isConnected, subscribe } = useRealtime();
  const [summary, setSummary] = useState(initialSummary);
  const refreshTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const activeFilter = summary.filter;
  const activeSeverity = summary.severityFilter;
  const activeEntity = summary.entityFilter;

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const nextSummary = await fetchNotificationSummary(summary.filter, summary.page, summary.pageSize, summary.severityFilter, summary.entityFilter);
      setSummary(nextSummary);
    } finally {
      refreshingRef.current = false;
    }
  }, [summary.filter, summary.page, summary.pageSize, summary.severityFilter, summary.entityFilter]);

  useEffect(() => {
    return subscribe((event) => {
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed", "notification.created"].includes(event.type)) return;
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => { void refresh(); }, 220);
    });
  }, [refresh, subscribe]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const filterItems = useMemo(() => [
    { key: "all" as const, label: "Todas", count: summary.counts.late + summary.counts.dueToday + summary.counts.stale + summary.counts.interventions + summary.counts.recentActivities },
    { key: "interventions" as const, label: "Intervenções", count: summary.counts.interventions },
    { key: "orders" as const, label: "Ordens", count: summary.counts.late + summary.counts.dueToday + summary.counts.stale },
    { key: "system" as const, label: "Sistema", count: summary.counts.recentActivities },
    { key: "read" as const, label: "Lidas", count: summary.counts.read }
  ], [summary.counts]);

  const severityItems: Array<{ key: NotificationSeverityFilter; label: string; count?: number }> = [
    { key: "all", label: "Severidade" },
    { key: "critical", label: "Críticas", count: summary.counts.critical },
    { key: "important", label: "Importantes", count: summary.counts.important },
    { key: "attention", label: "Atenção", count: summary.counts.attention },
    { key: "info", label: "Informativas" }
  ];

  const entityItems: Array<{ key: NotificationEntityFilter; label: string }> = [
    { key: "all", label: "Todas entidades" },
    { key: "order", label: "Ordens" },
    { key: "intervention", label: "Intervenções" },
    { key: "system", label: "Sistema" }
  ];

  const visibleItems = summary.items;
  const groups = useMemo(() => buildNotificationGroups(visibleItems), [visibleItems]);
  const baseQuery = buildNotificationQuery(summary.filter, summary.page, summary.pageSize, summary.severityFilter, summary.entityFilter);

  return (
    <div className="notifications-page app-content-fluid space-y-5 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Notificações" }]} showHome />
      <PageHeader
        eyebrow="Motor inteligente"
        title="Central de notificações"
        description="Alertas de ordens, intervenções e sistema com severidade, filtros, agrupamento, ações rápidas e paginação."
        actions={<div className="flex flex-wrap items-center gap-2"><Link href="/settings/notifications" className="btn-base btn-secondary btn-md"><Sparkles className="h-4 w-4" />Regras</Link><button type="button" className="btn-base btn-secondary btn-md" onClick={() => { void markAllNotificationsRead().then(refresh); }}><CheckCheck className="h-4 w-4" />Marcar lidas</button><div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Ao vivo" : "Reconectando"}</div></div>}
      />

      <details className="device-status-disclosure rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <summary className="mobile-collapsible-summary">
          <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-[var(--primary)]" />Status do dispositivo</span>
          <span className="text-xs text-[var(--text-tertiary)]">PWA / iOS / Push</span>
        </summary>
        <div className="mt-4"><DeviceNotificationSettings compact /></div>
      </details>

      <div className="notification-filter-chips" role="tablist" aria-label="Filtros principais de notificações">
        {filterItems.map((item) => (
          <Link
            key={item.key}
            href={buildNotificationHref(item.key, 1, summary.pageSize, activeSeverity, activeEntity)}
            className={`notification-filter-chip ${activeFilter === item.key ? "is-active" : ""}`}
            aria-current={activeFilter === item.key ? "page" : undefined}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </Link>
        ))}
      </div>

      <div className="notification-filter-chips" role="tablist" aria-label="Filtros por severidade">
        {severityItems.map((item) => (
          <Link
            key={item.key}
            href={buildNotificationHref(activeFilter, 1, summary.pageSize, item.key, activeEntity)}
            className={`notification-filter-chip ${activeSeverity === item.key ? "is-active" : ""}`}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" ? <strong>{item.count}</strong> : null}
          </Link>
        ))}
      </div>

      <div className="notification-filter-chips" role="tablist" aria-label="Filtros por entidade">
        {entityItems.map((item) => (
          <Link
            key={item.key}
            href={buildNotificationHref(activeFilter, 1, summary.pageSize, activeSeverity, item.key)}
            className={`notification-filter-chip ${activeEntity === item.key ? "is-active" : ""}`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="notification-overview-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <NotificationOverviewCard title="Críticas" value={summary.counts.critical} description="Alertas que exigem atenção imediata." tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <NotificationOverviewCard title="Importantes" value={summary.counts.important} description="Regras com impacto operacional." tone="danger" icon={<BellRing className="h-5 w-5" />} />
        <NotificationOverviewCard title="Atenção" value={summary.counts.attention} description="Itens próximos do risco." tone="warning" icon={<CalendarClock className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sem atualização" value={summary.counts.stale} description="Ordens paradas há mais tempo." tone="info" icon={<Clock3 className="h-5 w-5" />} />
        <NotificationOverviewCard title="Inteligentes" value={summary.counts.smart} description="Geradas por regras configuráveis." tone="info" icon={<Sparkles className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sistema" value={summary.counts.recentActivities} description={`Checado em ${summary.checkedAt}.`} tone="success" icon={<Activity className="h-5 w-5" />} />
      </div>

      {summary.groupedAlerts.length ? (
        <Surface className="p-5">
          <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Agrupamentos inteligentes</h3></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.groupedAlerts.map((group) => (
              <Link key={group.key} href={group.href} className="notification-card notification-card-info">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="notification-card-title capitalize">{group.title}</div><p className="mt-1 text-sm text-[var(--text-secondary)]">{group.description}</p></div>
                  <span className={`badge-base ${severityClass(group.severity)}`}>{group.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface className="notification-feed-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="app-title text-lg font-semibold">Fila de alertas</h3>
          </div>
          <span className="badge-base badge-neutral">{summary.itemsTotal} item(ns)</span>
        </div>

        {visibleItems.length === 0 ? (
          <div className="mt-4">
            <EmptyState compact title="Nenhum alerta neste filtro" description="Altere severidade, entidade ou status de leitura para visualizar outras categorias." />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map((group) => (
              <section key={group.key} className="notification-mobile-group">
                <div className="notification-mobile-group-title">{group.label}</div>
                <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {group.items.map((item) => (
                    <div key={item.id} className={`notification-card notification-card-${item.level}`}>
                      <Link href={item.href} className="block">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="notification-card-title">{item.title}</div>
                              <span className={`badge-base ${severityClass(item.severity)}`}>{severityLabel(item.severity)}</span>
                              <span className="badge-base badge-neutral">{entityLabel(item.entityType)}</span>
                            </div>
                            <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</div>
                          </div>
                          {item.read ? <span className="badge-base badge-success shrink-0">Lida</span> : null}
                        </div>
                      </Link>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                        {item.when ? <span>{item.when}</span> : <span />}
                        <div className="flex flex-wrap items-center gap-2">
                          {item.actionLabel ? <Link href={item.href} className="font-semibold text-[var(--primary)]">{item.actionLabel}</Link> : null}
                          {item.category === "smart" ? (
                            <>
                              <button type="button" className="app-link text-xs font-semibold" onClick={() => { void runNotificationItemAction(item.id, "snooze").then(refresh); }}>Adiar 1h</button>
                              <button type="button" className="app-link text-xs font-semibold" onClick={() => { void runNotificationItemAction(item.id, "mute_rule").then(refresh); }}>Silenciar regra</button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {summary.itemsTotal > 0 ? (
          <PaginationFooter
            basePath="/notifications"
            baseQuery={baseQuery}
            page={summary.page}
            totalPages={summary.totalPages}
            pageSize={summary.pageSize}
            total={summary.itemsTotal}
            pageSizeOptions={[20, 50, 100]}
            label="alerta(s)"
          />
        ) : null}
      </Surface>
    </div>
  );
}
