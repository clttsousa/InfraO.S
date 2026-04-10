"use client";
import { useMemo } from "react";
import { AlertTriangle, CalendarClock, ChevronRight, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import { EmptyState, Surface } from "@/components/shared/ui";
import type { ServiceOrderItem } from "@/types";

function createRowHref(baseQueryString: string, orderId: string) {
  const url = new URLSearchParams(baseQueryString);
  url.set("selected", orderId);
  return `/orders?${url.toString()}`;
}

function isRecentlyUpdated(order: ServiceOrderItem) {
  if (!order.updatedAtIso) return false;
  const diff = Date.now() - new Date(order.updatedAtIso).getTime();
  return diff >= 0 && diff <= 1000 * 60 * 60 * 6;
}

function getRowClass(order: ServiceOrderItem, selectedId?: string) {
  const classes = ["table-row", "table-row-clickable", "group"];
  if (selectedId === order.id) classes.push("table-row-selected");
  if (isRecentlyUpdated(order)) classes.push("table-row-recent");
  if (order.isLate) classes.push("table-row-late", "alert-emphasis-late");
  else if (order.isDueToday) classes.push("table-row-due", "alert-emphasis-due");
  else if (order.isStale) classes.push("alert-emphasis-stale");
  return classes.join(" ");
}

function OrderAlertSummary({ order }: { order: ServiceOrderItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      {order.isLate ? <span className="badge-base badge-danger badge-accent-pulse"><AlertTriangle className="h-3.5 w-3.5" />Atrasada</span> : null}
      {!order.isLate && order.isDueToday ? <span className="badge-base badge-warning"><CalendarClock className="h-3.5 w-3.5" />Hoje</span> : null}
      {order.isStale ? <span className="badge-base badge-neutral"><TimerReset className="h-3.5 w-3.5" />Sem atualização</span> : null}
      {!order.isLate && !order.isDueToday && !order.isStale ? <span className="text-xs text-[var(--text-tertiary)]">Sem alerta</span> : null}
    </div>
  );
}

function OrderMobileCard({ order, href, isSelected, onOpen }: { order: ServiceOrderItem; href: string; isSelected: boolean; onOpen: () => void }) {
  const toneClass = order.isLate ? "alert-emphasis-late" : order.isDueToday ? "alert-emphasis-due" : order.isStale ? "alert-emphasis-stale" : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={isSelected}
      aria-label={`Abrir detalhes da ordem ${order.number}`}
      className={`order-card order-card-button app-surface animate-slideInUp w-full p-4 text-left ${toneClass} ${isSelected ? "table-row-selected" : ""}`}
      data-href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="app-number text-sm font-semibold break-all">{order.number}</div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</p>
        </div>
        <div className="order-open-indicator shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-tertiary)]">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Técnico</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{order.teamSummary}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Resp. interno: {order.internalOwner}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Prazo</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{order.deadline}</p>
          <div className="mt-2"><OrderAlertSummary order={order} /></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div>
        <span className="text-xs font-medium text-[var(--text-tertiary)]">Toque para abrir</span>
      </div>
    </button>
  );
}

export function OrderInteractiveList({ baseQueryString, items, selectedId }: { baseQueryString: string; items: ServiceOrderItem[]; selectedId?: string }) {
  const router = useRouter();
  const orders = useMemo(() => items, [items]);

  const openOrder = (orderId: string) => {
    router.push(createRowHref(baseQueryString, orderId), { scroll: false });
  };

  if (!orders.length) {
    return (
      <>
        <div className="space-y-4 xl:hidden">
          <Surface>
            <EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." />
          </Surface>
        </div>

        <Surface className="hidden overflow-hidden xl:block">
          <EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." />
        </Surface>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 xl:hidden">
        {orders.map((order) => {
          const href = createRowHref(baseQueryString, order.id);
          return <OrderMobileCard key={order.id} order={order} href={href} isSelected={selectedId === order.id} onOpen={() => openOrder(order.id)} />;
        })}
      </div>

      <Surface className="hidden overflow-hidden xl:block">
        <div className="app-scrollbar overflow-auto">
          <table className="orders-table w-full min-w-[900px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[31%]" />
              <col className="w-[23%]" />
              <col className="w-[24%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead className="table-head">
              <tr>
                {["Ordem / Cliente", "Técnico / Responsável", "Prazo / Alertas", "Situação"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const href = createRowHref(baseQueryString, order.id);
                return (
                  <tr
                    key={order.id}
                    className={getRowClass(order, selectedId)}
                    tabIndex={0}
                    aria-selected={selectedId === order.id}
                    data-href={href}
                    onClick={() => openOrder(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openOrder(order.id);
                      }
                    }}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="app-number text-sm font-semibold break-all">{order.number}</div>
                            <div className="text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</div>
                          </div>
                          <div className="order-open-indicator hidden shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--text-tertiary)] xl:block">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                        <span className="table-row-hint text-xs font-medium text-[var(--text-tertiary)]">Clique para abrir o detalhe</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-[var(--text-primary)]">{order.teamSummary}</div>
                        <div className="text-xs leading-5 text-[var(--text-tertiary)]">Resp. interno: {order.internalOwner}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        <div className="text-sm text-[var(--text-secondary)]">{order.deadline}</div>
                        <OrderAlertSummary order={order} />
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    </>
  );
}
