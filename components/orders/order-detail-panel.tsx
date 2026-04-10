import type { ReactNode } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardPen,
  History,
  MapPin,
  MessageSquare,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  UserRound,
  X
} from "lucide-react";
import {
  addServiceOrderNoteAction,
  cancelServiceOrderAction,
  finalizeServiceOrderAction,
  reopenServiceOrderAction,
  updateServiceOrderAction,
  updateServiceOrderStatusAction
} from "@/app/(protected)/orders/actions";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import { OrderActionOverlay } from "@/components/orders/order-action-overlay";
import { SupportTechnicianSelector } from "@/components/orders/support-technician-selector";
import { FormStateGuard } from "@/components/shared/form-state-guard";
import { SubmitButton } from "@/components/shared/form-submit-button";
import {
  ButtonLink,
  EmptyState,
  FeedbackMessage,
  FormHint,
  FormSection,
  SelectInput,
  StatLine,
  Surface,
  TextAreaInput,
  TextInput
} from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS, ORDER_STATUS_OPTIONS } from "@/lib/constants";
import type { InternalUserItem, ServiceOrderDetail, ServiceOrderLogItem, TechnicianItem } from "@/types";

function buildHref(baseHref: string, action?: string) {
  if (!action) return baseHref;
  return `${baseHref}${baseHref.includes("?") ? "&" : "?"}action=${action}`;
}

function closeActionHref(baseHref: string) {
  return baseHref.replace(/([?&])action=[^&]+&?/, "$1").replace(/[?&]$/, "");
}

function actionTitle(action?: string) {
  switch (action) {
    case "edit": return "Editar O.S.";
    case "status": return "Alterar status";
    case "note": return "Adicionar observação";
    case "finish": return "Finalizar O.S.";
    case "reopen": return "Reabrir O.S.";
    case "cancel": return "Cancelar O.S.";
    default: return "Ação rápida";
  }
}

function getLogMeta(log: ServiceOrderLogItem) {
  const base = log.description.toLowerCase();
  if (base.includes("finalizou")) return { icon: CheckCircle2, tone: "success", label: "Fechamento" };
  if (base.includes("cancel")) return { icon: Ban, tone: "danger", label: "Cancelamento" };
  if (base.includes("reabriu")) return { icon: RotateCcw, tone: "info", label: "Reabertura" };
  if (base.includes("status")) return { icon: RefreshCw, tone: "warning", label: "Mudança de status" };
  if (base.includes("observação")) return { icon: MessageSquare, tone: "info", label: "Observação" };
  if (base.includes("editou") || base.includes("alterou")) return { icon: Pencil, tone: "primary", label: "Edição" };
  return { icon: History, tone: "neutral", label: "Registro" };
}

function ActionFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-1 pt-4">
      {children}
    </div>
  );
}

function DetailTimelineCard({ title, subtitle, note, when, tone, icon }: { title: string; subtitle: string; note?: string | null; when: string; tone: string; icon: ReactNode }) {
  return (
    <div className={`timeline-card timeline-card-${tone}`}>
      <div className={`timeline-icon timeline-icon-${tone}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
            <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</div>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">{when}</div>
        </div>
        {note ? <div className="mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]">{note}</div> : null}
      </div>
    </div>
  );
}

export function OrderDetailPanel({ order, technicians, internalUsers, action, baseHref, success, error }: { order: ServiceOrderDetail | null; technicians: TechnicianItem[]; internalUsers: InternalUserItem[]; action?: string; baseHref: string; success?: string; error?: string; }) {
  if (!order) {
    return <div className="p-6"><EmptyState compact title="Nenhuma O.S. selecionada" description="Selecione uma ordem na tabela para abrir o painel lateral de detalhes e operar sem sair da listagem." /></div>;
  }

  const activeTechnicians = technicians.filter((item) => item.active);
  const activeUsers = internalUsers.filter((item) => item.active);
  const closeHref = closeActionHref(baseHref);
  const canReopen = order.rawStatus === "FINALIZADA" || order.rawStatus === "CANCELADA";
  const canFinishOrCancel = order.rawStatus !== "FINALIZADA" && order.rawStatus !== "CANCELADA";

  return (
    <div className="relative space-y-6 p-6 animate-fadeIn">
      {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}

      <div>
        <p className="app-eyebrow text-xs font-medium">Detalhe da O.S.</p>
        <h2 className="app-title mt-1 text-[1.9rem] font-semibold leading-tight">O.S. {order.number}</h2>
        <p className="app-text-secondary mt-1">Cliente: {order.clientName ?? "Sem cliente vinculado"}</p>
      </div>

      {order.isLate ? <div className="alert-danger"><TriangleAlert className="h-4 w-4" />Prazo vencido. Esta O.S. está atrasada, mas o status real continua <span className="font-semibold">{order.rawStatus}</span>.</div> : null}
      {!order.isLate && order.isDueToday ? <div className="alert-warning">Atenção: esta O.S. vence hoje e ainda não foi encerrada.</div> : null}
      {order.isStale ? <div className="alert-neutral">Sem atualização recente nas últimas 24 horas.</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <PriorityBadge priority={order.priority} />
        {order.locationLink ? <a href={order.locationLink} target="_blank" rel="noreferrer" className="btn-base btn-ghost btn-md app-link px-3"><MapPin className="h-4 w-4" />Ver localização</a> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={buildHref(baseHref, "edit")} variant="secondary"><Pencil className="h-4 w-4" />Editar O.S.</ButtonLink>
        {!canReopen ? <ButtonLink href={buildHref(baseHref, "status")} variant="secondary"><RefreshCw className="h-4 w-4" />Alterar status</ButtonLink> : null}
        <ButtonLink href={buildHref(baseHref, "note")} variant="secondary"><MessageSquare className="h-4 w-4" />Adicionar observação</ButtonLink>
        {canFinishOrCancel ? (
          <>
            <ButtonLink href={buildHref(baseHref, "finish")}><CheckCircle2 className="h-4 w-4" />Finalizar</ButtonLink>
            <ButtonLink href={buildHref(baseHref, "cancel")} variant="danger"><Ban className="h-4 w-4" />Cancelar</ButtonLink>
          </>
        ) : null}
        {canReopen ? <ButtonLink href={buildHref(baseHref, "reopen")} variant="secondary"><RotateCcw className="h-4 w-4" />Reabrir</ButtonLink> : null}
      </div>

      <Surface className="p-5">
        <h3 className="app-title text-lg font-semibold">Informações da O.S.</h3>
        <div className="mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <StatLine label="Número da O.S." value={order.number} />
          <StatLine label="Data de abertura" value={order.openedAt} />
          <StatLine label="Usuário da abertura" value={order.openedBy} />
          <StatLine label="Cliente" value={order.clientName ?? "Não informado"} />
          <StatLine label="Código do cliente" value={order.clientCode ?? "Não informado"} />
          <StatLine label="Endereço" value={order.address ?? "Não informado"} />
        </div>
        <div className="app-surface-muted mt-3 rounded-[var(--radius-control)] p-3 text-sm text-[var(--text-secondary)]">{order.openingDescriptionRaw}</div>
      </Surface>

      <Surface className="p-5">
        <h3 className="app-title text-lg font-semibold">Detalhes internos</h3>
        <div className="mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <StatLine label="Técnico responsável" value={order.assignedTechnician} />
          <StatLine label="Equipe de apoio" value={order.supportTechnicians.length ? order.supportTechnicians.map((item) => item.name).join(", ") : "Sem apoio"} />
          <StatLine label="Responsável interno" value={order.internalOwner} />
          <StatLine label="Prazo" value={order.deadline} />
          <StatLine label="Criado por" value={order.createdByName} />
          <StatLine label="Criado em" value={order.createdAt} />
          <StatLine label="Atualizado em" value={order.updatedAt} />
          <StatLine label="Última atualização por" value={order.updatedByName} />
          <StatLine label="Status no banco" value={order.rawStatus} />
        </div>
        <div className="app-surface-muted mt-3 rounded-[var(--radius-control)] p-3 text-sm text-[var(--text-secondary)]">{order.internalNote}</div>
        {order.finalizedAt ? <div className="alert-success mt-3">Finalizada em {order.finalizedAt}{order.finalizedByName ? ` por ${order.finalizedByName}` : ""}.{order.closingNote ? <div className="mt-1 text-[var(--text-primary)]">Fechamento: {order.closingNote}</div> : null}</div> : null}
        {order.canceledAt ? <div className="alert-danger mt-3">Cancelada em {order.canceledAt}{order.canceledByName ? ` por ${order.canceledByName}` : ""}.{order.cancellationNote ? <div className="mt-1 text-[var(--text-primary)]">Motivo: {order.cancellationNote}</div> : null}</div> : null}
        {order.reopenedAt ? <div className="alert-info mt-3">Reaberta em {order.reopenedAt}{order.reopenedByName ? ` por ${order.reopenedByName}` : ""}.</div> : null}
      </Surface>

      <Surface className="p-5">
        <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Observações internas</h3></div>
        {order.notes.length === 0 ? <div className="mt-4"><EmptyState compact title="Sem observações" description="Adicione notas internas para registrar contexto operacional adicional." /></div> : <div className="mt-4 space-y-3">{order.notes.map((note) => <DetailTimelineCard key={note.id} title={note.author} subtitle="Registrou uma observação interna nesta ordem." note={note.note} when={note.when} tone="info" icon={<MessageSquare className="h-4 w-4" />} />)}</div>}
      </Surface>

      <Surface className="p-5">
        <div className="flex items-center gap-2"><History className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Timeline da O.S.</h3></div>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Leitura cronológica refinada das alterações, reaberturas, status e edições relevantes.</p>
        {order.logs.length === 0 ? <div className="mt-4"><EmptyState compact title="Sem histórico" description="Quando houver ações na ordem, a timeline ficará disponível aqui." /></div> : <div className="mt-4 space-y-3">{order.logs.map((log) => { const meta = getLogMeta(log); const Icon = meta.icon; return <DetailTimelineCard key={log.id} title={meta.label} subtitle={`${log.actor} · ${log.description}`} note={log.note} when={log.when} tone={meta.tone} icon={<Icon className="h-4 w-4" />} />; })}</div>}
      </Surface>

      <OrderActionOverlay isOpen={Boolean(action)} closeHref={closeHref}>
        <div className="app-panel animate-scaleIn relative z-[73] w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[var(--radius-modal)] p-5 shadow-[var(--shadow-lg)]">
          <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-4 pt-1">
            <div>
              <p className="app-eyebrow text-xs font-medium">Ação rápida</p>
              <h3 className="app-title mt-1 text-xl font-semibold">{actionTitle(action)}</h3>
            </div>
            <ButtonLink href={closeHref} variant="ghost" size="sm" className="px-2.5 py-2"><X className="h-4 w-4" /></ButtonLink>
          </div>

              {action === "edit" ? (
                <form id="order-edit-form" action={updateServiceOrderAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-edit-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "edit")} />
                  <FormHint>Layout reorganizado para editar dados sem perder contexto. Campos obrigatórios vêm primeiro.</FormHint>
                  <FormSection title="Dados principais" description="Revise abertura, cliente e descrição antes de salvar." icon={<ClipboardPen className="h-4 w-4 text-[var(--primary)]" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextInput autoFocus label="Número da O.S." name="orderNumber" defaultValue={order.number} required />
                      <TextInput label="Data de abertura" name="openedAt" type="datetime-local" defaultValue={order.openedAtInput} />
                      <TextInput label="Usuário da abertura" name="openedBy" defaultValue={order.openedBy === "—" ? "" : order.openedBy} />
                      <TextInput label="Código do cliente" name="clientCode" defaultValue={order.clientCode ?? ""} />
                      <TextInput label="Nome do cliente" name="clientName" defaultValue={order.clientName ?? ""} />
                      <TextInput label="Localização" name="locationLink" defaultValue={order.locationLink ?? ""} />
                      <div className="md:col-span-2"><TextInput label="Endereço" name="addressText" defaultValue={order.address ?? ""} /></div>
                      <div className="md:col-span-2"><TextAreaInput label="Descrição da abertura" name="openingDescription" defaultValue={order.openingDescriptionRaw} rows={4} required /></div>
                    </div>
                  </FormSection>
                  <FormSection title="Tratativa interna" description="Responsáveis, prioridade e prazo visíveis no mesmo bloco." icon={<Sparkles className="h-4 w-4 text-[var(--primary)]" />} compact>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SelectInput label="Técnico responsável" name="technicianId" defaultValue={order.technicianId ?? ""} options={[{ label: "Selecione um técnico", value: "" }, ...activeTechnicians.map((item) => ({ label: item.name, value: item.id }))]} description="Quem puxa a execução principal da ordem." />
                      <SelectInput label="Responsável interno" name="internalOwnerId" defaultValue={order.internalOwnerId ?? ""} options={activeUsers.map((item) => ({ label: item.name, value: item.id }))} required />
                      <SelectInput label="Prioridade" name="priority" defaultValue={order.rawPriority} options={ORDER_PRIORITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
                      <TextInput label="Prazo" name="deadlineAt" type="datetime-local" defaultValue={order.deadlineInput} />
                    </div>
                    <div className="mt-4"><SupportTechnicianSelector technicians={activeTechnicians} selectedIds={order.supportTechnicianIds} /></div>
                    <div className="mt-4"><TextAreaInput label="Observação interna" name="internalNote" defaultValue={order.internalNote === "Sem observação interna." ? "" : order.internalNote} rows={4} /></div>
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Salvar com segurança</p><p className="field-hint">O histórico registra a edição principal e mudanças relevantes.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton pendingLabel="Salvando...">Salvar alterações</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "status" ? (
                <form id="order-status-form" action={updateServiceOrderStatusAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-status-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "status")} />
                  <FormSection title="Mudança de status" description="Altere o estado da ordem e registre observação se houver contexto importante." icon={<RefreshCw className="h-4 w-4 text-[var(--primary)]" />} compact>
                    <SelectInput label="Novo status" name="status" defaultValue={order.rawStatus} options={ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} required />
                    <div className="mt-4"><TextAreaInput label="Observação da alteração" name="note" rows={4} description="Opcional, mas útil para explicar a transição para o time." /></div>
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Mudança auditável</p><p className="field-hint">O sistema registra o status anterior e o novo status.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton pendingLabel="Salvando...">Salvar status</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "note" ? (
                <form id="order-note-form" action={addServiceOrderNoteAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-note-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "note")} />
                  <FormSection title="Nova observação" description="Use para registrar contexto operacional adicional sem alterar a essência da ordem." icon={<MessageSquare className="h-4 w-4 text-[var(--primary)]" />} compact>
                    <TextAreaInput autoFocus label="Observação interna" name="note" rows={6} required description="Quanto mais objetiva, melhor para o próximo atendimento." />
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Nota interna</p><p className="field-hint">A observação entra na trilha da O.S. e ajuda no repasse entre times.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton pendingLabel="Salvando...">Salvar observação</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "finish" ? (
                <form id="order-finish-form" action={finalizeServiceOrderAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-finish-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "finish")} />
                  <div className="alert-success">Ao finalizar, a observação de fechamento será gravada no histórico e nos detalhes da ordem.</div>
                  <FormSection title="Encerrar atendimento" description="Informe como a ordem foi concluída para deixar a trilha operacional completa." icon={<CheckCircle2 className="h-4 w-4 text-[var(--success)]" />} compact>
                    <TextAreaInput autoFocus label="Observação de fechamento" name="note" rows={6} required />
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Fechamento auditável</p><p className="field-hint">A ordem passa a finalizada e pode ser reaberta depois, se necessário.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton pendingLabel="Finalizando...">Confirmar finalização</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "reopen" ? (
                <form id="order-reopen-form" action={reopenServiceOrderAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-reopen-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "reopen")} />
                  <div className="alert-info">A O.S. será reaberta com status <span className="font-semibold">Aberta</span>.</div>
                  <FormSection title="Reabrir ordem" description="Explique por que a ordem voltou para a operação." icon={<RotateCcw className="h-4 w-4 text-[var(--info)]" />} compact>
                    <TextAreaInput autoFocus label="Motivo da reabertura" name="reason" rows={6} required />
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Reversão controlada</p><p className="field-hint">Finalização e cancelamento anteriores continuam preservados no histórico.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton pendingLabel="Reabrindo...">Confirmar reabertura</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "cancel" ? (
                <form id="order-cancel-form" action={cancelServiceOrderAction} className="mt-5 space-y-4">
                  <FormStateGuard formId="order-cancel-form" />
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "cancel")} />
                  <div className="alert-danger">Cancelamentos ficam auditáveis no histórico e preservam toda a trilha anterior da O.S.</div>
                  <FormSection title="Cancelar ordem" description="Informe o motivo para a equipe entender por que a fila foi interrompida." icon={<Ban className="h-4 w-4 text-[var(--danger)]" />} compact>
                    <TextAreaInput autoFocus label="Motivo do cancelamento" name="reason" rows={6} required />
                  </FormSection>
                  <ActionFooter>
                    <div><p className="text-sm font-semibold text-[var(--text-primary)]">Cancelamento consciente</p><p className="field-hint">Use quando a ordem realmente não deve mais seguir em operação.</p></div>
                    <div className="flex flex-wrap gap-2"><SubmitButton variant="danger" pendingLabel="Cancelando...">Confirmar cancelamento</SubmitButton><ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink></div>
                  </ActionFooter>
                </form>
              ) : null}
        </div>
      </OrderActionOverlay>
    </div>
  );
}
