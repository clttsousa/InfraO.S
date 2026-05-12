import Link from "next/link";
import { ClipboardList, History, Search, ShieldCheck } from "lucide-react";
import { AuditEventList } from "@/components/audit/audit-event-list";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ButtonLink, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { getAuditEvents, getInternalUsers } from "@/lib/data";
import { requireAdmin } from "@/lib/session";

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
  { label: "Cancelamento", value: "order.canceled" }
];

function buildFilterHref(params: { q?: string; user?: string; action?: string; from?: string; to?: string }, removeKey?: string) {
  const next = new URLSearchParams();
  const entries = Object.entries(params);
  for (const [key, value] of entries) {
    if (!value || value === "all" || key === removeKey) continue;
    next.set(key, value);
  }
  const query = next.toString();
  return query ? `/audit?${query}` : "/audit";
}

export default async function AuditPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q : "";
  const userId = typeof params.user === "string" ? params.user : "all";
  const actionType = typeof params.action === "string" ? params.action : "all";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";

  const [users, events] = await Promise.all([
    getInternalUsers(),
    getAuditEvents({
      orderQuery: q || undefined,
      actorUserId: userId !== "all" ? userId : undefined,
      actionType: actionType !== "all" ? actionType : undefined,
      from: from || undefined,
      to: to || undefined,
      limit: 250
    })
  ]);

  const totalEvents = events.length;
  const todayPrefix = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayEvents = events.filter((event) => event.createdAtIso?.startsWith(todayPrefix)).length;
  const uniqueActors = new Set(events.map((event) => event.actorName)).size;

  const chips = [
    q ? { label: `O.S.: ${q}`, href: buildFilterHref({ q, user: userId, action: actionType, from, to }, "q") } : null,
    userId !== "all" ? { label: `Usuário: ${users.find((item) => item.id === userId)?.name ?? "Selecionado"}`, href: buildFilterHref({ q, user: userId, action: actionType, from, to }, "user") } : null,
    actionType !== "all" ? { label: `Ação: ${ACTION_OPTIONS.find((item) => item.value === actionType)?.label ?? actionType}`, href: buildFilterHref({ q, user: userId, action: actionType, from, to }, "action") } : null,
    from ? { label: `De: ${from}`, href: buildFilterHref({ q, user: userId, action: actionType, from, to }, "from") } : null,
    to ? { label: `Até: ${to}`, href: buildFilterHref({ q, user: userId, action: actionType, from, to }, "to") } : null
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
        <form className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(220px,1fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_auto]">
          <TextInput label="O.S. ou ID" name="q" defaultValue={q} placeholder="Ex.: 0025 ou UUID" />
          <SelectInput
            label="Usuário"
            name="user"
            defaultValue={userId}
            options={[{ label: "Todos", value: "all" }, ...users.map((item) => ({ label: item.name, value: item.id }))]}
          />
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
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Leitura gerencial com autor, campo alterado, valores antigo e novo, data e hora exatas.</p>
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
        </div>
      </Surface>

      <Surface className="p-5">
        <div className="flex items-start gap-3">
          <ClipboardList className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
          <div>
            <h3 className="app-title text-base font-semibold">Como usar esta tela</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Use o campo de O.S. para buscar por número, filtre por usuário quando quiser conferir responsabilidade individual e aplique ação/período para auditoria mais cirúrgica.</p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
