"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BellRing, CalendarClock, CheckCheck, Clock3, Radio, Smartphone } from "lucide-react";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { DeviceNotificationSettings } from "@/components/pwa/device-notification-settings";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { EmptyState, PageHeader, Surface } from "@/components/shared/ui";
import type { NotificationFeedFilter, NotificationItem, NotificationSummary } from "@/types";

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

function buildNotificationQuery(filter: NotificationFeedFilter, page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 20) params.set("pageSize", String(pageSize));
  return params;
}

function buildNotificationHref(filter: NotificationFeedFilter, page = 1, pageSize = 20) {
  const query = buildNotificationQuery(filter, page, pageSize).toString();
  return query ? `/notifications?${query}` : "/notifications";
}

async function fetchNotificationSummary(filter: NotificationFeedFilter, page: number, pageSize: number) {
  const query = buildNotificationQuery(filter, page, pageSize).toString();
  const response = await fetch(`/api/notifications/summary${query ? `?${query}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível atualizar as notificações.");
  return response.json() as Promise<NotificationSummary>;
}

function isOrderNotification(item: NotificationItem) {
  return item.category === "late" || item.category === "dueToday" || item.category === "stale";
}

function buildNotificationGroups(items: NotificationItem[], filter: NotificationFeedFilter) {
  if (filter === "read") return [{ key: "read", label: "Lidas", items }].filter((group) => group.items.length > 0);
  if (filter === "orders") return [{ key: "order", label: "Ordens", items: items.filter(isOrderNotification) }].filter((group) => group.items.length > 0);
  if (filter === "interventions") return [{ key: "intervention", label: "Intervenções", items: items.filter((item) => item.category === "intervention") }].filter((group) => group.items.length > 0);
  if (filter === "system") return [{ key: "system", label: "Sistema", items: items.filter((item) => item.category === "activity") }].filter((group) => group.items.length > 0);

  return [
    { key: "intervention", label: "Intervenções", items: items.filter((item) => item.category === "intervention") },
    { key: "order", label: "Ordens", items: items.filter(isOrderNotification) },
    { key: "system", label: "Sistema", items: items.filter((item) => item.category === "activity") }
  ].filter((group) => group.items.length > 0);
}

export function NotificationsLivePage({ initialSummary }: { initialSummary: NotificationSummary }) {
  const { isConnected, subscribe } = useRealtime();
  const [summary, setSummary] = useState(initialSummary);
  const refreshTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);
  const activeFilter = summary.filter;

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const nextSummary = await fetchNotificationSummary(summary.filter, summary.page, summary.pageSize);
      setSummary(nextSummary);
    } finally {
      refreshingRef.current = false;
    }
  }, [summary.filter, summary.page, summary.pageSize]);

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

  const visibleItems = summary.items;
  const groups = useMemo(() => buildNotificationGroups(visibleItems, activeFilter), [activeFilter, visibleItems]);
  const baseQuery = buildNotificationQuery(summary.filter, summary.page, summary.pageSize);

  return (
    <div className="notifications-page app-content-fluid space-y-5 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Notificações" }]} showHome />
      <PageHeader
        eyebrow="Operação ativa"
        title="Central de notificações"
        description="Alertas de ordens, intervenções e status do dispositivo organizados com paginação para não carregar tudo de uma vez."
        actions={<div className="flex flex-wrap items-center gap-2"><button type="button" className="btn-base btn-secondary btn-md" onClick={() => { void markAllNotificationsRead().then(refresh); }}><CheckCheck className="h-4 w-4" />Marcar lidas</button><div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Ao vivo" : "Reconectando"}</div></div>}
      />

      <details className="device-status-disclosure rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <summary className="mobile-collapsible-summary">
          <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-[var(--primary)]" />Status do dispositivo</span>
          <span className="text-xs text-[var(--text-tertiary)]">PWA / iOS / Push</span>
        </summary>
        <div className="mt-4"><DeviceNotificationSettings compact /></div>
      </details>

      <div className="notification-filter-chips" role="tablist" aria-label="Filtros de notificações">
        {filterItems.map((item) => (
          <Link
            key={item.key}
            href={buildNotificationHref(item.key, 1, summary.pageSize)}
            className={`notification-filter-chip ${activeFilter === item.key ? "is-active" : ""}`}
            aria-current={activeFilter === item.key ? "page" : undefined}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </Link>
        ))}
      </div>

      <div className="notification-overview-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <NotificationOverviewCard title="Críticos" value={summary.counts.late} description="Ordens com prazo vencido." tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <NotificationOverviewCard title="Hoje" value={summary.counts.dueToday} description="Itens que vencem hoje." tone="warning" icon={<CalendarClock className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sem atualização" value={summary.counts.stale} description="Ordens paradas há mais tempo." tone="info" icon={<Clock3 className="h-5 w-5" />} />
        <NotificationOverviewCard title="Intervenções" value={summary.counts.interventions} description="Lembretes pendentes." tone="info" icon={<BellRing className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sistema" value={summary.counts.recentActivities} description={`Checado em ${summary.checkedAt}.`} tone="success" icon={<Activity className="h-5 w-5" />} />
      </div>

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
            <EmptyState compact title="Nenhum alerta neste filtro" description="Altere o filtro acima para visualizar outras categorias ou aguarde novas movimentações do painel." />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map((group) => (
              <section key={group.key} className="notification-mobile-group">
                <div className="notification-mobile-group-title">{group.label}</div>
                <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {group.items.map((item) => (
                    <a key={item.id} href={item.href} className={`notification-card notification-card-${item.level}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="notification-card-title">{item.title}</div>
                          <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</div>
                        </div>
                        {item.read ? <span className="badge-base badge-success shrink-0">Lida</span> : null}
                      </div>
                      {item.when ? <div className="mt-2 text-xs text-[var(--text-tertiary)]">{item.when}</div> : null}
                    </a>
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
