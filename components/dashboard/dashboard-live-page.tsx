"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MapPin,
  Plus,
  Radio,
  TimerReset,
  UsersRound,
  Wrench,
  Zap
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState, FeedbackMessage, PageHeader, Surface } from "@/components/shared/ui";
import type { DashboardData, ServiceOrderItem } from "@/types";

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

function InterventionDashboardCard({ item }: { item: NonNullable<DashboardData["interventions"]>[number] }) {
  return (
    <Link href={`/intervencoes?selected=${item.id}`} className="dashboard-intervention-card block rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.title}</div>
          <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-[var(--text-secondary)]"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{item.locationName}</span></div>
        </div>
        <span className={`badge-base shrink-0 ${item.isLate ? "badge-danger" : item.rawStatus === "EM_ACOMPANHAMENTO" ? "badge-warning" : "badge-primary"}`}>{item.status}</span>
      </div>
      <div className="mt-2 text-xs text-[var(--text-tertiary)]">{item.startAt} · {item.timeLabel} · {item.pointsCount} ponto{item.pointsCount === 1 ? "" : "s"}</div>
    </Link>
  );
}

function StatCard({ label, value, tone, href, caption }: { label: string; value: number; tone: string; href: string; caption: string }) {
  const sparkHeights = [28, 48, 72].map((seed, index) => `${Math.max(22, Math.min(100, ((value || index + 1) / Math.max(value, 1)) * seed))}%`);

  return (
    <Link href={href} className="app-stat-card dashboard-stat-card block animate-slideInUp" data-tone={tone} aria-label={`Abrir ${label}`}>
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

type PriorityTone = "danger" | "warning" | "primary" | "neutral" | "success";

type PriorityItem = {
  label: string;
  value: number;
  caption: string;
  href: string;
  tone: PriorityTone;
  icon: ReactNode;
};

function priorityToneClass(tone: PriorityTone) {
  if (tone === "danger") return "priority-danger";
  if (tone === "warning") return "priority-warning";
  if (tone === "success") return "priority-success";
  if (tone === "primary") return "priority-primary";
  return "priority-neutral";
}

function OperationalPriorityPanel({ items }: { items: PriorityItem[] }) {
  const totalAttention = items.reduce((sum, item) => sum + item.value, 0);
  const criticalItems = items.filter((item) => item.value > 0).slice(0, 3);

  return (
    <Surface className="dashboard-priority-panel animate-slideInUp p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="app-eyebrow text-[10px] font-medium">O que precisa de atenção agora?</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="app-title text-lg font-semibold md:text-xl">Prioridade operacional</h3>
            <span className={`badge-base ${totalAttention > 0 ? "badge-warning" : "badge-success"}`}>
              <Zap className="h-3.5 w-3.5" />{totalAttention > 0 ? `${totalAttention} ponto(s) de atenção` : "Fila sob controle"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {criticalItems.length ? `Agora: ${criticalItems.map((item) => `${item.value} ${item.label.toLowerCase()}`).join(" · ")}.` : "Sem alertas críticos no topo da operação."}
          </p>
        </div>
        <div className="dashboard-priority-actions flex shrink-0 flex-wrap gap-2">
          <Link href="/orders/new" className="btn-base btn-primary btn-sm"><Plus className="h-4 w-4" />Nova O.S.</Link>
          <Link href="/intervencoes?action=new" className="btn-base btn-secondary btn-sm"><CalendarClock className="h-4 w-4" />Nova intervenção</Link>
        </div>
      </div>

      <div className="dashboard-priority-grid mt-4">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className={`dashboard-priority-card ${priorityToneClass(item.tone)}`}>
            <span className="dashboard-priority-icon">{item.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
              <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{item.caption}</span>
            </span>
            <span className="app-number text-xl font-semibold text-[var(--text-primary)]">{item.value}</span>
          </Link>
        ))}
      </div>
    </Surface>
  );
}

function QuickActionStrip() {
  const actions = [
    { label: "Nova O.S.", href: "/orders/new", icon: <Plus className="h-4 w-4" />, tone: "primary" },
    { label: "Ordens atrasadas", href: "/orders?lateOnly=1", icon: <AlertTriangle className="h-4 w-4" />, tone: "danger" },
    { label: "Intervenções hoje", href: "/intervencoes?quick=today", icon: <CalendarClock className="h-4 w-4" />, tone: "primary" },
    { label: "Notificações", href: "/notifications", icon: <BellRing className="h-4 w-4" />, tone: "neutral" }
  ];

  return (
    <div className="dashboard-quick-actions" aria-label="Ações rápidas do dashboard">
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className={`dashboard-quick-action dashboard-quick-action-${action.tone}`}>
          {action.icon}
          <span>{action.label}</span>
          <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-65" />
        </Link>
      ))}
    </div>
  );
}

function MobileOrderCard({ order }: { order: ServiceOrderItem }) {
  return (
    <Link href={`/orders?selected=${order.id}`} className="dashboard-mobile-order-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="app-number text-sm font-semibold text-[var(--text-primary)]">O.S. {order.number}</div>
          <div className="mt-1 truncate text-sm text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</div>
        </div>
        <span className={`badge-base shrink-0 ${order.isLate ? "badge-danger" : order.isDueToday ? "badge-warning" : "badge-neutral"}`}>{order.status}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
        <span className="truncate">{order.teamSummary}</span>
        <span className="truncate text-right">{order.deadline}</span>
      </div>
    </Link>
  );
}

function MobileQueueSection({ title, orders, href, empty }: { title: string; orders: ServiceOrderItem[]; href: string; empty: string }) {
  return (
    <section className="dashboard-mobile-queue-section">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <Link href={href} className="app-link text-xs font-semibold">Ver fila</Link>
      </div>
      <div className="mt-2 space-y-2">
        {orders.length === 0 ? <div className="dashboard-mobile-empty">{empty}</div> : orders.slice(0, 3).map((order) => <MobileOrderCard key={order.id} order={order} />)}
      </div>
    </section>
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
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed", "intervention.created", "intervention.updated", "intervention.status_changed", "notification.created"].includes(event.type)) {
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

  const priorityItems = useMemo<PriorityItem[]>(() => data ? [
    { label: "O.S. atrasadas", value: data.operationalSummary.overdueOrders, caption: "prazo já vencido", href: "/orders?lateOnly=1", tone: "danger", icon: <AlertTriangle className="h-4 w-4" /> },
    { label: "O.S. vencendo hoje", value: data.operationalSummary.dueTodayOrders, caption: "fechar ainda hoje", href: "/orders?dueToday=1", tone: "warning", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "O.S. sem atualização", value: data.operationalSummary.staleOrders, caption: "sem movimento há 24h+", href: "/orders?staleOnly=1", tone: "neutral", icon: <TimerReset className="h-4 w-4" /> },
    { label: "Intervenções hoje", value: data.operationalSummary.todayInterventions, caption: "acompanhar agora", href: "/intervencoes?quick=today", tone: "primary", icon: <CalendarClock className="h-4 w-4" /> },
    { label: "Intervenções amanhã", value: data.operationalSummary.tomorrowInterventions, caption: "preparar avisos", href: "/intervencoes?quick=tomorrow", tone: "primary", icon: <Wrench className="h-4 w-4" /> },
    { label: "Notificações críticas", value: data.operationalSummary.criticalNotifications, caption: "ordens/intervenções críticas", href: "/notifications", tone: data.operationalSummary.criticalNotifications > 0 ? "danger" : "success", icon: <BellRing className="h-4 w-4" /> },
    { label: "Lembretes pendentes", value: data.operationalSummary.pendingReminders, caption: "avisos configuráveis", href: "/intervencoes", tone: data.operationalSummary.pendingReminders > 0 ? "warning" : "success", icon: <Clock3 className="h-4 w-4" /> }
  ] : [], [data]);

  return (
    <div className="app-content-fluid dashboard-page space-y-4 p-4 md:space-y-5 md:p-6 xl:p-7 2xl:p-8">
      <Breadcrumbs items={[{ label: "Dashboard" }]} showHome />
      {forbidden ? <FeedbackMessage type="error">Acesso restrito ao administrador para esta área.</FeedbackMessage> : null}
      {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}

      <PageHeader
        eyebrow="Acompanhamento operacional"
        title="Dashboard"
        description="Leitura rápida das filas que exigem atenção agora, com cards clicáveis e melhor aproveitamento de tela larga."
        actions={<div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Ao vivo" : "Reconectando"}</div>}
      />

      {!data ? (
        <Surface className="p-5"><EmptyState title="Dashboard indisponível" description="A aplicação não conseguiu consultar o banco neste momento." /></Surface>
      ) : (
        <>
          <OperationalPriorityPanel items={priorityItems} />
          <QuickActionStrip />

          <div className="dashboard-stats-grid dashboard-grid-fluid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:gap-5">
            {statCards.map((item) => <StatCard key={item.label} {...item} />)}
          </div>

          <div className="dashboard-mobile-queues md:hidden">
            <MobileQueueSection title="O.S. atrasadas" orders={data.overdue} href="/orders?lateOnly=1" empty="Nenhuma O.S. atrasada agora." />
            <MobileQueueSection title="Vencendo hoje" orders={data.dueToday} href="/orders?dueToday=1" empty="Nenhuma O.S. vencendo hoje." />
            <MobileQueueSection title="Sem atualização" orders={data.stale} href="/orders?staleOnly=1" empty="Nenhuma O.S. parada há mais de 24h." />
          </div>

          <div className="hidden md:block">
            <DashboardCharts data={data} />
          </div>

          <div className="dashboard-grid-fluid dashboard-workspace-grid grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.32fr)_minmax(360px,0.88fr)] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(420px,0.78fr)]">
            <div className="min-w-0 space-y-5">
              <DashboardTable title="Vencendo hoje" description="Itens que precisam de fechamento ainda hoje para evitar atraso." orders={data.dueToday} href="/orders?dueToday=1" />
              <DashboardTable title="Atrasadas" description="Atraso é tratado como condição automática. O status real da ordem continua preservado." orders={data.overdue} href="/orders?lateOnly=1" />
              <DashboardTable title="Sem atualização" description="Ordens sem movimentação recente e com risco de ficarem esquecidas." orders={data.stale} href="/orders?staleOnly=1" />
            </div>

            <aside className="dashboard-side-column min-w-0 space-y-5">
              <Surface className="dashboard-side-card animate-slideInUp p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="app-title text-lg font-semibold">Intervenções próximas</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Hoje, amanhã e atrasadas para não deixar aviso de WhatsApp esquecido.</p>
                  </div>
                  <Link href="/intervencoes" className="badge-base badge-primary shrink-0"><CalendarClock className="h-3.5 w-3.5" />abrir</Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-secondary)]">
                  <Link href="/intervencoes?quick=today" className="rounded-[var(--radius-control)] border border-[var(--border)] px-2 py-2 transition hover:border-[var(--primary)]"><div className="app-number text-base text-[var(--text-primary)]">{data.interventionSummary.today}</div>Hoje</Link>
                  <Link href="/intervencoes?quick=tomorrow" className="rounded-[var(--radius-control)] border border-[var(--border)] px-2 py-2 transition hover:border-[var(--primary)]"><div className="app-number text-base text-[var(--text-primary)]">{data.interventionSummary.tomorrow}</div>Amanhã</Link>
                  <Link href="/intervencoes?quick=late" className="rounded-[var(--radius-control)] border border-[var(--border)] px-2 py-2 transition hover:border-[var(--danger)]"><div className="app-number text-base text-[var(--danger)]">{data.interventionSummary.late}</div>Atrasadas</Link>
                </div>
                <div className="mt-4 space-y-2">
                  {data.interventions.length === 0 ? (
                    <EmptyState compact title="Sem intervenções próximas" description="Os lembretes de hoje, amanhã e atrasados aparecerão aqui." />
                  ) : data.interventions.map((item) => <InterventionDashboardCard key={item.id} item={item} />)}
                </div>
              </Surface>

              <Surface className="dashboard-side-card animate-slideInUp p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="app-title text-lg font-semibold">Resumo por técnico</h3>
                  <span className="badge-base badge-primary"><UsersRound className="h-3.5 w-3.5" />distribuição</span>
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

              <Surface className="dashboard-side-card animate-slideInUp p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="app-title text-lg font-semibold">Últimas movimentações</h3>
                  <span className="badge-base badge-neutral"><LayoutDashboard className="h-3.5 w-3.5" />timeline</span>
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
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
