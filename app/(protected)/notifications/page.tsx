import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, BellRing, CalendarClock, Clock3, Activity } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ButtonLink, EmptyState, PageHeader, Surface } from "@/components/shared/ui";
import { getNotificationSummary } from "@/lib/data";

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

export default async function NotificationsPage() {
  const summary = await getNotificationSummary();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Notificações" }]} showHome />
      <PageHeader
        eyebrow="Operação ativa"
        title="Central de notificações"
        description="Resumo operacional derivado das ordens atrasadas, vencimentos do dia e filas sem atualização. Agora com atalhos rápidos para abrir a fila certa sem navegação manual."
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/orders?lateOnly=1" variant="secondary" size="sm">Ver atrasadas</ButtonLink>
            <ButtonLink href="/orders?dueToday=1" variant="secondary" size="sm">Ver vencendo hoje</ButtonLink>
            <ButtonLink href="/orders?staleOnly=1" variant="secondary" size="sm">Ver sem atualização</ButtonLink>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NotificationOverviewCard title="Alertas críticos" value={summary.counts.late} description="Ordens com prazo vencido e necessidade de ação imediata." tone="danger" icon={<AlertTriangle className="h-5 w-5" />} />
        <NotificationOverviewCard title="Vencem hoje" value={summary.counts.dueToday} description="Itens que ainda podem virar atraso no decorrer do dia." tone="warning" icon={<CalendarClock className="h-5 w-5" />} />
        <NotificationOverviewCard title="Sem atualização" value={summary.counts.stale} description="Ordens sem movimentação recente e com risco de ficarem esquecidas." tone="info" icon={<Clock3 className="h-5 w-5" />} />
        <NotificationOverviewCard title="Movimentações" value={summary.counts.recentActivities} description={`Última checagem em ${summary.checkedAt}.`} tone="success" icon={<Activity className="h-5 w-5" />} />
      </div>

      <Surface className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="app-title text-lg font-semibold">Fila viva de alertas</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
            <span className="badge-base badge-danger">{summary.counts.late} críticas</span>
            <span className="badge-base badge-warning">{summary.counts.dueToday} hoje</span>
            <span className="badge-base badge-primary">{summary.counts.stale} sem atualização</span>
          </div>
        </div>

        {summary.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState compact title="Nenhum alerta agora" description="Quando surgirem ordens críticas ou novas movimentações, elas aparecem aqui sem você precisar procurar manualmente." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {summary.items.map((item) => (
              <Link key={item.id} href={item.href} scroll={false} className={`notification-card notification-card-${item.level}`}>
                <div className="notification-card-title">{item.title}</div>
                <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</div>
                {item.when ? <div className="mt-2 text-xs text-[var(--text-tertiary)]">{item.when}</div> : null}
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">{item.actionLabel ?? 'Abrir contexto'} <span aria-hidden="true">→</span></div>
              </Link>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
