import type { ReactNode } from "react";
import { Ban, CheckCircle2, MapPin, MessageSquare, Pencil, RefreshCw, RotateCcw, X } from "lucide-react";
import {
  addServiceOrderNoteAction,
  cancelServiceOrderAction,
  finalizeServiceOrderAction,
  reopenServiceOrderAction,
  updateServiceOrderAction,
  updateServiceOrderStatusAction
} from "@/app/(protected)/orders/actions";
import { PriorityBadge, StatusBadge } from "@/components/orders/order-status";
import { Button, ButtonLink, EmptyState, FeedbackMessage, SelectInput, StatLine, Surface, TextAreaInput, TextInput } from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS, ORDER_STATUS_OPTIONS } from "@/lib/constants";
import type { InternalUserItem, ServiceOrderDetail, TechnicianItem } from "@/types";

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

function ActionFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-1 pt-4">
      {children}
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
    <div className="relative space-y-6 p-6">
      {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}

      <div>
        <p className="app-eyebrow text-xs font-medium">Detalhe da O.S.</p>
        <h2 className="app-title mt-1 text-[1.9rem] font-semibold leading-tight">O.S. {order.number}</h2>
        <p className="app-text-secondary mt-1">Cliente: {order.clientName ?? "Sem cliente vinculado"}</p>
      </div>

      {order.isLate ? <div className="alert-danger">Prazo vencido. Esta O.S. está atrasada, mas o status real continua <span className="font-semibold">{order.rawStatus}</span>.</div> : null}
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
        <h3 className="app-title text-lg font-semibold">Observações internas</h3>
        {order.notes.length === 0 ? <div className="mt-4"><EmptyState compact title="Sem observações" description="Adicione notas internas para registrar contexto operacional adicional." /></div> : (
          <div className="timeline mt-4 space-y-4">
            {order.notes.map((note) => (
              <div key={note.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="app-surface-muted rounded-[var(--radius-control)] p-3">
                  <div className="text-sm text-[var(--text-primary)]">{note.note}</div>
                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">{note.author} · {note.when}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>

      <Surface className="p-5">
        <h3 className="app-title text-lg font-semibold">Histórico da O.S.</h3>
        {order.logs.length === 0 ? <div className="mt-4"><EmptyState compact title="Sem histórico" description="Quando houver ações na ordem, a timeline ficará disponível aqui." /></div> : (
          <div className="timeline mt-4 space-y-4">
            {order.logs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <div className="text-sm text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">{log.actor}</span> {log.description}</div>
                  {log.note ? <div className="mt-1 text-sm text-[var(--text-secondary)]">{log.note}</div> : null}
                  <div className="mt-1 text-xs text-[var(--text-tertiary)]">{log.when}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {action ? (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-black/45 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center py-2 md:py-8">
            <div className="app-panel w-full max-w-2xl overflow-y-auto rounded-[var(--radius-modal)] p-5 shadow-[var(--shadow-lg)] max-h-[calc(100vh-2rem)]">
              <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-4 pt-1">
                <div>
                  <p className="app-eyebrow text-xs font-medium">Ação rápida</p>
                  <h3 className="app-title mt-1 text-xl font-semibold">{actionTitle(action)}</h3>
                </div>
                <ButtonLink href={closeHref} variant="ghost" size="sm" className="px-2.5 py-2"><X className="h-4 w-4" /></ButtonLink>
              </div>

              {action === "edit" ? (
                <form action={updateServiceOrderAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "edit")} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput label="Número da O.S." name="orderNumber" defaultValue={order.number} required />
                    <TextInput label="Data de abertura" name="openedAt" type="datetime-local" defaultValue={order.openedAtInput} />
                    <TextInput label="Usuário da abertura" name="openedBy" defaultValue={order.openedBy === "—" ? "" : order.openedBy} />
                    <TextInput label="Código do cliente (opcional)" name="clientCode" defaultValue={order.clientCode ?? ""} />
                    <TextInput label="Nome do cliente (opcional)" name="clientName" defaultValue={order.clientName ?? ""} />
                    <TextInput label="Localização (opcional)" name="locationLink" defaultValue={order.locationLink ?? ""} />
                    <div className="md:col-span-2"><TextInput label="Endereço (opcional)" name="addressText" defaultValue={order.address ?? ""} /></div>
                    <div className="md:col-span-2"><TextAreaInput label="Descrição da abertura" name="openingDescription" defaultValue={order.openingDescriptionRaw} rows={4} /></div>
                    <SelectInput label="Técnico responsável" name="technicianId" defaultValue={order.technicianId ?? ""} options={[{ label: "Selecione um técnico", value: "" }, ...activeTechnicians.map((item) => ({ label: item.name, value: item.id }))]} />
                    <SelectInput label="Responsável interno" name="internalOwnerId" defaultValue={order.internalOwnerId ?? ""} options={activeUsers.map((item) => ({ label: item.name, value: item.id }))} />
                    <SelectInput label="Prioridade" name="priority" defaultValue={order.rawPriority} options={ORDER_PRIORITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
                    <TextInput label="Prazo" name="deadlineAt" type="datetime-local" defaultValue={order.deadlineInput} />
                  </div>
                  <TextAreaInput label="Observação interna" name="internalNote" defaultValue={order.internalNote === "Sem observação interna." ? "" : order.internalNote} rows={4} />
                  <ActionFooter>
                    <Button type="submit">Salvar alterações</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "status" ? (
                <form action={updateServiceOrderStatusAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "status")} />
                  <SelectInput label="Novo status" name="status" defaultValue={order.rawStatus} options={ORDER_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))} />
                  <TextAreaInput label="Observação da alteração (opcional)" name="note" rows={4} />
                  <ActionFooter>
                    <Button type="submit">Salvar status</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "note" ? (
                <form action={addServiceOrderNoteAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "note")} />
                  <TextAreaInput label="Observação interna" name="note" rows={6} />
                  <ActionFooter>
                    <Button type="submit">Salvar observação</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "finish" ? (
                <form action={finalizeServiceOrderAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "finish")} />
                  <div className="alert-success">Ao finalizar, a observação de fechamento será gravada no histórico e nos detalhes da ordem.</div>
                  <TextAreaInput label="Observação de fechamento" name="note" rows={6} />
                  <ActionFooter>
                    <Button type="submit">Confirmar finalização</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "reopen" ? (
                <form action={reopenServiceOrderAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "reopen")} />
                  <div className="alert-info">A O.S. será reaberta com status <span className="font-semibold">Aberta</span>.</div>
                  <TextAreaInput label="Motivo da reabertura" name="reason" rows={6} />
                  <ActionFooter>
                    <Button type="submit">Confirmar reabertura</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}

              {action === "cancel" ? (
                <form action={cancelServiceOrderAction} className="mt-5 space-y-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="redirectTo" value={buildHref(baseHref, "cancel")} />
                  <div className="alert-danger">Cancelamentos ficam auditáveis no histórico e preservam toda a trilha anterior da O.S.</div>
                  <TextAreaInput label="Motivo do cancelamento" name="reason" rows={6} />
                  <ActionFooter>
                    <Button type="submit" variant="danger">Confirmar cancelamento</Button>
                    <ButtonLink href={closeHref} variant="secondary">Cancelar</ButtonLink>
                  </ActionFooter>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
