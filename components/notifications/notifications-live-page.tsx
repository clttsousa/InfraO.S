"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, Clock3, Activity, Radio } from "lucide-react";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState, PageHeader, Surface } from "@/components/shared/ui";
import type { NotificationSummary } from "@/types";

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

async function fetchNotificationSummary() {
  const response = await fetch("/api/notifications/summary", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível atualizar as notificações.");
  return response.json() as Promise<NotificationSummary>;
}

export function NotificationsLivePage({ initialSummary }: { initialSummary: NotificationSummary }) {
  const { isConnected, subscribe } = useRealtime();
  const [summary, setSummary] = useState(initialSummary);
  const refreshTimerRef = useRef<number | null>(null);
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const nextSummary = await fetchNotificationSummary();
      setSummary(nextSummary);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed", "notification.created"].includes(event.type)) return;
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => { void refresh(); }, 220);
    });
  }, [refresh, subscribe]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Notificações" }]} showHome />
      <PageHeader
        eyebrow="Operação ativa"
        title="Central de notificações"
        description="Resumo operacional derivado das ordens atrasadas, vencimentos do dia e filas sem atualização."
        actions={<div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Ao vivo" : "Reconectando"}</div>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NotificationOverviewCard title="Alertas críticos" value={summary.counts.late} description="Ordens com prazo vencido e necessidade de ação imediata." tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <NotificationOverviewCard title="Vencem hoje" value={summary.counts.dueToday} description="Itens que ainda podem virar atraso no decorrer do dia." tone="warning" icon={<CalendarClock className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sem atualização" value={summary.counts.stale} description="Ordens sem movimentação recente e com risco de ficarem esquecidas." tone="info" icon={<Clock3 className="h-5 w-5" />} />
        <NotificationOverviewCard title="Movimentações" value={summary.counts.recentActivities} description={`Última checagem em ${summary.checkedAt}.`} tone="success" icon={<Activity className="h-5 w-5" />} />
      </div>

      <Surface className="p-5">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="app-title text-lg font-semibold">Fila viva de alertas</h3>
        </div>

        {summary.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState compact title="Nenhum alerta agora" description="Quando surgirem ordens críticas ou novas movimentações, elas aparecem aqui sem você precisar procurar manualmente." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {summary.items.map((item) => (
              <a key={item.id} href={item.href} className={`notification-card notification-card-${item.level}`}>
                <div className="notification-card-title">{item.title}</div>
                <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</div>
                {item.when ? <div className="mt-2 text-xs text-[var(--text-tertiary)]">{item.when}</div> : null}
              </a>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
