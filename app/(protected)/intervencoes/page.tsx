import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Filter, Search, X, XCircle } from "lucide-react";
import { InterventionMobileFilters } from "@/components/interventions/intervention-mobile-filters";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { InterventionWorkspaceClient } from "@/components/interventions/intervention-workspace-client";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ButtonLink, FeedbackMessage, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import { buildInterventionsQuery, getInterventionsPageData, getInternalUsers, parseInterventionFilters } from "@/lib/data";
import { decodeSearchParamMessage } from "@/lib/search-param-feedback";
import type { InternalUserItem, InterventionFilters, InterventionQuickFilter, InterventionSummary } from "@/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type QuickFilter = {
  key: InterventionQuickFilter;
  label: string;
  icon: typeof CalendarClock;
  getValue?: (summary: InterventionSummary) => number;
};

type AppliedFilterChip = {
  key: string;
  label: string;
  href: string;
};

const quickFilters: QuickFilter[] = [
  { key: "all", label: "Todas", icon: CalendarClock },
  { key: "today", label: "Hoje", icon: Clock3, getValue: (summary) => summary.today },
  { key: "tomorrow", label: "Amanhã", icon: CalendarClock, getValue: (summary) => summary.tomorrow },
  { key: "week", label: "Esta semana", icon: Filter, getValue: (summary) => summary.week },
  { key: "late", label: "Atrasadas", icon: AlertTriangle, getValue: (summary) => summary.late },
  { key: "concluded", label: "Concluídas", icon: CheckCircle2, getValue: (summary) => summary.concluded },
  { key: "canceled", label: "Canceladas", icon: XCircle, getValue: (summary) => summary.canceled }
];

const quickLabels: Record<InterventionQuickFilter, string> = {
  all: "Todas",
  today: "Hoje",
  tomorrow: "Amanhã",
  week: "Esta semana",
  late: "Atrasadas",
  concluded: "Concluídas",
  canceled: "Canceladas"
};

function getStringValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function optionLabel(options: readonly { label: string; value: string }[], value?: string) {
  if (!value) return "";
  return options.find((item) => item.value === value)?.label ?? value;
}

function quickFilterHref(filters: InterventionFilters, quick: InterventionQuickFilter) {
  const query = buildInterventionsQuery({ ...filters, quick, page: 1 }).toString();
  return query ? `/intervencoes?${query}` : "/intervencoes";
}

function removeFilterHref(filters: InterventionFilters, keys: Array<keyof InterventionFilters>) {
  const next: InterventionFilters = { ...filters };
  keys.forEach((key) => {
    if (key === "quick") next.quick = "all";
    else delete next[key];
  });
  next.page = 1;
  const query = buildInterventionsQuery(next).toString();
  return query ? `/intervencoes?${query}` : "/intervencoes";
}

function getResponsibleName(users: InternalUserItem[], id?: string) {
  if (!id) return "";
  return users.find((user) => user.id === id)?.name ?? "Selecionado";
}

function getActiveAdvancedFiltersCount(filters: InterventionFilters) {
  return [filters.type, filters.location, filters.status, filters.source, filters.responsibleId, filters.from, filters.to]
    .filter(Boolean)
    .length;
}

function getAppliedFilterChips(filters: InterventionFilters, users: InternalUserItem[]): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = [];
  const quick = filters.quick ?? "all";

  if (quick !== "all") chips.push({ key: "quick", label: `Período: ${quickLabels[quick]}`, href: removeFilterHref(filters, ["quick"]) });
  if (filters.q) chips.push({ key: "q", label: `Busca: ${filters.q}`, href: removeFilterHref(filters, ["q"]) });
  if (filters.type) chips.push({ key: "type", label: `Tipo: ${optionLabel(INTERVENTION_TYPE_OPTIONS, filters.type)}`, href: removeFilterHref(filters, ["type"]) });
  if (filters.location) chips.push({ key: "location", label: `Localidade: ${filters.location}`, href: removeFilterHref(filters, ["location"]) });
  if (filters.status) chips.push({ key: "status", label: `Status: ${optionLabel(INTERVENTION_STATUS_OPTIONS, filters.status)}`, href: removeFilterHref(filters, ["status"]) });
  if (filters.source) chips.push({ key: "source", label: `Origem: ${optionLabel(INTERVENTION_SOURCE_OPTIONS, filters.source)}`, href: removeFilterHref(filters, ["source"]) });
  if (filters.responsibleId) chips.push({ key: "responsible", label: `Responsável: ${getResponsibleName(users, filters.responsibleId)}`, href: removeFilterHref(filters, ["responsibleId"]) });

  if (filters.from || filters.to) {
    const label = filters.from && filters.to
      ? `Período: ${filters.from} a ${filters.to}`
      : filters.from
        ? `A partir de ${filters.from}`
        : `Até ${filters.to}`;
    chips.push({ key: "period", label, href: removeFilterHref(filters, ["from", "to"]) });
  }

  return chips;
}

function HiddenInterventionFilterInputs({ filters, quick, includeQuery = true }: { filters: InterventionFilters; quick: InterventionQuickFilter; includeQuery?: boolean }) {
  return (
    <>
      <input type="hidden" name="quick" value={quick} />
      {includeQuery ? <input type="hidden" name="q" value={filters.q ?? ""} /> : null}
      <input type="hidden" name="type" value={filters.type ?? ""} />
      <input type="hidden" name="location" value={filters.location ?? ""} />
      <input type="hidden" name="status" value={filters.status ?? ""} />
      <input type="hidden" name="source" value={filters.source ?? ""} />
      <input type="hidden" name="responsible" value={filters.responsibleId ?? ""} />
      <input type="hidden" name="from" value={filters.from ?? ""} />
      <input type="hidden" name="to" value={filters.to ?? ""} />
    </>
  );
}

function StatCard({ label, value, tone, href }: { label: string; value: number; tone: string; href: string }) {
  return (
    <Link href={href} className="app-stat-card block animate-slideInUp" data-tone={tone}>
      <div className="app-eyebrow text-[11px] font-medium">{label}</div>
      <div className="app-stat-meta">
        <AnimatedCounter value={value} className="app-number mt-3 text-[2rem] font-semibold leading-none" />
        <span className="badge-base badge-neutral">abrir</span>
      </div>
      <div className="app-stat-caption">intervenções monitoradas</div>
    </Link>
  );
}

function MobileSummaryStrip({ summary, filters }: { summary: InterventionSummary; filters: InterventionFilters }) {
  const items = [
    { label: "Hoje", value: summary.today, href: quickFilterHref(filters, "today") },
    { label: "Amanhã", value: summary.tomorrow, href: quickFilterHref(filters, "tomorrow") },
    { label: "Semana", value: summary.week, href: quickFilterHref(filters, "week") },
    { label: "Atrasadas", value: summary.late, href: quickFilterHref(filters, "late") },
    { label: "Concluídas", value: summary.concluded, href: quickFilterHref(filters, "concluded") }
  ];

  return (
    <div className="intervention-summary-strip md:hidden" aria-label="Resumo de intervenções">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="intervention-summary-chip">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </Link>
      ))}
    </div>
  );
}

function QuickFilterStrip({ filters, summary, quick, mobile = false }: { filters: InterventionFilters; summary: InterventionSummary; quick: InterventionQuickFilter; mobile?: boolean }) {
  return (
    <div className={mobile ? "intervention-quick-strip md:hidden" : "hidden flex-wrap gap-2 md:flex"}>
      {quickFilters.map((item) => {
        const Icon = item.icon;
        const active = quick === item.key;
        const value = item.getValue ? item.getValue(summary) : undefined;
        return (
          <Link
            key={item.key}
            href={quickFilterHref(filters, item.key)}
            aria-current={active ? "page" : undefined}
            className={mobile ? `intervention-quick-chip ${active ? "is-active" : ""}` : `btn-base btn-sm ${active ? "btn-primary" : "btn-secondary"}`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {typeof value === "number" ? <strong>{value}</strong> : null}
          </Link>
        );
      })}
    </div>
  );
}

function AppliedFilterChips({ chips }: { chips: AppliedFilterChip[] }) {
  if (!chips.length) return null;

  return (
    <div className="intervention-applied-filters" aria-label="Filtros aplicados">
      {chips.map((chip) => (
        <Link key={chip.key} href={chip.href} className="filter-chip filter-chip-sm">
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </Link>
      ))}
    </div>
  );
}

export default async function InterventionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const filters = parseInterventionFilters(params);
  const selectedId = getStringValue(params.selected);
  const action = getStringValue(params.action);
  const success = getStringValue(params.success);
  const error = getStringValue(params.error);
  const baseQuery = buildInterventionsQuery(filters);
  const quick = filters.quick ?? "all";

  let data = null;
  let internalUsers: InternalUserItem[] = [];
  let loadError: string | null = null;

  try {
    [data, internalUsers] = await Promise.all([getInterventionsPageData(filters), getInternalUsers()]);
  } catch (loadException) {
    console.error("[infraos] interventions load error", loadException);
    loadError = loadException instanceof Error
      ? loadException.message
      : "Não foi possível carregar intervenções. Verifique se a migration V6.7 foi aplicada.";
    internalUsers = [];
  }

  const summary = data?.summary ?? { today: 0, tomorrow: 0, week: 0, late: 0, concluded: 0, canceled: 0 };
  const items = data?.items ?? [];
  const appliedFilters = getAppliedFilterChips(filters, internalUsers);
  const activeAdvancedFiltersCount = getActiveAdvancedFiltersCount(filters);

  return (
    <div className="interventions-page app-content-fluid space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Intervenções" }]} showHome />

      {loadError ? <FeedbackMessage type="error" title="Módulo indisponível">{loadError}</FeedbackMessage> : null}
      {success ? <FeedbackMessage type="success">{decodeSearchParamMessage(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeSearchParamMessage(error)}</FeedbackMessage> : null}

      <div className="interventions-mobile-header md:hidden">
        <p className="app-eyebrow text-[0.68rem] font-medium">Agenda operacional</p>
        <h2 className="app-title mt-1 text-[1.42rem] font-semibold leading-tight">Intervenções</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Busca rápida, filtros compactos e lista logo abaixo.</p>
      </div>

      <div className="hidden md:block">
        <PageHeader
          eyebrow="Agenda operacional da infraestrutura"
          title="Intervenções Programadas"
          description="Registre avisos recebidos por WhatsApp, acompanhe trocas de postes, obras de terceiros e desligamentos programados sem depender da memória da equipe."
        />
      </div>

      <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Hoje" value={summary.today} tone="neutral" href={quickFilterHref(filters, "today")} />
        <StatCard label="Amanhã" value={summary.tomorrow} tone="warning" href={quickFilterHref(filters, "tomorrow")} />
        <StatCard label="Esta semana" value={summary.week} tone="neutral" href={quickFilterHref(filters, "week")} />
        <StatCard label="Atrasadas" value={summary.late} tone="danger" href={quickFilterHref(filters, "late")} />
        <StatCard label="Concluídas" value={summary.concluded} tone="success" href={quickFilterHref(filters, "concluded")} />
      </div>

      <section className="interventions-mobile-compact md:hidden" aria-label="Filtros compactos de intervenções">
        <div className="flex items-center gap-2">
          <form className="relative min-w-0 flex-1" action="/intervencoes">
            <HiddenInterventionFilterInputs filters={filters} quick={quick} includeQuery={false} />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <label className="sr-only" htmlFor="intervention-mobile-search">Buscar intervenções</label>
            <input
              id="intervention-mobile-search"
              className="input-base h-11 w-full rounded-full pl-9 pr-3 text-sm outline-none"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Buscar intervenção"
              type="search"
            />
          </form>
          <InterventionMobileFilters filters={filters} internalUsers={internalUsers} quick={quick} activeCount={activeAdvancedFiltersCount} />
        </div>
        <QuickFilterStrip filters={filters} summary={summary} quick={quick} mobile />
        <MobileSummaryStrip summary={summary} filters={filters} />
        <AppliedFilterChips chips={appliedFilters} />
      </section>

      <Surface className="hidden p-4 md:block">
        <div className="flex flex-col gap-4">
          <QuickFilterStrip filters={filters} summary={summary} quick={quick} />

          <form className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-8" action="/intervencoes">
            <input type="hidden" name="quick" value={quick} />
            <TextInput label="Busca" name="q" defaultValue={filters.q ?? ""} placeholder="Título, localidade ou mensagem" />
            <SelectInput label="Tipo" name="type" defaultValue={filters.type ?? ""} options={[{ label: "Todos", value: "" }, ...INTERVENTION_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
            <TextInput label="Localidade" name="location" defaultValue={filters.location ?? ""} placeholder="Pirajuba" />
            <SelectInput label="Status" name="status" defaultValue={filters.status ?? ""} options={[{ label: "Todos", value: "" }, ...INTERVENTION_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
            <SelectInput label="Origem" name="source" defaultValue={filters.source ?? ""} options={[{ label: "Todas", value: "" }, ...INTERVENTION_SOURCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
            <SelectInput label="Responsável" name="responsible" defaultValue={filters.responsibleId ?? ""} options={[{ label: "Todos", value: "" }, ...internalUsers.filter((user) => user.active).map((user) => ({ label: user.name, value: user.id }))]} />
            <TextInput label="De" name="from" type="date" defaultValue={filters.from ?? ""} />
            <TextInput label="Até" name="to" type="date" defaultValue={filters.to ?? ""} />
            <div className="flex items-end gap-2 xl:col-span-2">
              <button type="submit" className="btn-base btn-primary btn-md flex-1"><Search className="h-4 w-4" />Filtrar</button>
              <ButtonLink href="/intervencoes" variant="secondary">Limpar</ButtonLink>
            </div>
          </form>
          <AppliedFilterChips chips={appliedFilters} />
        </div>
      </Surface>

      <Surface className="interventions-list-surface p-3 md:p-5">
        <InterventionWorkspaceClient
          baseQueryString={baseQuery.toString()}
          items={items}
          internalUsers={internalUsers}
          initialSelectedId={selectedId || undefined}
          initialAction={action || undefined}
          success={success || undefined}
          error={error || undefined}
        />
        {data && data.total > 0 ? (
          <PaginationFooter
            basePath="/intervencoes"
            baseQuery={baseQuery}
            page={data.page}
            totalPages={data.totalPages}
            pageSize={data.pageSize}
            total={data.total}
            pageSizeOptions={[20, 50, 100]}
            label="intervenção(ões)"
          />
        ) : null}
      </Surface>
    </div>
  );
}
