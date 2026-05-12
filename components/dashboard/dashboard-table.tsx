import Link from "next/link";
import { AlertTriangle, CalendarClock, Eye, TimerReset } from "lucide-react";
import { Surface, EmptyState } from "@/components/shared/ui";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import type { ServiceOrderItem } from "@/types";

function getRowClass(order: ServiceOrderItem) {
  if (order.isLate) return "table-row table-row-late group";
  if (order.isDueToday) return "table-row table-row-due group";
  return "table-row group";
}

export function DashboardTable({ title, description, orders, href }: { title: string; description: string; orders: ServiceOrderItem[]; href?: string }) {
  return (
    <Surface className="dashboard-table-surface animate-slideInUp">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h3 className="app-title text-lg font-semibold">{title}</h3>
          <p className="app-text-secondary text-sm leading-6">{description}</p>
        </div>
        {href ? <Link href={href} className="app-link text-sm font-medium">Ver lista</Link> : null}
      </div>
      <div className="app-scrollbar overflow-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-5 py-3 font-medium">O.S.</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Equipe</th>
              <th className="px-5 py-3 font-medium">Prioridade</th>
              <th className="px-5 py-3 font-medium">Prazo</th>
              <th className="px-5 py-3 font-medium">Alertas</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-0 py-0">
                  <EmptyState compact title="Nenhuma O.S. neste bloco" description="Quando houver itens dentro deste recorte operacional, eles aparecerão aqui." />
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={getRowClass(order)}>
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                    <Link href={`/orders?selected=${order.id}`} className="app-link">
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{order.teamSummary}</td>
                  <td className="px-5 py-3"><PriorityBadge priority={order.priority} /></td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{order.deadline}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {order.isLate ? <span className="badge-base badge-danger"><AlertTriangle className="h-3.5 w-3.5" />Atrasada</span> : null}
                      {!order.isLate && order.isDueToday ? <span className="badge-base badge-warning"><CalendarClock className="h-3.5 w-3.5" />Hoje</span> : null}
                      {order.isStale ? <span className="badge-base badge-neutral"><TimerReset className="h-3.5 w-3.5" />Sem atualização</span> : null}
                      {!order.isLate && !order.isDueToday && !order.isStale ? <span className="text-xs text-[var(--text-tertiary)]">—</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3">
                    <div className="row-actions flex items-center gap-2 text-[var(--text-tertiary)]">
                      <Link href={`/orders?selected=${order.id}`} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Abrir detalhe">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
