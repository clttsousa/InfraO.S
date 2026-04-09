import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Eye, Pencil, Save, TimerReset, Trash2, X } from "lucide-react";
import { deleteOrderViewAction, saveOrderViewAction } from "@/app/(protected)/orders/actions";
import { OrderDetailPanel } from "@/components/orders/order-detail-panel";
import { OrderFilters } from "@/components/orders/order-filters";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { ButtonLink, EmptyState, FeedbackMessage, PageHeader, Surface } from "@/components/shared/ui";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ExportButton } from "@/components/shared/export-button";
import { getInternalUserDirectory, getSavedOrderViews, getServiceOrderDetail, getServiceOrdersPageData, getTechnicianDirectory } from "@/lib/data";
import { buildOrderQuery, getParamValue, parseOrderFilters } from "@/lib/filter-params";
import { requireSession } from "@/lib/session";
import type { InternalUserDirectoryItem, OrderFilters as OrderFiltersType, SavedOrderView, ServiceOrderItem, TechnicianDirectoryItem } from "@/types";
import { decodeSearchParamMessage } from "@/lib/search-param-feedback";
import { getCompactSparkline } from "@/lib/sparkline";

function removeFilterKeys(baseQuery: URLSearchParams, keys: string[]) {
  const next = new URLSearchParams(baseQuery);
  keys.forEach((key) => next.delete(key));
  next.delete("page");
  next.delete("success");
  next.delete("error");
  const query = next.toString();
  return query ? `/orders?${query}` : "/orders";
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

function createCloseDetailHref(baseQuery: URLSearchParams) {
  const url = new URLSearchParams(baseQuery);
  ["selected", "action", "success", "error"].forEach((key) => url.delete(key));
  const query = url.toString();
  return query ? `/orders?${query}` : "/orders";
}

function isRecentlyUpdated(order: ServiceOrderItem) {
  if (!order.updatedAtIso) return false;
  const diff = Date.now() - new Date(order.updatedAtIso).getTime();
  return diff >= 0 && diff <= 1000 * 60 * 60 * 6;
}

function getRowClass(order: ServiceOrderItem, selectedId?: string) {
  const classes = ["table-row", "group"];
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

function OrderMobileCard({ order, href }: { order: ServiceOrderItem; href: string }) {
  const toneClass = order.isLate ? "alert-emphasis-late" : order.isDueToday ? "alert-emphasis-due" : order.isStale ? "alert-emphasis-stale" : "";

  return (
    <Surface className={`order-card animate-slideInUp p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} scroll={false} className="app-link app-number text-sm font-semibold break-all">{order.number}</Link>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</p>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          <Link href={href} scroll={false} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Ver detalhes"><Eye className="h-4 w-4" /></Link>
          <Link href={`${href}&action=edit`} scroll={false} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Editar O.S."><Pencil className="h-4 w-4" /></Link>
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

      <div className="mt-4 flex flex-wrap gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div>
    </Surface>
  );
}

function getStatusLabel(status?: string) {
  const statusMap: Record<string, string> = {
    ABERTA: "Status: Aberta",
    ENCAMINHADA: "Status: Encaminhada",
    EM_ACOMPANHAMENTO: "Status: Em acompanhamento",
    PENDENTE: "Status: Pendente",
    FINALIZADA: "Status: Finalizada",
    CANCELADA: "Status: Cancelada"
  };

  return status ? statusMap[status] ?? `Status: ${status}` : "";
}

function getPriorityLabel(priority?: string) {
  const priorityMap: Record<string, string> = {
    BAIXA: "Prioridade: Baixa",
    MEDIA: "Prioridade: Média",
    ALTA: "Prioridade: Alta",
    URGENTE: "Prioridade: Urgente"
  };

  return priority ? priorityMap[priority] ?? `Prioridade: ${priority}` : "";
}

function buildActiveFilters(filters: OrderFiltersType, technicians: TechnicianDirectoryItem[], baseQuery: URLSearchParams) {
  const technicianName = technicians.find((item) => item.id === filters.technicianId)?.name;

  return [
    filters.q ? { label: `Busca: ${filters.q}`, href: removeFilterKeys(baseQuery, ["q"]) } : null,
    technicianName ? { label: `Técnico envolvido: ${technicianName}`, href: removeFilterKeys(baseQuery, ["technician"]) } : null,
    filters.status ? { label: getStatusLabel(filters.status), href: removeFilterKeys(baseQuery, ["status"]) } : null,
    filters.priority ? { label: getPriorityLabel(filters.priority), href: removeFilterKeys(baseQuery, ["priority"]) } : null,
    filters.from || filters.to ? { label: `Período: ${filters.from || "..."} até ${filters.to || "..."}`, href: removeFilterKeys(baseQuery, ["from", "to"]) } : null,
    filters.lateOnly ? { label: "Somente atrasadas", href: removeFilterKeys(baseQuery, ["lateOnly"]), icon: <AlertTriangle className="h-4 w-4 text-[var(--danger)]" /> } : null,
    filters.dueToday ? { label: "Vencendo hoje", href: removeFilterKeys(baseQuery, ["dueToday"]), icon: <CalendarClock className="h-4 w-4 text-[var(--warning)]" /> } : null,
    filters.staleOnly ? { label: "Sem atualização", href: removeFilterKeys(baseQuery, ["staleOnly"]), icon: <TimerReset className="h-4 w-4 text-[var(--text-tertiary)]" /> } : null
  ].filter(Boolean) as Array<{ label: string; href: string; icon?: ReactNode }>;
}

function SavedViewsBlock({ savedViews }: { savedViews: SavedOrderView[] }) {
  if (savedViews.length === 0) {
    return (
      <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        Nenhum filtro salvo ainda. Salve uma visão pronta para voltar rápido a filas como atrasadas, técnico específico ou combinações recorrentes.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {savedViews.map((view) => (
        <div key={view.id} className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-sm)]">
          <Link href={`/orders${view.queryString ? `?${view.queryString}` : ""}`} scroll={false} className="btn-base btn-ghost btn-sm px-3 text-sm">
            {view.name}
          </Link>
          <form action={deleteOrderViewAction}>
            <input type="hidden" name="id" value={view.id} />
            <SubmitButton variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" pendingLabel="" >
              <Trash2 className="h-4 w-4" />
            </SubmitButton>
          </form>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, tone, href, caption }: { label: string; value: number; tone?: string; href?: string; caption: string }) {
  const spark = getCompactSparkline(value);
  const content = (
    <>
      <div className="app-eyebrow text-[11px] font-medium">{label}</div>
      <div className="app-stat-meta">
        <AnimatedCounter value={value} className="app-number mt-3 text-[1.9rem] font-semibold leading-none" />
        <span className="badge-base badge-primary">ao vivo</span>
      </div>
      {spark.showBars ? (<div className="app-stat-spark" aria-hidden="true">{spark.heights.map((height, index) => <span key={`${label}-${index}`} style={{ height }} />)}</div>) : (<div className="mt-3 text-xs text-[var(--text-tertiary)]">Baixo volume: leitura simplificada.</div>)}
      <div className="app-stat-caption">{spark.reliability === "low" ? `${caption} · base reduzida` : caption}</div>
    </>
  );

  if (href) {
    return <Link href={href} scroll={false} className="app-stat-card block animate-slideInUp" data-tone={tone}>{content}</Link>;
  }

  return <div className="app-stat-card animate-slideInUp" data-tone={tone}>{content}</div>;
}

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const filters: OrderFiltersType = parseOrderFilters(params);
  const action = getParamValue(params, "action");
  const success = getParamValue(params, "success");
  const error = getParamValue(params, "error");

  let pageData = null;
  let technicians: TechnicianDirectoryItem[] = [];
  let internalUsers: InternalUserDirectoryItem[] = [];
  let savedViews: SavedOrderView[] = [];
  let selectedOrder = null;
  let loadError: string | null = null;

  try {
    [pageData, technicians, savedViews] = await Promise.all([
      getServiceOrdersPageData(filters),
      getTechnicianDirectory(),
      getSavedOrderViews(session.id)
    ]);
    const selectedId = getParamValue(params, "selected") || pageData.items[0]?.id || "";
    const shouldLoadEditorUsers = action === "edit";
    [selectedOrder, internalUsers] = await Promise.all([
      selectedId ? getServiceOrderDetail(selectedId) : Promise.resolve(null),
      shouldLoadEditorUsers ? getInternalUserDirectory() : Promise.resolve([])
    ]);
  } catch (err) {
    console.error("[infraos] orders load error", err);
    loadError = "Não foi possível carregar as ordens agora. Revise a conexão com o banco e tente novamente.";
  }

  const baseQuery = buildOrderQuery(filters);
  const detailHref = selectedOrder ? createRowHref(baseQuery, selectedOrder.id) : "/orders";
  const closeDetailHref = createCloseDetailHref(baseQuery);
  const exportData = (pageData?.items ?? []).map((order) => ({
    numero: order.number,
    cliente: order.clientName ?? "",
    tecnico: order.assignedTechnician,
    equipeApoio: order.supportTechnicians.map((item) => item.name).join(", ") || "Sem apoio",
    responsavelInterno: order.internalOwner,
    status: order.status,
    prioridade: order.priority,
    prazo: order.deadline
  }));

  const activeFilters = buildActiveFilters(filters, technicians, baseQuery);
  const filteredItems = pageData?.items ?? [];
  const lateCount = filteredItems.filter((order) => order.isLate).length;
  const dueTodayCount = filteredItems.filter((order) => order.isDueToday).length;
  const staleCount = filteredItems.filter((order) => order.isStale).length;
  const clearAllHref = removeFilterKeys(baseQuery, ["q", "technician", "status", "priority", "from", "to", "lateOnly", "dueToday", "staleOnly", "sortBy", "sortDir", "page", "selected", "success", "error"]);
  const pageStart = pageData ? (pageData.page - 1) * pageData.pageSize + 1 : 0;
  const pageEnd = pageData ? Math.min(pageData.total, pageData.page * pageData.pageSize) : 0;

  return (
    <div className="grid h-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="min-w-0 border-r border-[var(--border)]">
        <div className="space-y-5 p-4 md:p-6">
          <Breadcrumbs items={[{ label: "Ordens" }]} showHome />
          {success ? <FeedbackMessage type="success">{decodeSearchParamMessage(success)}</FeedbackMessage> : null}
          {error ? <FeedbackMessage type="error">{decodeSearchParamMessage(error)}</FeedbackMessage> : null}
          {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}
          <PageHeader
            eyebrow="Operação diária"
            title="Ordens de Serviço"
            description="Filtre, acompanhe alertas, salve visões recorrentes e exporte a leitura atual sem perder contexto operacional. A interface agora destaca filtros, filas críticas e atualizações recentes sem pesar o fluxo." 
            actions={<ExportButton data={exportData} filename="ordens-filtradas" formats={["csv", "json"]} />}
          />

          {pageData ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total filtrado" value={pageData.total} caption="resultado da visão atual" />
              <StatCard label="Atrasadas" value={lateCount} tone="danger" href="/orders?lateOnly=1" caption="fila crítica" />
              <StatCard label="Vencendo hoje" value={dueTodayCount} tone="warning" href="/orders?dueToday=1" caption="prioridade do dia" />
              <StatCard label="Sem atualização" value={staleCount} href="/orders?staleOnly=1" caption="exigem revisão" />
            </div>
          ) : null}

          <OrderFilters technicians={technicians} filters={filters} exportActionHref="/api/exports/orders" />

          <Surface className="animate-slideInUp p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <Save className="h-4 w-4 text-[var(--primary)]" />Visões salvas
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Salve combinações de filtros usadas com frequência.</p>
              </div>
              <form action={saveOrderViewAction} className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:max-w-[420px]">
                <input type="hidden" name="queryString" value={baseQuery.toString()} />
                <input name="name" required placeholder="Ex.: Minhas atrasadas" className="input-base text-sm outline-none" />
                <SubmitButton pendingLabel="Salvando..."><Save className="h-4 w-4" />Salvar visão</SubmitButton>
              </form>
            </div>
            <div className="mt-4"><SavedViewsBlock savedViews={savedViews} /></div>
          </Surface>

          {activeFilters.length ? (
            <Surface className="animate-slideInUp p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Filtros ativos</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{activeFilters.length} filtro(s) aplicado(s) nesta visão.</p>
                </div>
                <ButtonLink href={clearAllHref} variant="secondary" size="sm">Limpar tudo</ButtonLink>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((chip) => (
                  <Link key={`${chip.label}-${chip.href}`} href={chip.href} scroll={false} className="filter-chip">
                    {chip.icon ?? null}
                    {chip.label}
                  </Link>
                ))}
              </div>
            </Surface>
          ) : null}
        </div>

        <div className="px-4 pb-6 md:px-6">
          <div className="space-y-4 xl:hidden">
            {!pageData || pageData.items.length === 0 ? <Surface><EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." action={<ButtonLink href="/orders" variant="secondary">Limpar filtros</ButtonLink>} /></Surface> : pageData.items.map((order) => <OrderMobileCard key={order.id} order={order} href={createRowHref(baseQuery, order.id)} />)}
          </div>

          <Surface className="hidden overflow-hidden xl:block">
            <div className="app-scrollbar overflow-auto">
              <table className="orders-table w-full min-w-[860px] table-fixed text-left text-sm">
                <colgroup><col className="w-[29%]" /><col className="w-[20%]" /><col className="w-[22%]" /><col className="w-[17%]" /><col className="w-[12%]" /></colgroup>
                <thead className="table-head"><tr>{["Ordem / Cliente", "Técnico / Responsável", "Prazo / Alertas", "Situação", "Ações"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead>
                <tbody>
                  {!pageData || pageData.items.length === 0 ? (
                    <tr><td colSpan={5} className="px-0 py-0"><EmptyState compact title="Nenhuma O.S. encontrada" description="Revise os filtros aplicados ou limpe a busca para voltar a exibir a operação completa." action={<ButtonLink href="/orders" variant="secondary">Limpar filtros</ButtonLink>} /></td></tr>
                  ) : pageData.items.map((order) => (
                    <tr key={order.id} className={getRowClass(order, selectedOrder?.id)}>
                      <td className="px-4 py-3 align-top"><div className="space-y-1.5"><Link href={createRowHref(baseQuery, order.id)} scroll={false} className="app-link app-number text-sm font-semibold break-all">{order.number}</Link><div className="text-sm leading-6 text-[var(--text-secondary)]">{order.clientName ?? "Sem cliente"}</div></div></td>
                      <td className="px-4 py-3 align-top"><div className="space-y-1.5"><div className="text-sm font-medium text-[var(--text-primary)]">{order.teamSummary}</div><div className="text-xs leading-5 text-[var(--text-tertiary)]">Resp. interno: {order.internalOwner}</div></div></td>
                      <td className="px-4 py-3 align-top"><div className="space-y-2"><div className="text-sm text-[var(--text-secondary)]">{order.deadline}</div><OrderAlertSummary order={order} /></div></td>
                      <td className="px-4 py-3 align-top"><div className="flex flex-wrap gap-2"><StatusBadge status={order.status} /><PriorityBadge priority={order.priority} /></div></td>
                      <td className="px-4 py-3 align-top"><div className="row-actions flex items-center gap-2 text-[var(--text-tertiary)]"><Link href={createRowHref(baseQuery, order.id)} scroll={false} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Ver detalhes"><Eye className="h-4 w-4" /></Link><Link href={`${createRowHref(baseQuery, order.id)}&action=edit`} scroll={false} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-lg p-0" title="Editar O.S."><Pencil className="h-4 w-4" /></Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>

          {pageData && pageData.totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <span>Página <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.page}</span> de <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.totalPages}</span></span>
                <div className="text-xs text-[var(--text-tertiary)]">Mostrando {pageStart}–{pageEnd} de {pageData.total} registros</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonLink href={createPageHref(baseQuery, 1)} scroll={false} variant="secondary" size="sm" className={pageData.page <= 1 ? "pointer-events-none opacity-50" : ""}>Primeira</ButtonLink>
                <ButtonLink href={createPageHref(baseQuery, pageData.page - 1)} scroll={false} variant="secondary" size="sm" className={pageData.page <= 1 ? "pointer-events-none opacity-50" : ""}><ChevronLeft className="h-4 w-4" />Anterior</ButtonLink>
                <span className="badge-base badge-primary">{pageData.page}</span>
                <ButtonLink href={createPageHref(baseQuery, pageData.page + 1)} scroll={false} variant="secondary" size="sm" className={pageData.page >= pageData.totalPages ? "pointer-events-none opacity-50" : ""}>Próxima<ChevronRight className="h-4 w-4" /></ButtonLink>
                <ButtonLink href={createPageHref(baseQuery, pageData.totalPages)} scroll={false} variant="secondary" size="sm" className={pageData.page >= pageData.totalPages ? "pointer-events-none opacity-50" : ""}>Última</ButtonLink>
                <form method="get" action="/orders" className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1.5">
                  {Array.from(baseQuery.entries()).filter(([key]) => key !== "page").map(([key, value], index) => <input key={`${key}-${value}-${index}`} type="hidden" name={key} value={value} />)}
                  <label htmlFor="goto-page" className="text-xs text-[var(--text-tertiary)]">Ir para</label>
                  <input id="goto-page" type="number" name="page" min={1} max={pageData.totalPages} defaultValue={pageData.page} className="w-16 border-0 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none" />
                  <button type="submit" className="btn-base btn-ghost btn-sm">OK</button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={selectedOrder ? "fixed inset-0 z-30 bg-black/45 backdrop-blur-sm xl:static xl:bg-transparent xl:backdrop-blur-0" : "hidden xl:block"}>
        <div className={selectedOrder ? "absolute inset-0 xl:hidden" : "hidden"}>
          <Link href={closeDetailHref} scroll={false} aria-label="Fechar detalhes" className="block h-full w-full" />
        </div>
        <div className={selectedOrder ? "absolute inset-x-0 bottom-0 top-auto max-h-[88vh] overflow-hidden rounded-t-[1.4rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] xl:static xl:max-h-none xl:rounded-none xl:border-0 xl:shadow-none" : "min-w-0 bg-[var(--surface)]"}>
          {selectedOrder ? <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 xl:hidden"><p className="text-sm font-semibold text-[var(--text-primary)]">Detalhe da O.S.</p><Link href={closeDetailHref} scroll={false} className="btn-base btn-ghost btn-sm h-9 w-9 rounded-full p-0" aria-label="Fechar painel"><X className="h-4 w-4" /></Link></div> : null}
          <div className="max-h-[calc(88vh-3.75rem)] overflow-y-auto xl:sticky xl:top-[5.75rem] xl:max-h-[calc(100vh-5.75rem)]">
            <OrderDetailPanel order={selectedOrder} technicians={technicians} internalUsers={internalUsers} action={action} baseHref={detailHref} success={success} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
