"use client";

import { Ban, CalendarClock, CheckCircle2, Edit3, ExternalLink, MapPin, PlayCircle, RotateCcw, X } from "lucide-react";
import { changeInterventionStatusAction } from "@/app/(protected)/intervencoes/actions";
import { InterventionForm } from "@/components/interventions/intervention-form";
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge";
import { OrderActionOverlay } from "@/components/orders/order-action-overlay";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { Button, EmptyState, FeedbackMessage, StatLine, Surface } from "@/components/shared/ui";
import type { InternalUserItem, InterventionDetail, InterventionStatusDb } from "@/types";

type Action = "edit" | "cancel" | "conclude" | "progress" | "program" | undefined;

function getActionTitle(action: Action) {
  const titles: Record<Exclude<Action, undefined>, string> = {
    edit: "Editar intervenção",
    cancel: "Cancelar intervenção",
    conclude: "Concluir intervenção",
    progress: "Marcar em acompanhamento",
    program: "Voltar para programado"
  };
  return action ? titles[action] : "Ação";
}

function getTargetStatus(action: Action): InterventionStatusDb | null {
  if (action === "cancel") return "CANCELADO";
  if (action === "conclude") return "CONCLUIDO";
  if (action === "progress") return "EM_ACOMPANHAMENTO";
  if (action === "program") return "PROGRAMADO";
  return null;
}

function StatusActionForm({ action, intervention, closeHref }: { action: Exclude<Action, "edit" | undefined>; intervention: InterventionDetail; closeHref: string }) {
  const status = getTargetStatus(action);
  if (!status) return null;

  const confirmMessage = action === "cancel"
    ? "Confirmar cancelamento desta intervenção?"
    : action === "conclude"
      ? "Confirmar conclusão desta intervenção?"
      : "Confirmar alteração de status?";

  return (
    <form
      action={changeInterventionStatusAction}
      className="mt-5 space-y-4"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={intervention.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="redirectTo" value={closeHref} />
      <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
        Você está alterando o status de <strong className="text-[var(--text-primary)]">{intervention.title}</strong>. Essa ação será registrada para auditoria.
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <SubmitButton variant={action === "cancel" ? "danger" : "default"} pendingLabel="Confirmando...">Confirmar</SubmitButton>
      </div>
    </form>
  );
}

export function InterventionDetailPanel({ intervention, internalUsers, action, onActionChange, baseHref, success, error }: { intervention: InterventionDetail | null; internalUsers: InternalUserItem[]; action?: string; onActionChange?: (action?: string) => void; baseHref: string; success?: string; error?: string }) {
  if (!intervention) {
    return (
      <div className="p-6">
        <EmptyState compact title="Intervenção não encontrada" description="O registro pode ter sido removido, arquivado ou ainda não carregou." />
      </div>
    );
  }

  const currentAction = ["edit", "cancel", "conclude", "progress", "program"].includes(action ?? "") ? (action as Action) : undefined;
  const canOperate = !["CONCLUIDO", "CANCELADO"].includes(intervention.rawStatus);

  return (
    <div className="space-y-5 p-5">
      {success ? <FeedbackMessage type="success">{decodeURIComponent(success)}</FeedbackMessage> : null}
      {error ? <FeedbackMessage type="error">{decodeURIComponent(error)}</FeedbackMessage> : null}

      <Surface className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <InterventionStatusBadge status={intervention.rawStatus} label={intervention.status} isLate={intervention.isLate} />
              <span className="badge-base badge-neutral">{intervention.type}</span>
              <span className="badge-base badge-neutral">{intervention.source}</span>
            </div>
            <h2 className="app-title mt-3 text-2xl font-semibold leading-tight">{intervention.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{intervention.locationName} · {intervention.dateLabel} · {intervention.timeLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => onActionChange?.("edit")}><Edit3 className="h-4 w-4" />Editar</Button>
            {canOperate ? <Button type="button" variant="secondary" onClick={() => onActionChange?.("progress")}><PlayCircle className="h-4 w-4" />Acompanhar</Button> : null}
            {canOperate ? <Button type="button" onClick={() => onActionChange?.("conclude")}><CheckCircle2 className="h-4 w-4" />Concluir</Button> : null}
            {canOperate ? <Button type="button" variant="danger" onClick={() => onActionChange?.("cancel")}><Ban className="h-4 w-4" />Cancelar</Button> : null}
            {intervention.rawStatus !== "PROGRAMADO" && intervention.rawStatus !== "CONCLUIDO" && intervention.rawStatus !== "CANCELADO" ? <Button type="button" variant="ghost" onClick={() => onActionChange?.("program")}><RotateCcw className="h-4 w-4" />Programado</Button> : null}
          </div>
        </div>
      </Surface>

      <Surface className="p-5">
        <h3 className="app-title text-lg font-semibold">Informações da intervenção</h3>
        <div className="mt-3 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <StatLine label="Tipo" value={intervention.type} />
          <StatLine label="Localidade" value={intervention.locationName} />
          <StatLine label="Início" value={intervention.startAt} />
          <StatLine label="Fim" value={intervention.endAt} />
          <StatLine label="Responsável" value={intervention.responsibleName} />
          <StatLine label="Criado por" value={intervention.createdByName} />
          <StatLine label="Criado em" value={intervention.createdAt} />
          <StatLine label="Atualizado em" value={intervention.updatedAt} />
        </div>
        {intervention.notes ? <div className="app-surface-muted mt-3 rounded-[var(--radius-control)] p-3 text-sm leading-6 text-[var(--text-secondary)]">{intervention.notes}</div> : null}
      </Surface>

      <Surface className="p-5">
        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Pontos cadastrados</h3></div>
        <div className="mt-4 space-y-3">
          {intervention.points.length === 0 ? <EmptyState compact title="Sem pontos" description="Adicione ao menos um ponto com link do Maps para facilitar a execução em campo." /> : intervention.points.map((point, index) => (
            <div key={point.id} className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text-primary)]">{index + 1}. {point.label}</p>
                <p className="truncate text-sm text-[var(--text-secondary)]">{point.mapsUrl || "Sem link informado"}</p>
              </div>
              {point.mapsUrl ? <a href={point.mapsUrl} target="_blank" rel="noreferrer" className="btn-base btn-secondary btn-sm"><ExternalLink className="h-4 w-4" />Abrir no Maps</a> : null}
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="p-5">
        <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[var(--primary)]" /><h3 className="app-title text-lg font-semibold">Mensagem original</h3></div>
        {intervention.originalMessage ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-secondary)]">{intervention.originalMessage}</pre>
        ) : (
          <EmptyState compact title="Sem mensagem original" description="A intervenção foi cadastrada manualmente ou sem colar a mensagem recebida." />
        )}
      </Surface>

      <OrderActionOverlay isOpen={Boolean(currentAction)} closeHref={baseHref} onClose={() => onActionChange?.(undefined)}>
        <div className="app-panel animate-scaleIn relative z-[73] w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[var(--radius-modal)] p-5 shadow-[var(--shadow-lg)]">
          <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-4 pt-1">
            <div>
              <p className="app-eyebrow text-xs font-medium">Ação rápida</p>
              <h3 className="app-title mt-1 text-xl font-semibold">{getActionTitle(currentAction)}</h3>
            </div>
            <Button type="button" variant="ghost" size="sm" className="px-2.5 py-2" onClick={() => onActionChange?.(undefined)}><X className="h-4 w-4" /></Button>
          </div>

          {currentAction === "edit" ? <div className="mt-5"><InterventionForm mode="edit" intervention={intervention} internalUsers={internalUsers} closeHref={`${baseHref}${baseHref.includes("?") ? "&" : "?"}action=edit`} /></div> : null}
          {currentAction && currentAction !== "edit" ? <StatusActionForm action={currentAction} intervention={intervention} closeHref={`${baseHref}${baseHref.includes("?") ? "&" : "?"}action=${currentAction}`} /> : null}
        </div>
      </OrderActionOverlay>
    </div>
  );
}
