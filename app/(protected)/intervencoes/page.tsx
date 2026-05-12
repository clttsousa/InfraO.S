import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Filter, Search, XCircle } from "lucide-react";
import { InterventionWorkspaceClient } from "@/components/interventions/intervention-workspace-client";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ButtonLink, FeedbackMessage, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import { buildInterventionsQuery, getInterventionsPageData, getInternalUsers, parseInterventionFilters } from "@/lib/data";
import type { InternalUserItem, InterventionFilters, InterventionQuickFilter, InterventionSummary } from "@/types";
import { decodeSearchParamMessage } from "@/lib/search-param-feedback";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type QuickFilter = {
  key: InterventionQuickFilter;
  label: string;
  icon: typeof CalendarClock;
  getValue?: (summary: InterventionSummary) => number;
};

const quickFilters: QuickFilter[] = [
  { key: "all", label: "Todas", icon: CalendarClock },
  { key: "today", label: "Hoje", icon: Clock3, getValue: (summary) => summary.today },
  { key: "tomorrow", label: "Amanhã", icon: CalendarClock, getValue: (summary) => summary.tomorrow },
  { key: "week", label: "Esta semana", icon: Filter, getValue: (summary) => summary.week },
  { key: "late", label: "Atrasadas", icon: AlertTriangle, getValue: (summary) => summary.late },
  { key: "concluded", label: "Concluídas", icon: CheckCircle2, getValue: (summary) => summary.concluded },
  { key: "canceled", label: "Canceladas", icon: XCircle }
];

function getStringValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function quickFilterHref(filters: InterventionFilters, quick: InterventionQuickFilter) {
  const query = buildInterventionsQuery({ ...filters, quick }).toString();
  return query ? `/intervencoes?${query}` : "/intervencoes";
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

  const summary = data?.summary ?? { today: 0, tomorrow: 0, week: 0, late: 0, concluded: 0 };
  const items = data?.items ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Intervenções" }]} showHome />

      {loadError ? <FeedbackMessage type="error" title="Módulo indisponível">{loadError}</FeedbackMessage> : null}
      {success ? <FeedbackMessage type="success">{decodeSearchParamMessage(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeSearchParamMessage(error)}</FeedbackMessage> : null}

      <PageHeader
        eyebrow="Agenda operacional da infraestrutura"
        title="Intervenções Programadas"
        description="Registre avisos recebidos por WhatsApp, acompanhe trocas de postes, obras de terceiros e desligamentos programados sem depender da memória da equipe."
      />

      <div className="dashboard-stats-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Hoje" value={summary.today} tone="neutral" href={quickFilterHref(filters, "today")} />
        <StatCard label="Amanhã" value={summary.tomorrow} tone="warning" href={quickFilterHref(filters, "tomorrow")} />
        <StatCard label="Esta semana" value={summary.week} tone="neutral" href={quickFilterHref(filters, "week")} />
        <StatCard label="Atrasadas" value={summary.late} tone="danger" href={quickFilterHref(filters, "late")} />
        <StatCard label="Concluídas" value={summary.concluded} tone="success" href={quickFilterHref(filters, "concluded")} />
      </div>

      <Surface className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => {
              const Icon = item.icon;
              const active = quick === item.key;
              const value = item.getValue ? item.getValue(summary) : undefined;
              return (
                <Link key={item.key} href={quickFilterHref(filters, item.key)} className={`btn-base btn-sm ${active ? "btn-primary" : "btn-secondary"}`}>
                  <Icon className="h-4 w-4" />
                  {item.label}{typeof value === "number" ? ` · ${value}` : ""}
                </Link>
              );
            })}
          </div>

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
        </div>
      </Surface>

      <Surface className="p-4 md:p-5">
        <InterventionWorkspaceClient
          baseQueryString={baseQuery.toString()}
          items={items}
          internalUsers={internalUsers}
          initialSelectedId={selectedId || undefined}
          initialAction={action || undefined}
          success={success || undefined}
          error={error || undefined}
        />
      </Surface>
    </div>
  );
}
