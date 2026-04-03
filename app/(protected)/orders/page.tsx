import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Download, Eye, Pencil, TimerReset } from "lucide-react";
import { OrderDetailPanel } from "@/components/orders/order-detail-panel";
import { OrderFilters } from "@/components/orders/order-filters";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import { ButtonLink, EmptyState, FeedbackMessage, PageHeader, Surface } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ExportButton } from "@/components/shared/export-button";
import { getInternalUsers, getServiceOrderDetail, getServiceOrdersPageData, getTechnicians } from "@/lib/data";
import { buildOrderQuery, getParamValue, parseOrderFilters } from "@/lib/filter-params";
import type { InternalUserItem, OrderFilters as OrderFiltersType, ServiceOrderItem, TechnicianItem } from "@/types";

function buildFilterChipHref(baseQuery: URLSearchParams, key: "lateOnly" | "dueToday" | "staleOnly") {
  const next = new URLSearchParams(baseQuery);
  next.delete(key);
  next.delete("page");
  const query = next.toString();
  return query ? `/orders?${query}` : `/orders`;
}

function createRowHref(baseQuery: URLSearchParams, orderId: string) {
  const url = new URLSearchParams(baseQuery);
  url.set("selected", orderId);
  return `/orders?${url.toString()}`;
}

function createPageHref(baseQuery: URLSearchParams, page: number) {
  const url = new URLSearchParams(baseQuery);
  if (page <= 1) url.delete("page"); else url.set("page", String(page));
  return `/orders?${url.toString()}`;
}

function getRowClass(order: ServiceOrderItem, selectedId?: string) {
  const selected = selectedId === order.id ? " bg-[var(--primary-soft)]" : "";
  if (order.isLate) return `table-row table-row-late alert-emphasis-late${selected}`;
  if (order.isDueToday) return `table-row table-row-due alert-emphasis-due${selected}`;
  if (order.isStale) return `table-row alert-emphasis-stale${selected}`;
  return `table-row${selected}`;
}

function OrderAlertSummary({ order }: { order: ServiceOrderItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      {order.isLate ? <span className="badge-base badge-danger"><AlertTriangle className="h-3.5 w-3.5" />Atrasada</span> : null}
      {!order.isLate && order.isDueToday ? <span className="badge-base badge-warning"><CalendarClock className="h-3.5 w-3.5" />Hoje</span> : null}
      {order.isStale ? <span className="badge-base badge-neutral"><TimerReset className="h-3.5 w-3.5" />Sem atualização</span> : null}
      {!order.isLate && !order.isDueToday && !order.isStale ? <span className="text-xs text-[var(--text-tertiary)]">Sem alerta</span> : null}
    </div>
  );
}

function OrderMobileCard({ order, href }: { order: ServiceOrderItem; href: string }) {
  const toneClass = order.isLate ? "alert-emphasis-late" : order.isDueToday ? "alert-emphasis-due" : order.isStale ? "alert-emphasis-stale" : "";

  return (
    <Surface className={`order-card p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="app-link app-number text-sm font-semibold break-all">{order.number}</Link>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</p>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          <Link href={href} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Ver detalhes"><Eye className="h-4 w-4" /></Link>
          <Link href={`${href}&action=edit`} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Editar O.S."><Pencil className="h-4 w-4" /></Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Técnico</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{order.assignedTechnician}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Resp. interno: {order.internalOwner}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Prazo</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{order.deadline}</p>
          <div className="mt-2"><OrderAlertSummary order={order} /></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div>
    </Surface>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const filters: OrderFiltersType = parseOrderFilters(params);
  const action = getParamValue(params, "action");
  const success = getParamValue(params, "success");
  const error = getParamValue(params, "error");

  let pageData = null;
  let technicians: TechnicianItem[] = [];
  let internalUsers: InternalUserItem[] = [];
  let selectedOrder = null;
  let loadError: string | null = null;

  try {
    [pageData, technicians, internalUsers] = await Promise.all([getServiceOrdersPageData(filters), getTechnicians(), getInternalUsers()]);
    const selectedId = getParamValue(params, "selected") || pageData.items[0]?.id || "";
    selectedOrder = selectedId ? await getServiceOrderDetail(selectedId) : null;
  } catch (err) {
    console.error("[infraos] orders load error", err);
    loadError = "Não foi possível carregar as ordens agora. Revise a conexão com o banco e tente novamente.";
  }

  const baseQuery = buildOrderQuery(filters);
  const exportHref = `/api/exports/orders${baseQuery.toString() ? `?${baseQuery.toString()}` : ""}`;
  const detailHref = selectedOrder ? createRowHref(baseQuery, selectedOrder.id) : "/orders";
  const exportData = (pageData?.items ?? []).map((order) => ({ numero: order.number, cliente: order.clientName ?? "", tecnico: order.assignedTechnician, responsavelInterno: order.internalOwner, status: order.status, prioridade: order.priority, prazo: order.deadline }));

  const activeChips = [
    filters.lateOnly ? { key: "lateOnly" as const, label: "Somente atrasadas", icon: <AlertTriangle className="h-4 w-4 text-[var(--danger)]" /> } : null,
    filters.dueToday ? { key: "dueToday" as const, label: "Vencendo hoje", icon: <CalendarClock className="h-4 w-4 text-[var(--warning)]" /> } : null,
    filters.staleOnly ? { key: "staleOnly" as const, label: "Sem atualização", icon: <TimerReset className="h-4 w-4 text-[var(--text-tertiary)]" /> } : null
  ].filter(Boolean) as Array<{ key: "lateOnly" | "dueToday" | "staleOnly"; label: string; icon: ReactNode }>;

  const filteredItems = pageData?.items ?? [];
  const lateCount = filteredItems.filter((order) => order.isLate).length;
  const dueTodayCount = filteredItems.filter((order) => order.isDueToday).length;
  const staleCount = filteredItems.filter((order) => order.isStale).length;

  return (
    <div className="grid h-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="min-w-0 border-r border-[var(--border)]">
        <div className="space-y-5 p-4 md:p-6">
          <Breadcrumbs items={[{ label: "Ordens" }]} showHome />
          {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}
          <PageHeader eyebrow="Operação diária" title="Ordens de Serviço" description="Filtre, acompanhe alertas, ordene por coluna-chave e exporte a visão atual sem perder contexto operacional." actions={<><ButtonLink href={exportHref} variant="secondary"><Download className="h-4 w-4" />Exportar Excel</ButtonLink><ExportButton data={exportData} filename="ordens-filtradas" formats={["excel", "csv", "json"]} /></>} />

          {pageData ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="app-stat-card"><div className="app-eyebrow text-[11px] font-medium">Total filtrado</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{pageData.total}</div></div>
              <div className="app-stat-card" data-tone="danger"><div className="app-eyebrow text-[11px] font-medium">Atrasadas</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{lateCount}</div></div>
              <div className="app-stat-card" data-tone="warning"><div className="app-eyebrow text-[11px] font-medium">Vencendo hoje</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{dueTodayCount}</div></div>
              <div className="app-stat-card"><div className="app-eyebrow text-[11px] font-medium">Sem atualização</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{staleCount}</div></div>
            </div>
          ) : null}

          <OrderFilters technicians={technicians} filters={filters} />
          {activeChips.length ? <div className="flex flex-wrap gap-2">{activeChips.map((chip) => <Link key={chip.key} href={buildFilterChipHref(baseQuery, chip.key)} className="btn-base btn-secondary btn-md text-sm">{chip.icon}{chip.label}</Link>)}</div> : null}
        </div>

        <div className="px-4 pb-6 md:px-6">
          <div className="space-y-4 xl:hidden">
            {!pageData || pageData.items.length === 0 ? <Surface><EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." action={<ButtonLink href="/orders" variant="secondary">Limpar filtros</ButtonLink>} /></Surface> : pageData.items.map((order) => <OrderMobileCard key={order.id} order={order} href={createRowHref(baseQuery, order.id)} />)}
          </div>

          <Surface className="hidden overflow-hidden xl:block">
            <div className="app-scrollbar overflow-auto">
              <table className="orders-table w-full min-w-[860px] table-fixed text-left text-sm">
                <colgroup><col className="w-[29%]" /><col className="w-[20%]" /><col className="w-[18%]" /><col className="w-[21%]" /><col className="w-[12%]" /></colgroup>
                <thead className="table-head"><tr>{["Ordem / Cliente", "Técnico / Responsável", "Prazo / Alertas", "Situação", "Ações"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead>
                <tbody>
                  {!pageData || pageData.items.length === 0 ? (
                    <tr><td colSpan={5} className="px-0 py-0"><EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." action={<ButtonLink href="/orders" variant="secondary">Limpar filtros</ButtonLink>} /></td></tr>
                  ) : pageData.items.map((order) => (
                    <tr key={order.id} className={getRowClass(order, selectedOrder?.id)}>
                      <td className="px-4 py-3 align-top"><div className="space-y-1.5"><Link href={createRowHref(baseQuery, order.id)} className="app-link app-number text-sm font-semibold break-all">{order.number}</Link><div className="text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</div></div></td>
                      <td className="px-4 py-3 align-top"><div className="space-y-1.5"><div className="text-sm font-medium text-[var(--text-primary)]">{order.assignedTechnician}</div><div className="text-xs leading-5 text-[var(--text-tertiary)]">Resp. interno: {order.internalOwner}</div></div></td>
                      <td className="px-4 py-3 align-top"><div className="space-y-2"><div className="text-sm text-[var(--text-secondary)]">{order.deadline}</div><OrderAlertSummary order={order} /></div></td>
                      <td className="px-4 py-3 align-top"><div className="flex flex-wrap gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div></td>
                      <td className="px-4 py-3 align-top"><div className="flex items-center gap-2 text-[var(--text-tertiary)]"><Link href={createRowHref(baseQuery, order.id)} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Ver detalhes"><Eye className="h-4 w-4" /></Link><Link href={`${createRowHref(baseQuery, order.id)}&action=edit`} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Editar O.S."><Pencil className="h-4 w-4" /></Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>

          {pageData && pageData.totalPages > 1 ? <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between"><span>Página <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.page}</span> de <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.totalPages}</span> · {pageData.total} registros</span><div className="flex items-center gap-2"><ButtonLink href={createPageHref(baseQuery, pageData.page - 1)} variant="secondary" size="sm" className={pageData.page <= 1 ? "pointer-events-none opacity-50" : ""}><ChevronLeft className="h-4 w-4" />Anterior</ButtonLink><ButtonLink href={createPageHref(baseQuery, pageData.page + 1)} variant="secondary" size="sm" className={pageData.page >= pageData.totalPages ? "pointer-events-none opacity-50" : ""}>Próxima<ChevronRight className="h-4 w-4" /></ButtonLink></div></div> : null}
        </div>
      </div>

      <div className="min-w-0 bg-[var(--surface)]"><OrderDetailPanel order={selectedOrder} technicians={technicians} internalUsers={internalUsers} action={action} baseHref={detailHref} success={success} error={error} /></div>
    </div>
  );
}
