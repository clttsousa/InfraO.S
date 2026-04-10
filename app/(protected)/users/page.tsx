import { Search, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { createInternalUserAction, resetInternalUserPasswordAction, toggleInternalUserAction, updateInternalUserAction, updateInternalUserRoleAction } from "./actions";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { UserRoleForm } from "@/components/users/user-role-form";
import { UserToggleForm } from "@/components/users/user-toggle-form";
import { Button, ButtonLink, EmptyState, FeedbackMessage, FormSection, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { getInternalUserById, getInternalUsers } from "@/lib/data";
import { requireAdmin } from "@/lib/session";

function normalizeText(value: string) { return value.trim().toLowerCase(); }

export default async function UsersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const editId = typeof params.edit === "string" ? params.edit : "";
  const resetId = typeof params.reset === "string" ? params.reset : "";
  const success = typeof params.success === "string" ? decodeURIComponent(params.success) : "";
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : "";
  const q = typeof params.q === "string" ? params.q : "";
  const statusFilter = typeof params.status === "string" ? params.status : "all";
  const roleFilter = typeof params.role === "string" ? params.role : "all";

  const users = await getInternalUsers();
  const editing = editId ? await getInternalUserById(editId) : null;
  const resetting = resetId ? await getInternalUserById(resetId) : null;

  const normalizedQuery = normalizeText(q);
  const filteredUsers = users.filter((user) => {
    const matchesQuery = !normalizedQuery || normalizeText(user.name).includes(normalizedQuery) || normalizeText(user.email).includes(normalizedQuery);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.active : !user.active);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesQuery && matchesStatus && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.active).length;
  const admins = users.filter((user) => user.role === "ADMIN").length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Usuários" }]} showHome />
      <PageHeader eyebrow="Área administrativa" title="Usuários internos" description="Gerencie usuários internos com busca, filtros e ações administrativas." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Surface className="p-5">
            <div className="space-y-3">{success ? <FeedbackMessage type="success">{success}</FeedbackMessage> : null}{error ? <FeedbackMessage type="error">{error}</FeedbackMessage> : null}</div>
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
                  <div className="flex gap-2"><SubmitButton pendingLabel="Salvando...">Salvar nova senha</SubmitButton><ButtonLink href="/users" variant="secondary">Cancelar</ButtonLink></div>
                </div>
              </form>
            </Surface>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="app-stat-card"><div className="app-eyebrow text-[11px] font-medium">Total</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{totalUsers}</div></div>
            <div className="app-stat-card" data-tone="success"><div className="app-eyebrow text-[11px] font-medium">Ativos</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{activeUsers}</div></div>
            <div className="app-stat-card"><div className="app-eyebrow text-[11px] font-medium">Administradores</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{admins}</div></div>
            <div className="app-stat-card"><div className="app-eyebrow text-[11px] font-medium">Inativos</div><div className="app-number mt-3 text-[1.9rem] font-semibold leading-none">{inactiveUsers}</div></div>
          </div>

          <Surface className="p-5">
            <div className="mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Busca e filtros</h3></div>
            <form className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
              <TextInput label="Buscar por nome ou e-mail" name="q" defaultValue={q} placeholder="Ex.: João ou joao@empresa.com" />
              <SelectInput label="Status" name="status" defaultValue={statusFilter} options={[{ label: "Todos", value: "all" }, { label: "Ativos", value: "active" }, { label: "Inativos", value: "inactive" }]} />
              <SelectInput label="Perfil" name="role" defaultValue={roleFilter} options={[{ label: "Todos", value: "all" }, { label: "Administrador", value: "ADMIN" }, { label: "Operador", value: "OPERADOR" }]} />
              <div className="flex flex-wrap items-end gap-2 lg:justify-end"><Button type="submit">Filtrar</Button><ButtonLink href="/users" variant="secondary">Limpar</ButtonLink></div>
            </form>
            <div className="mt-4 text-sm text-[var(--text-secondary)]">{filteredUsers.length} usuário(s) encontrados com os filtros atuais.</div>
          </Surface>

          <div className="space-y-4 lg:hidden">
            {filteredUsers.length === 0 ? <Surface className="p-5"><EmptyState compact title="Nenhum usuário encontrado" description="Ajuste os filtros ou limpe a busca para voltar a enxergar toda a equipe." /></Surface> : null}
            {filteredUsers.map((user) => (
              <Surface key={user.id} className="p-4 user-list-row">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge-base ${user.active ? "badge-success" : "badge-neutral"}`}>{user.active ? "Ativo" : "Inativo"}</span>
                    <span className={`badge-base ${user.role === "ADMIN" ? "badge-primary" : "badge-neutral"}`}>{user.role === "ADMIN" ? "Admin" : "Operador"}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="text-sm text-[var(--text-secondary)]"><p>Último acesso: {user.lastAccess}</p><p className="mt-1">Criado em: {user.createdAt}</p></div>
                  <UserRoleForm userId={user.id} userName={user.name} currentRole={user.role} action={updateInternalUserRoleAction} />
                  <div className="flex flex-wrap gap-2"><ButtonLink href={`/users?edit=${user.id}`} variant="secondary" size="sm">Editar</ButtonLink><ButtonLink href={`/users?reset=${user.id}`} variant="secondary" size="sm">Resetar senha</ButtonLink><UserToggleForm userId={user.id} isActive={user.active} action={toggleInternalUserAction} /></div>
                </div>
              </Surface>
            ))}
          </div>

          <Surface className="hidden overflow-hidden lg:block">
            <div className="app-scrollbar overflow-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="table-head"><tr>{["Nome", "E-mail", "Perfil rápido", "Status", "Último acesso", "Criado em", "Ações"].map((head) => <th key={head} className="px-5 py-3 font-medium">{head}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="table-row user-list-row">
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{user.name}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{user.email}</td>
                      <td className="px-5 py-3"><UserRoleForm userId={user.id} userName={user.name} currentRole={user.role} action={updateInternalUserRoleAction} /></td>
                      <td className="px-5 py-3"><span className={`badge-base ${user.active ? "badge-success" : "badge-neutral"}`}>{user.active ? "Ativo" : "Inativo"}</span></td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{user.lastAccess}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{user.createdAt}</td>
                      <td className="px-5 py-3"><div className="flex flex-wrap gap-2"><ButtonLink href={`/users?edit=${user.id}`} variant="secondary" size="sm">Editar</ButtonLink><ButtonLink href={`/users?reset=${user.id}`} variant="secondary" size="sm">Resetar senha</ButtonLink><UserToggleForm userId={user.id} isActive={user.active} action={toggleInternalUserAction} /></div></td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]"><EmptyState compact title="Nenhum usuário encontrado" description="Ajuste filtros, termo de busca ou limpe a pesquisa para voltar ao conjunto completo." /></td></tr> : null}
                </tbody>
              </table>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
