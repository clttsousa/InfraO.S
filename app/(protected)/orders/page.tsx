import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Download, Save, TimerReset, Trash2 } from "lucide-react";
import { deleteOrderViewAction, saveOrderViewAction } from "@/app/(protected)/orders/actions";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderWorkspaceClient } from "@/components/orders/order-workspace-client";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ExportButton } from "@/components/shared/export-button";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { ButtonLink, FeedbackMessage, PageHeader, Surface } from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS, ORDER_STATUS_ALL_OPTIONS } from "@/lib/constants";
import { getInternalUsers, getSavedOrderViews, getServiceOrdersPageData, getTechnicians } from "@/lib/data";
import { buildOrderQuery, getParamValue, parseOrderFilters } from "@/lib/filter-params";
import { requireSession } from "@/lib/session";
import type { InternalUserItem, OrderFilters as OrderFiltersType, SavedOrderView, TechnicianItem } from "@/types";

function removeFilterKeys(baseQuery: URLSearchParams, keys: string[]) {
  const next = new URLSearchParams(baseQuery);
  keys.forEach((key) => next.delete(key));
  next.delete("page");
  next.delete("success");
  next.delete("error");
  const query = next.toString();
  return query ? `/orders?${query}` : "/orders";
}


function createPageHref(baseQuery: URLSearchParams, page: number) {
  const url = new URLSearchParams(baseQuery);
  if (page <= 1) url.delete("page"); else url.set("page", String(page));
  return `/orders?${url.toString()}`;
}

function getStatusLabel(status?: string) {
  const item = ORDER_STATUS_ALL_OPTIONS.find((option) => option.value === status);
  return item ? `Status: ${item.label}` : status ? `Status: ${status}` : "";
}

function getPriorityLabel(priority?: string) {
  const item = ORDER_PRIORITY_OPTIONS.find((option) => option.value === priority);
  return item ? `Prioridade: ${item.label}` : priority ? `Prioridade: ${priority}` : "";
}

function buildActiveFilters(filters: OrderFiltersType, technicians: TechnicianItem[], baseQuery: URLSearchParams) {
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

function createQuickStatHref(filters: OrderFiltersType, key: "lateOnly" | "dueToday" | "staleOnly") {
  const nextFilters = {
    ...filters,
    page: 1,
    lateOnly: key === "lateOnly",
    dueToday: key === "dueToday",
    staleOnly: key === "staleOnly"
  };

  const query = buildOrderQuery(nextFilters).toString();
  return query ? `/orders?${query}` : "/orders";
}

function SavedViewsBlock({ savedViews }: { savedViews: SavedOrderView[] }) {
  if (savedViews.length === 0) {
    return (
      <div className="rounded-[var(--radius-control)] border border-dashed border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
        Nenhuma visão salva ainda. Salve uma combinação recorrente para reaplicar mais rápido.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {savedViews.map((view) => (
        <div key={view.id} className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-sm)]">
          <Link href={`/orders${view.queryString ? `?${view.queryString}` : ""}`} className="btn-base btn-ghost btn-sm h-8 px-3 text-sm">
            {view.name}
          </Link>
          <form action={deleteOrderViewAction}>
            <input type="hidden" name="id" value={view.id} />
            <SubmitButton variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0" pendingLabel="">
              <Trash2 className="h-4 w-4" />
            </SubmitButton>
          </form>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, tone, href, caption, compact = false }: { label: string; value: number; tone?: string; href?: string; caption: string; compact?: boolean }) {
  const baseValue = Math.max(value, 1);
  const sparkHeights = [36, 52, 68].map((seed, index) => `${Math.max(24, Math.min(100, ((value || index + 1) / baseValue) * seed))}%`);
  const content = (
    <>
      <div className="app-eyebrow text-[11px] font-medium">{label}</div>
      <div className="app-stat-meta">
        <AnimatedCounter value={value} className="app-number mt-3 text-[1.9rem] font-semibold leading-none" />
        <span className="badge-base badge-primary">ao vivo</span>
      </div>
      <div className="app-stat-spark" aria-hidden="true">
        {sparkHeights.map((height, index) => <span key={`${label}-${index}`} style={{ height }} />)}
      </div>
      <div className="app-stat-caption">{caption}</div>
    </>
  );

  if (href) {
    return <Link href={href} className={`app-stat-card block animate-slideInUp ${compact ? "app-stat-card-compact" : ""}`} data-tone={tone}>{content}</Link>;
  }

  return <div className={`app-stat-card animate-slideInUp ${compact ? "app-stat-card-compact" : ""}`} data-tone={tone}>{content}</div>;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const params = await searchParams;
  const filters = parseOrderFilters(params);
  const success = getParamValue(params, "success");
  const error = getParamValue(params, "error");
  const action = getParamValue(params, "action");

  let pageData = null;
  let technicians: TechnicianItem[] = [];
  let internalUsers: InternalUserItem[] = [];
  let savedViews: SavedOrderView[] = [];
  let loadError: string | null = null;

  try {
    [pageData, technicians, internalUsers, savedViews] = await Promise.all([
      getServiceOrdersPageData(filters),
      getTechnicians(),
      getInternalUsers(),
      getSavedOrderViews(session.id)
    ]);

  } catch (err) {
    console.error("[infraos] orders load error", err);
    loadError = "Não foi possível carregar as ordens agora. Revise a conexão com o banco e tente novamente.";
  }

  const selectedId = getParamValue(params, "selected");
  const baseQuery = buildOrderQuery(filters);
  const exportHref = `/api/exports/orders${baseQuery.toString() ? `?${baseQuery.toString()}` : ""}`;
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
  const clearAllHref = removeFilterKeys(baseQuery, ["q", "technician", "status", "priority", "from", "to", "lateOnly", "dueToday", "staleOnly", "sortBy", "sortDir", "page", "selected", "action", "success", "error"]);
  const pageStart = pageData ? (pageData.page - 1) * pageData.pageSize + 1 : 0;
  const pageEnd = pageData ? Math.min(pageData.total, pageData.page * pageData.pageSize) : 0;

  return (
    <>
      <div className="min-w-0">
        <div className="space-y-3.5 p-4 md:p-5">
          <Breadcrumbs items={[{ label: "Ordens" }]} showHome />
          {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
          {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}
          {loadError ? <FeedbackMessage type="error">{loadError}</FeedbackMessage> : null}
          <PageHeader
            eyebrow="Operação diária"
            title="Ordens de Serviço"
            description="Acompanhe a fila, refine a leitura atual e exporte a visão sem perder contexto."
            className="orders-page-header"
            actions={<><ButtonLink href={exportHref} variant="secondary" size="sm"><Download className="h-4 w-4" />Exportar Excel</ButtonLink><ExportButton data={exportData} filename="ordens-filtradas" formats={["excel", "csv", "json"]} /></>}
          />

          {pageData ? (
            <div className="orders-stats-grid grid grid-cols-2 gap-2.5 xl:grid-cols-4">
              <StatCard label="Total" value={pageData.total} caption="visão atual" compact />
              <StatCard label="Atrasadas" value={lateCount} tone="danger" href={createQuickStatHref(filters, "lateOnly")} caption="fila crítica" compact />
              <StatCard label="Hoje" value={dueTodayCount} tone="warning" href={createQuickStatHref(filters, "dueToday")} caption="vencem hoje" compact />
              <StatCard label="Sem atualização" value={staleCount} href={createQuickStatHref(filters, "staleOnly")} caption="pedem revisão" compact />
            </div>
          ) : null}

          <OrderFilters technicians={technicians} filters={filters} />

          {activeFilters.length ? (
            <Surface className="animate-slideInUp p-3.5">
              <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Filtros ativos</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{activeFilters.length} aplicado(s) nesta visão.</p>
                </div>
                <ButtonLink href={clearAllHref} variant="secondary" size="sm">Limpar tudo</ButtonLink>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {activeFilters.map((chip) => (
                  <Link key={`${chip.label}-${chip.href}`} href={chip.href} className="filter-chip filter-chip-sm">
                    {chip.icon ?? null}
                    {chip.label}
                  </Link>
                ))}
              </div>
            </Surface>
          ) : null}

          <details className="saved-views-panel animate-slideInUp group">
            <summary className="saved-views-summary">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <Save className="h-4 w-4 text-[var(--primary)]" />Visões salvas
                  <span className="badge-base badge-neutral px-2 py-1 text-[11px]">{savedViews.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Salve combinações recorrentes sem deixar a área principal pesada.</p>
              </div>
            </summary>
            <div className="saved-views-body">
              <form action={saveOrderViewAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input type="hidden" name="queryString" value={baseQuery.toString()} />
                <input name="name" required placeholder="Ex.: Minhas atrasadas" className="input-base h-10 text-sm outline-none" />
                <SubmitButton pendingLabel="Salvando..." size="sm"><Save className="h-4 w-4" />Salvar visão</SubmitButton>
              </form>
              <div className="mt-3"><SavedViewsBlock savedViews={savedViews} /></div>
            </div>
          </details>
        </div>

        <div className="px-4 pb-5 md:px-5">
          <OrderWorkspaceClient baseQueryString={baseQuery.toString()} items={pageData?.items ?? []} technicians={technicians} internalUsers={internalUsers} initialSelectedId={selectedId ?? undefined} initialAction={action ?? undefined} success={success ?? undefined} error={error ?? undefined} />

          {pageData && pageData.totalPages > 1 ? (
            <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <span>Página <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.page}</span> de <span className="app-number font-semibold text-[var(--text-primary)]">{pageData.totalPages}</span></span>
                <div className="text-xs text-[var(--text-tertiary)]">Mostrando {pageStart}–{pageEnd} de {pageData.total} registros</div>
              </div>
              <div className="flex items-center gap-2">
                <ButtonLink href={createPageHref(baseQuery, pageData.page - 1)} variant="secondary" size="sm" className={pageData.page <= 1 ? "pointer-events-none opacity-50" : ""}><ChevronLeft className="h-4 w-4" />Anterior</ButtonLink>
                <span className="badge-base badge-primary">{pageData.page}</span>
                <ButtonLink href={createPageHref(baseQuery, pageData.page + 1)} variant="secondary" size="sm" className={pageData.page >= pageData.totalPages ? "pointer-events-none opacity-50" : ""}>Próxima<ChevronRight className="h-4 w-4" /></ButtonLink>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
