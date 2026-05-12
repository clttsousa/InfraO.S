import Link from "next/link";
import { ClipboardList, History, Search, ShieldCheck } from "lucide-react";
import { AuditEventList } from "@/components/audit/audit-event-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { ButtonLink, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { getAuditEventsPageData, getInternalUsers } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import type { AuditEventsFilters } from "@/types";

export const dynamic = "force-dynamic";

const ACTION_OPTIONS = [
  { label: "Todas as ações", value: "all" },
  { label: "Criação", value: "order.created" },
  { label: "Edição", value: "order.updated" },
  { label: "Mudança de status", value: "order.status_changed" },
  { label: "Mudança de prazo", value: "order.deadline_changed" },
  { label: "Troca de técnico", value: "order.assigned_changed" },
  { label: "Equipe de apoio", value: "order.support_team_changed" },
  { label: "Finalização", value: "order.finalized" },
  { label: "Reabertura", value: "order.reopened" },
  { label: "Cancelamento", value: "order.canceled" },
  { label: "Intervenção criada", value: "intervention.created" },
  { label: "Intervenção editada", value: "intervention.updated" },
  { label: "Status da intervenção", value: "intervention.status_changed" },
  { label: "Intervenção concluída", value: "intervention.concluded" },
  { label: "Intervenção cancelada", value: "intervention.canceled" }
];

const ENTITY_OPTIONS = [
  { label: "Todas as entidades", value: "all" },
  { label: "Ordens", value: "service_order" },
  { label: "Intervenções", value: "infra_event" },
  { label: "Usuários", value: "internal_user" },
  { label: "Técnicos", value: "technician" },
  { label: "Sistema", value: "system" }
];

const AUDIT_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_AUDIT_PAGE_SIZE = 50;

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getPositiveIntParam(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getStringParam(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function sanitizeAuditPageSize(value: string | string[] | undefined) {
  const parsed = getPositiveIntParam(value, DEFAULT_AUDIT_PAGE_SIZE);
  return AUDIT_PAGE_SIZE_OPTIONS.includes(parsed as (typeof AUDIT_PAGE_SIZE_OPTIONS)[number]) ? parsed : DEFAULT_AUDIT_PAGE_SIZE;
}

function buildAuditQuery(filters: AuditEventsFilters) {
  const next = new URLSearchParams();
  if (filters.q) next.set("q", filters.q);
  if (filters.actorUserId) next.set("user", filters.actorUserId);
  if (filters.actionType) next.set("action", filters.actionType);
  if (filters.entityType) next.set("entity", filters.entityType);
  if (filters.from) next.set("from", filters.from);
  if (filters.to) next.set("to", filters.to);
  if (filters.page && filters.page > 1) next.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== DEFAULT_AUDIT_PAGE_SIZE) next.set("pageSize", String(filters.pageSize));
  return next;
}

function buildFilterHref(filters: AuditEventsFilters, removeKey?: string) {
  const next: AuditEventsFilters = { ...filters, page: 1 };
  if (removeKey === "q") next.q = undefined;
  if (removeKey === "user") next.actorUserId = undefined;
  if (removeKey === "action") next.actionType = undefined;
  if (removeKey === "entity") next.entityType = undefined;
  if (removeKey === "from") next.from = undefined;
  if (removeKey === "to") next.to = undefined;
  const query = buildAuditQuery(next).toString();
  return query ? `/audit?${query}` : "/audit";
}

export default async function AuditPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const q = getStringParam(params.q).trim();
  const userId = getStringParam(params.user) || "all";
  const actionType = getStringParam(params.action) || "all";
  const entityType = getStringParam(params.entity) || "all";
  const from = getStringParam(params.from);
  const to = getStringParam(params.to);
  const page = getPositiveIntParam(params.page, 1);
  const pageSize = sanitizeAuditPageSize(params.pageSize);
  const filters: AuditEventsFilters = {
    q: q || undefined,
    actorUserId: userId !== "all" ? userId : undefined,
    actionType: actionType !== "all" ? actionType : undefined,
    entityType: entityType !== "all" ? entityType : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize
  };

  const [users, pageData] = await Promise.all([
    getInternalUsers(),
    getAuditEventsPageData(filters)
  ]);

  const events = pageData.items;
  const totalEvents = pageData.total;
  const todayEvents = pageData.summary.today;
  const uniqueActors = pageData.summary.uniqueActors;
  const baseQuery = buildAuditQuery(filters);

  const chips = [
    q ? { label: `Busca: ${q}`, href: buildFilterHref(filters, "q") } : null,
    userId !== "all" ? { label: `Usuário: ${users.find((item) => item.id === userId)?.name ?? "Selecionado"}`, href: buildFilterHref(filters, "user") } : null,
    actionType !== "all" ? { label: `Ação: ${ACTION_OPTIONS.find((item) => item.value === actionType)?.label ?? actionType}`, href: buildFilterHref(filters, "action") } : null,
    entityType !== "all" ? { label: `Entidade: ${ENTITY_OPTIONS.find((item) => item.value === entityType)?.label ?? entityType}`, href: buildFilterHref(filters, "entity") } : null,
    from ? { label: `De: ${from}`, href: buildFilterHref(filters, "from") } : null,
    to ? { label: `Até: ${to}`, href: buildFilterHref(filters, "to") } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Auditoria" }]} showHome />
      <PageHeader
        eyebrow="Área administrativa"
        title="Auditoria estruturada"
        description="Consulte alterações relevantes por O.S., usuário, tipo de ação e período sem misturar a leitura com a timeline operacional."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Surface className="p-5">
          <div className="app-eyebrow text-[11px] font-medium">Eventos</div>
          <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{totalEvents}</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">No recorte atual</p>
        </Surface>
        <Surface className="p-5">
          <div className="app-eyebrow text-[11px] font-medium">Hoje</div>
          <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{todayEvents}</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Mudanças registradas hoje</p>
        </Surface>
        <Surface className="p-5">
          <div className="app-eyebrow text-[11px] font-medium">Autores</div>
          <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{uniqueActors}</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Usuários diferentes no recorte</p>
        </Surface>
      </div>

      <Surface className="p-5">
        <form className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(220px,1fr)_minmax(140px,0.7fr)_minmax(140px,0.7fr)_auto]">
          <input type="hidden" name="pageSize" value={pageData.pageSize} />
          <TextInput label="Buscar" name="q" defaultValue={q} placeholder="O.S., entidade, ação, usuário ou descrição" />
          <SelectInput
            label="Usuário"
            name="user"
            defaultValue={userId}
            options={[{ label: "Todos", value: "all" }, ...users.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <SelectInput label="Entidade" name="entity" defaultValue={entityType} options={ENTITY_OPTIONS} />
          <SelectInput label="Ação" name="action" defaultValue={actionType} options={ACTION_OPTIONS} />
          <TextInput label="De" name="from" type="date" defaultValue={from} />
          <TextInput label="Até" name="to" type="date" defaultValue={to} />
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-base btn-primary btn-md"><Search className="h-4 w-4" />Filtrar</button>
            <ButtonLink href="/audit" variant="secondary">Limpar</ButtonLink>
          </div>
        </form>

        {chips.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Link key={`${chip.label}-${chip.href}`} href={chip.href} className="filter-chip filter-chip-sm">{chip.label}</Link>
            ))}
          </div>
        ) : null}
      </Surface>

      <Surface className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Eventos de auditoria</h3></div>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Leitura gerencial paginada no banco, com autor, entidade, campo alterado, valores antigo e novo, data e hora exatas.</p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--primary)]" />Trilha estruturada separada da timeline operacional</span>
          </div>
        </div>

        <div className="mt-4">
          <AuditEventList
            events={events}
            emptyTitle="Nenhum evento de auditoria encontrado"
            emptyDescription="Ajuste o recorte atual ou aguarde novas alterações rastreáveis para visualizar a trilha aqui."
          />
          {pageData.total > 0 ? (
            <PaginationFooter
              basePath="/audit"
              baseQuery={baseQuery}
              page={pageData.page}
              totalPages={pageData.totalPages}
              pageSize={pageData.pageSize}
              total={pageData.total}
              pageSizeOptions={AUDIT_PAGE_SIZE_OPTIONS}
              label="evento(s)"
            />
          ) : null}
        </div>
      </Surface>

      <Surface className="p-5">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
          <div>
            <h3 className="app-title text-base font-semibold">Como usar esta tela</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Use a busca para localizar O.S., intervenção, entidade, ação, usuário ou descrição; combine usuário, entidade, ação e período para uma auditoria mais cirúrgica sem carregar o histórico inteiro.</p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
