import type { ReactNode } from "react";
import { Activity, Clock3, Search, ShieldCheck, ShieldUser, UserCog, UserPlus, Users, Wifi, WifiOff } from "lucide-react";
import { createInternalUserAction, resetInternalUserPasswordAction, toggleInternalUserAction, updateInternalUserAction, updateInternalUserRoleAction } from "./actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { UserRoleForm } from "@/components/users/user-role-form";
import { UserToggleForm } from "@/components/users/user-toggle-form";
import { Button, ButtonLink, EmptyState, FeedbackMessage, FormSection, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { getInternalUserById, getInternalUsers } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import type { InternalUserItem } from "@/types";

function normalizeText(value: string) { return value.trim().toLowerCase(); }

function getPresenceBadgeClass(status: InternalUserItem["presenceStatus"]) {
  if (status === "ONLINE") return "badge-success presence-pill presence-pill-online";
  if (status === "AUSENTE") return "badge-warning presence-pill presence-pill-away";
  return "badge-neutral presence-pill";
}

function getAccountBadgeClass(active: boolean) {
  return active ? "badge-success" : "badge-neutral";
}

function getRoleBadgeClass(role: InternalUserItem["role"]) {
  return role === "ADMIN" ? "badge-primary" : "badge-neutral";
}

function getRoleLabel(role: InternalUserItem["role"]) {
  return role === "ADMIN" ? "Admin" : "Operador";
}

function getDateTimeLabel(value?: string | null) {
  return value ? value : "Sem registro";
}

function getRecentTimestamp(user: InternalUserItem) {
  const rawValue = user.lastSeenAtIso ?? user.lastLoginAtIso ?? null;
  if (!rawValue) return 0;
  const parsed = new Date(rawValue).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortUsersByRecentActivity(items: InternalUserItem[]) {
  return [...items].sort((a, b) => {
    const difference = getRecentTimestamp(b) - getRecentTimestamp(a);
    if (difference !== 0) return difference;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function buildActiveFilterChips({
  q,
  accountFilter,
  roleFilter,
  presenceFilter
}: {
  q: string;
  accountFilter: string;
  roleFilter: string;
  presenceFilter: string;
}) {
  const chips: Array<{ label: string; href: string }> = [];

  if (q) {
    const next = new URLSearchParams();
    if (accountFilter !== "all") next.set("status", accountFilter);
    if (roleFilter !== "all") next.set("role", roleFilter);
    if (presenceFilter !== "all") next.set("presence", presenceFilter);
    chips.push({ label: `Busca: ${q}`, href: next.toString() ? `/users?${next.toString()}` : "/users" });
  }

  if (accountFilter !== "all") {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (roleFilter !== "all") next.set("role", roleFilter);
    if (presenceFilter !== "all") next.set("presence", presenceFilter);
    chips.push({ label: accountFilter === "active" ? "Conta: ativa" : "Conta: inativa", href: next.toString() ? `/users?${next.toString()}` : "/users" });
  }

  if (roleFilter !== "all") {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (accountFilter !== "all") next.set("status", accountFilter);
    if (presenceFilter !== "all") next.set("presence", presenceFilter);
    chips.push({ label: roleFilter === "ADMIN" ? "Perfil: administrador" : "Perfil: operador", href: next.toString() ? `/users?${next.toString()}` : "/users" });
  }

  if (presenceFilter !== "all") {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (accountFilter !== "all") next.set("status", accountFilter);
    if (roleFilter !== "all") next.set("role", roleFilter);
    const labels: Record<string, string> = { ONLINE: "Presença: online", AUSENTE: "Presença: ausente", OFFLINE: "Presença: offline" };
    chips.push({ label: labels[presenceFilter] ?? `Presença: ${presenceFilter.toLowerCase()}`, href: next.toString() ? `/users?${next.toString()}` : "/users" });
  }

  return chips;
}

function UserPresenceBadge({ user }: { user: InternalUserItem }) {
  return (
    <span className={`badge-base ${getPresenceBadgeClass(user.presenceStatus)}`}>
      <span className="presence-dot" aria-hidden="true" />
      {user.presenceLabel}
    </span>
  );
}

function UserInfoCell({ user }: { user: InternalUserItem }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{user.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`badge-base ${getAccountBadgeClass(user.active)}`}>{user.active ? "Ativo" : "Inativo"}</span>
        <span className={`badge-base ${getRoleBadgeClass(user.role)}`}>{getRoleLabel(user.role)}</span>
        <UserPresenceBadge user={user} />
      </div>
    </div>
  );
}

function UserDateMeta({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="user-date-meta">
      <div className="user-date-meta-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="user-date-meta-value">{getDateTimeLabel(value)}</div>
    </div>
  );
}

function UserActions({ user }: { user: InternalUserItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ButtonLink href={`/users?edit=${user.id}`} variant="secondary" size="sm">Editar</ButtonLink>
      <ButtonLink href={`/users?reset=${user.id}`} variant="secondary" size="sm">Resetar senha</ButtonLink>
      <UserToggleForm userId={user.id} isActive={user.active} action={toggleInternalUserAction} />
    </div>
  );
}

export default async function UsersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const editId = typeof params.edit === "string" ? params.edit : "";
  const resetId = typeof params.reset === "string" ? params.reset : "";
  const success = typeof params.success === "string" ? decodeURIComponent(params.success) : "";
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const q = typeof params.q === "string" ? params.q : "";
  const accountFilter = typeof params.status === "string" ? params.status : "all";
  const roleFilter = typeof params.role === "string" ? params.role : "all";
  const presenceFilter = typeof params.presence === "string" ? params.presence : "all";

  const users = sortUsersByRecentActivity(await getInternalUsers());
  const editing = editId ? await getInternalUserById(editId) : null;
  const resetting = resetId ? await getInternalUserById(resetId) : null;

  const normalizedQuery = normalizeText(q);
  const filteredUsers = users.filter((user) => {
    const matchesQuery = !normalizedQuery || normalizeText(user.name).includes(normalizedQuery) || normalizeText(user.email).includes(normalizedQuery);
    const matchesAccount = accountFilter === "all" || (accountFilter === "active" ? user.active : !user.active);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesPresence = presenceFilter === "all" || user.presenceStatus === presenceFilter;
    return matchesQuery && matchesAccount && matchesRole && matchesPresence;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const inactiveUsers = totalUsers - activeUsers;
  const onlineUsers = users.filter((user) => user.presenceStatus === "ONLINE").length;
  const awayUsers = users.filter((user) => user.presenceStatus === "AUSENTE").length;
  const activeFilterChips = buildActiveFilterChips({ q, accountFilter, roleFilter, presenceFilter });
  const clearFiltersHref = "/users";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Usuários" }]} showHome />
      <PageHeader eyebrow="Área administrativa" title="Usuários internos" description="Acompanhe a equipe por atividade recente, veja presença em tempo real e saiba com clareza quem entrou por último." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Surface className="p-5">
            <div className="space-y-3">
              {success ? <FeedbackMessage type="success">{success}</FeedbackMessage> : null}
              {error ? <FeedbackMessage type="error">{error}</FeedbackMessage> : null}
            </div>

            <form id="users-admin-form" action={editing ? updateInternalUserAction : createInternalUserAction} className="mt-5 space-y-4">
              <FormStateGuard formId="users-admin-form" />
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <FormSection title={editing ? "Editar usuário" : "Novo usuário interno"} description="Cadastro enxuto com foco em operação, sem poluir a tela com campos que não agregam." icon={editing ? <UserCog className="h-4 w-4 text-[var(--primary)]" /> : <UserPlus className="h-4 w-4 text-[var(--primary)]" />}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput autoFocus label="Nome" name="fullName" defaultValue={editing?.name ?? ""} required />
                  <TextInput label="E-mail" name="email" type="email" defaultValue={editing?.email ?? ""} required />
                  {!editing ? <TextInput label="Senha inicial" name="password" type="password" required /> : null}
                  <SelectInput label="Perfil" name="role" defaultValue={editing?.role ?? "OPERADOR"} options={[{ label: "Administrador", value: "ADMIN" }, { label: "Operador", value: "OPERADOR" }]} />
                </div>
                {!editing ? <label className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" name="isActive" defaultChecked className="rounded border-[var(--border-strong)]" />Cadastrar como ativo</label> : null}
              </FormSection>
              <div className="form-actions-bar">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Controle seguro</p>
                  <p className="field-hint">Admins são protegidos contra remoção indevida quando restar apenas um ativo.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SubmitButton pendingLabel={editing ? "Salvando..." : "Cadastrando..."}>{editing ? "Salvar alterações" : "Cadastrar usuário"}</SubmitButton>
                  {editing ? <ButtonLink href="/users" variant="secondary">Cancelar edição</ButtonLink> : null}
                </div>
              </div>
            </form>
          </Surface>

          {resetting ? (
            <Surface className="p-5">
              <form id="users-reset-form" action={resetInternalUserPasswordAction} className="space-y-4">
                <FormStateGuard formId="users-reset-form" />
                <input type="hidden" name="id" value={resetting.id} />
                <FormSection title="Resetar senha" description={`Redefina a senha de ${resetting.name} com confirmação visual mais clara.`} icon={<ShieldCheck className="h-4 w-4 text-[var(--primary)]" />} compact>
                  <TextInput autoFocus label="Nova senha" name="newPassword" type="password" required description="A sessão do usuário será invalidada automaticamente após a troca." />
                </FormSection>
                <div className="form-actions-bar">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Ação auditável</p>
                    <p className="field-hint">O usuário precisará entrar novamente com a nova senha.</p>
                  </div>
                  <div className="flex gap-2">
                    <SubmitButton pendingLabel="Salvando...">Salvar nova senha</SubmitButton>
                    <ButtonLink href="/users" variant="secondary">Cancelar</ButtonLink>
                  </div>
                </div>
              </form>
            </Surface>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <div className="app-stat-card">
              <div className="app-eyebrow text-[11px] font-medium">Total</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{totalUsers}</div>
            </div>
            <div className="app-stat-card" data-tone="success">
              <div className="app-eyebrow text-[11px] font-medium">Ativos</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{activeUsers}</div>
            </div>
            <div className="app-stat-card">
              <div className="app-eyebrow text-[11px] font-medium">Administradores</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{admins}</div>
            </div>
            <div className="app-stat-card">
              <div className="app-eyebrow text-[11px] font-medium">Inativos</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{inactiveUsers}</div>
            </div>
            <div className="app-stat-card" data-tone="primary">
              <div className="app-eyebrow text-[11px] font-medium">Online agora</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{onlineUsers}</div>
            </div>
            <div className="app-stat-card" data-tone="warning">
              <div className="app-eyebrow text-[11px] font-medium">Ausentes</div>
              <div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{awayUsers}</div>
            </div>
          </div>

          <Surface className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[var(--primary)]" />
                <div>
                  <h3 className="app-title text-lg font-semibold">Busca e filtros</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">A lista é ordenada automaticamente por atividade mais recente.</p>
                </div>
              </div>
              <div className="badge-base badge-neutral">
                <Activity className="h-3.5 w-3.5" />
                Mais recentes primeiro
              </div>
            </div>

            <form className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_170px_180px_180px_auto]">
              <TextInput label="Buscar por nome ou e-mail" name="q" defaultValue={q} placeholder="Ex.: João ou joao@empresa.com" />
              <SelectInput label="Conta" name="status" defaultValue={accountFilter} options={[{ label: "Todas", value: "all" }, { label: "Ativas", value: "active" }, { label: "Inativas", value: "inactive" }]} />
              <SelectInput label="Presença" name="presence" defaultValue={presenceFilter} options={[{ label: "Todas", value: "all" }, { label: "Online", value: "ONLINE" }, { label: "Ausente", value: "AUSENTE" }, { label: "Offline", value: "OFFLINE" }]} />
              <SelectInput label="Perfil" name="role" defaultValue={roleFilter} options={[{ label: "Todos", value: "all" }, { label: "Administrador", value: "ADMIN" }, { label: "Operador", value: "OPERADOR" }]} />
              <div className="flex flex-wrap items-end gap-2 xl:justify-end">
                <Button type="submit">Filtrar</Button>
                <ButtonLink href={clearFiltersHref} variant="secondary">Limpar</ButtonLink>
              </div>
            </form>

            {activeFilterChips.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <ButtonLink key={`${chip.label}-${chip.href}`} href={chip.href} variant="secondary" size="sm" className="rounded-full px-3">
                    {chip.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}

            <div className="mt-4 text-sm text-[var(--text-secondary)]">{filteredUsers.length} usuário(s) encontrados com os filtros atuais.</div>
          </Surface>

          <div className="space-y-4 lg:hidden">
            {filteredUsers.length === 0 ? (
              <Surface className="p-5">
                <EmptyState compact title="Nenhum usuário encontrado" description="Ajuste os filtros ou limpe a busca para voltar a enxergar toda a equipe." />
              </Surface>
            ) : null}

            {filteredUsers.map((user) => (
              <Surface key={user.id} className="p-4 user-list-row user-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <UserInfoCell user={user} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2.5">
                  <UserDateMeta label="Último login" value={user.lastLogin} icon={<Clock3 className="h-3.5 w-3.5" />} />
                  <UserDateMeta label="Última atividade" value={user.lastActivity} icon={<Wifi className="h-3.5 w-3.5" />} />
                  <UserDateMeta label="Criado em" value={user.createdAt} icon={<Users className="h-3.5 w-3.5" />} />
                </div>

                <div className="mt-4">
                  <UserRoleForm userId={user.id} userName={user.name} currentRole={user.role} action={updateInternalUserRoleAction} />
                </div>

                <div className="mt-4">
                  <UserActions user={user} />
                </div>
              </Surface>
            ))}
          </div>

          <Surface className="hidden overflow-hidden lg:block">
            <div className="app-scrollbar overflow-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="table-head">
                  <tr>
                    {["Usuário", "Perfil rápido", "Último login", "Última atividade", "Criado em", "Ações"].map((head) => (
                      <th key={head} className="px-5 py-3 font-medium">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row user-list-row">
                      <td className="px-5 py-4 align-top">
                        <UserInfoCell user={user} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <UserRoleForm userId={user.id} userName={user.name} currentRole={user.role} action={updateInternalUserRoleAction} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <UserDateMeta label="Entrada no sistema" value={user.lastLogin} icon={<Clock3 className="h-3.5 w-3.5" />} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <UserDateMeta label="Atividade registrada" value={user.lastActivity} icon={user.presenceStatus === "OFFLINE" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <UserDateMeta label="Conta criada" value={user.createdAt} icon={<ShieldUser className="h-3.5 w-3.5" />} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <UserActions user={user} />
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
                        <EmptyState compact title="Nenhum usuário encontrado" description="Ajuste filtros, termo de busca ou limpe a pesquisa para voltar ao conjunto completo." />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
