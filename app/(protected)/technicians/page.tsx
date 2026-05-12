import { Phone, Wrench } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { ButtonLink, FeedbackMessage, FormSection, PageHeader, SelectInput, Surface, TextInput } from "@/components/shared/ui";
import { getTechnicianById, getTechnicians } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import { createTechnicianAction, toggleTechnicianAction, updateTechnicianAction } from "./actions";
import { decodeSearchParamMessage } from "@/lib/search-param-feedback";

export const dynamic = "force-dynamic";

export default async function TechniciansPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const editId = typeof params.edit === "string" ? params.edit : "";
  const success = typeof params.success === "string" ? decodeSearchParamMessage(params.success) : "";
  const error = typeof params.error === "string" ? decodeSearchParamMessage(params.error) : "";
  const technicians = await getTechnicians();
  const editing = editId ? await getTechnicianById(editId) : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Técnicos" }]} showHome />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface className="p-5">
          <PageHeader title="Técnicos" description="Cadastro e gestão da equipe responsável pelas ordens." />
          <div className="mt-4 space-y-3">{success ? <FeedbackMessage type="success">{success}</FeedbackMessage> : null}{error ? <FeedbackMessage type="error">{error}</FeedbackMessage> : null}</div>
          <form id="technician-form" action={editing ? updateTechnicianAction : createTechnicianAction} className="mt-5 space-y-4">
            <FormStateGuard formId="technician-form" />
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <FormSection title={editing ? "Editar técnico" : "Novo técnico"} description="Preencha apenas o necessário para operação, sem sobrecarregar a tela com campos irrelevantes." icon={<Wrench className="h-4 w-4 text-[var(--primary)]" />}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput autoFocus label="Nome do técnico" name="fullName" defaultValue={editing?.name ?? ""} required />
                <TextInput label="Telefone" name="phone" defaultValue={editing?.phone ?? ""} />
              </div>
              <div className="mt-4">
                {!editing ? (
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" name="isActive" defaultChecked className="rounded border-[var(--border-strong)]" />Cadastrar como ativo</label>
                ) : (
                  <SelectInput label="Status atual" name="statusPreview" defaultValue={editing.active ? "ativo" : "inativo"} options={[{ label: editing.active ? "Ativo" : "Inativo", value: editing.active ? "ativo" : "inativo" }]} />
                )}
              </div>
            </FormSection>
            <div className="form-actions-bar">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Cadastro enxuto</p>
                <p className="field-hint">Sem impacto nas permissões do sistema, só na distribuição da operação.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SubmitButton pendingLabel={editing ? "Salvando..." : "Cadastrando..."}>{editing ? "Salvar alterações" : "Cadastrar técnico"}</SubmitButton>
                {editing ? <ButtonLink href="/technicians" variant="secondary">Cancelar edição</ButtonLink> : null}
              </div>
            </div>
          </form>
        </Surface>

        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Equipe</h3></div>
          </div>
          <div className="app-scrollbar overflow-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="table-head"><tr>{["Nome", "Telefone", "Abertas", "Atrasadas", "Pendentes", "Finalizadas", "Status", "Ações"].map((head) => <th key={head} className="px-5 py-3 font-medium">{head}</th>)}</tr></thead>
              <tbody>
                {technicians.map((technician) => (
                  <tr key={technician.id} className="table-row user-list-row">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{technician.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{technician.phone || "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{technician.openOrders}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{technician.lateOrders}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{technician.pendingOrders}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{technician.finishedOrders}</td>
                    <td className="px-5 py-3"><span className={`badge-base ${technician.active ? "badge-success" : "badge-neutral"}`}>{technician.active ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-5 py-3"><div className="flex flex-wrap gap-2"><ButtonLink href={`/technicians?edit=${technician.id}`} variant="secondary" size="sm">Editar</ButtonLink><form action={toggleTechnicianAction}><input type="hidden" name="id" value={technician.id} /><input type="hidden" name="nextActive" value={technician.active ? "false" : "true"} /><SubmitButton variant="secondary" size="sm" pendingLabel={technician.active ? "Inativando..." : "Ativando..."}>{technician.active ? "Inativar" : "Ativar"}</SubmitButton></form></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
}
