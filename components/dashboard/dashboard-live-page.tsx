"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Radio, TimerReset } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState, FeedbackMessage, PageHeader, Surface } from "@/components/shared/ui";
import type { DashboardData } from "@/types";

function TechnicianLoadBar({ openOrders, lateOrders, pendingOrders }: { openOrders: number; lateOrders: number; pendingOrders: number }) {
  const total = Math.max(openOrders, 1);
  const latePct = Math.min(100, Math.round((lateOrders / total) * 100));
  const pendingPct = Math.min(100 - latePct, Math.round((pendingOrders / total) * 100));
  const healthyPct = Math.max(0, 100 - latePct - pendingPct);

  return (
    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div className="h-full bg-[var(--success)] transition-all duration-500" style={{ width: `${healthyPct}%` }} />
      <div className="-mt-2.5 h-full bg-[var(--warning)] transition-all duration-500" style={{ width: `${pendingPct}%`, marginLeft: `${healthyPct}%` }} />
      <div className="-mt-2.5 h-full bg-[var(--danger)] transition-all duration-500" style={{ width: `${latePct}%`, marginLeft: `${healthyPct + pendingPct}%` }} />
    </div>
  );
}

function StatCard({ label, value, tone, href, caption }: { label: string; value: number; tone: string; href: string; caption: string }) {
  const sparkHeights = [28, 48, 72].map((seed, index) => `${Math.max(22, Math.min(100, ((value || index + 1) / Math.max(value, 1)) * seed))}%`);

  return (
    <Link href={href} className="app-stat-card block animate-slideInUp" data-tone={tone}>
      <div className="app-eyebrow text-[11px] font-medium">{label}</div>
      <div className="app-stat-meta">
        <AnimatedCounter value={value} className="app-number mt-3 text-[2rem] font-semibold leading-none" />
        <span className="badge-base badge-primary">abrir fila</span>
      </div>
      <div className="app-stat-spark" aria-hidden="true">
        {sparkHeights.map((height, index) => <span key={`${label}-${index}`} style={{ height }} />)}
      </div>
      <div className="app-stat-caption">{caption}</div>
    </Link>
  );
}

async function fetchDashboardData() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível atualizar o dashboard.");
  return response.json() as Promise<DashboardData>;
}

export function DashboardLivePage({ initialData, forbidden, initialError }: { initialData: DashboardData | null; forbidden?: boolean; initialError?: string | null }) {
  const { isConnected, subscribe } = useRealtime();
  const [data, setData] = useState(initialData);
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null);
  const refreshTimerRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const nextData = await fetchDashboardData();
      setData(nextData);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível atualizar o dashboard.");
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed", "notification.created"].includes(event.type)) {
        return;
      }
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void refresh();
      }, 280);
    });
  }, [refresh, subscribe]);

  const statCards = useMemo(() => data ? [
    { label: "Abertas", value: data.stats.abertas, tone: "neutral", href: "/orders?status=ABERTA", caption: "fila geral em operação" },
    { label: "Em acompanhamento", value: data.stats.acompanhamento, tone: "neutral", href: "/orders?status=EM_ACOMPANHAMENTO", caption: "ordens em andamento" },
    { label: "Pendentes", value: data.stats.pendentes, tone: "warning", href: "/orders?status=PENDENTE", caption: "precisam de retorno" },
    { label: "Atrasadas", value: data.stats.atrasadas, tone: "danger", href: "/orders?lateOnly=1", caption: "prioridade máxima" },
    { label: "Finalizadas hoje", value: data.stats.finalizadasHoje, tone: "success", href: "/orders?status=FINALIZADA", caption: "fechamentos do dia" }
  ] : [], [data]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Dashboard" }]} showHome />
      {forbidden ? <FeedbackMessage type="error">Acesso restrito ao administrador para esta área.</FeedbackMessage> : null}
      {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}

      <PageHeader
        eyebrow="Acompanhamento operacional"
        title="Dashboard"
        description="Leitura rápida das ordens que exigem atenção, com cards clicáveis e visão objetiva da operação."
        actions={<div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Ao vivo" : "Reconectando"}</div>}
      />

      {!data ? (
        <Surface className="p-5"><EmptyState title="Dashboard indisponível" description="A aplicação não conseguiu consultar o banco neste momento." /></Surface>
      ) : (
        <>
          <div className="dashboard-stats-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((item) => <StatCard key={item.label} {...item} />)}
          </div>

          <DashboardCharts data={data} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.32fr_0.88fr]">
            <div className="space-y-6">
              <DashboardTable title="Vencendo hoje" description="Itens que precisam de fechamento ainda hoje para evitar atraso." orders={data.dueToday} href="/orders?dueToday=1" />
              <DashboardTable title="Atrasadas" description="Atraso é tratado como condição automática. O status real da ordem continua preservado." orders={data.overdue} href="/orders?lateOnly=1" />
              <DashboardTable title="Sem atualização" description="Ordens sem movimentação recente e com risco de ficarem esquecidas." orders={data.stale} href="/orders?staleOnly=1" />
            </div>

            <div className="space-y-6">
              <Surface className="animate-slideInUp p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="app-title text-lg font-semibold">Resumo por técnico</h3>
                  <span className="badge-base badge-primary">distribuição viva</span>
                </div>
                <div className="mt-4 space-y-2">
                  {data.technicianSummary.map((technician) => (
                    <div key={technician.id} className="border-b border-[var(--border)] py-2.5 last:border-b-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--text-primary)]">{technician.name}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{technician.openOrders} abertas · {technician.lateOrders} atrasadas · {technician.pendingOrders} pendentes</div>
                        </div>
                        <span className="app-number text-sm font-medium text-[var(--text-secondary)]">{technician.finishedOrders}</span>
                      </div>
                      <TechnicianLoadBar openOrders={technician.openOrders} lateOrders={technician.lateOrders} pendingOrders={technician.pendingOrders} />
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface className="animate-slideInUp p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="app-title text-lg font-semibold">Últimas movimentações</h3>
                  <span className="badge-base badge-neutral">timeline</span>
                </div>
                <div className="timeline mt-4 space-y-4">
                  {data.activities.length === 0 ? (
                    <EmptyState compact title="Sem movimentações" description="Quando houver novas ações nas O.S., elas aparecerão aqui." />
                  ) : data.activities.map((activity) => (
                    <div key={activity.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="text-sm text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">{activity.actor}</span> {activity.description}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{activity.when}</div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
