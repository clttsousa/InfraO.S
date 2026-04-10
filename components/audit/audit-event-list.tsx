import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Pencil,
  RefreshCw,
  RotateCcw,
  UserRound,
  Users
} from "lucide-react";
import { EmptyState } from "@/components/shared/ui";
import type { AuditEventItem } from "@/types";

function formatJsonValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.length ? value.map((item) => formatJsonValue(item)).join(", ") : "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "Valor estruturado";
    }
  }
  return String(value);
}

export function getAuditFieldLabel(fieldName?: string | null) {
  const labels: Record<string, string> = {
    status: "Status",
    deadline_at: "Prazo",
    technician_id: "Técnico responsável",
    support_technician_ids: "Equipe de apoio",
    internal_owner_id: "Responsável interno",
    priority: "Prioridade",
    order_number: "Número da O.S."
  };

  return fieldName ? labels[fieldName] ?? fieldName : "Campo geral";
}

export function getAuditActionMeta(actionType: string) {
  const normalized = actionType.toLowerCase();

  if (normalized.includes("created")) return { label: "Criação", tone: "success", icon: ClipboardList };
  if (normalized.includes("deadline")) return { label: "Mudança de prazo", tone: "warning", icon: CalendarClock };
  if (normalized.includes("status")) return { label: "Mudança de status", tone: "warning", icon: RefreshCw };
  if (normalized.includes("assigned")) return { label: "Troca de técnico", tone: "info", icon: UserRound };
  if (normalized.includes("support_team")) return { label: "Equipe de apoio", tone: "info", icon: Users };
  if (normalized.includes("finalized")) return { label: "Finalização", tone: "success", icon: CheckCircle2 };
  if (normalized.includes("reopened")) return { label: "Reabertura", tone: "info", icon: RotateCcw };
  if (normalized.includes("canceled")) return { label: "Cancelamento", tone: "danger", icon: Ban };
  if (normalized.includes("updated")) return { label: "Edição", tone: "primary", icon: Pencil };

  return { label: "Auditoria", tone: "neutral", icon: Clock3 };
}

function AuditValueBlock({ label, value }: { label: string; value: unknown }) {
  const formatted = formatJsonValue(value);
  return (
    <div className="audit-value-block">
      <span className="audit-value-label">{label}</span>
      <pre className="audit-value-content whitespace-pre-wrap break-words">{formatted}</pre>
    </div>
  );
}

export function AuditEventCard({ event, showEntity = false }: { event: AuditEventItem; showEntity?: boolean }) {
  const meta = getAuditActionMeta(event.actionType);
  const Icon = meta.icon;
  const fieldLabel = getAuditFieldLabel(event.fieldName);

  return (
    <div className={`timeline-card timeline-card-${meta.tone} audit-card`}>
      <div className={`timeline-icon timeline-icon-${meta.tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{meta.label}</span>
              <span className="badge-base badge-neutral px-2 py-1 text-[11px]">{fieldLabel}</span>
              {showEntity && event.entityLabel ? <span className="badge-base badge-primary px-2 py-1 text-[11px]">{event.entityLabel}</span> : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">{event.actorName}</span> realizou esta alteração estruturada.
            </p>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">{event.when}</div>
        </div>

        {(event.oldValue !== null && event.oldValue !== undefined) || (event.newValue !== null && event.newValue !== undefined) ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <AuditValueBlock label="Valor anterior" value={event.oldValue} />
            <AuditValueBlock label="Valor novo" value={event.newValue} />
          </div>
        ) : null}

        {event.note ? (
          <div className="mt-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]">
            {event.note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuditEventList({
  events,
  emptyTitle = "Sem auditoria estruturada",
  emptyDescription = "Quando houver alterações relevantes registradas, elas aparecerão aqui."
}: {
  events: AuditEventItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!events.length) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => <AuditEventCard key={event.id} event={event} showEntity />)}
    </div>
  );
}
