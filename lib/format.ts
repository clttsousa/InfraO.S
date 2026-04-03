import type { OrderPriority, OrderPriorityDb, OrderStatus, OrderStatusDb } from "@/types";

export const statusLabelByDb: Record<OrderStatusDb, OrderStatus> = {
  ABERTA: "Aberta",
  ENCAMINHADA: "Encaminhada",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  PENDENTE: "Pendente",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada"
};

export const priorityLabelByDb: Record<OrderPriorityDb, OrderPriority> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente"
};

export function formatStatus(dbValue: OrderStatusDb, late = false): OrderStatus {
  if (late) return "Atrasada";
  return statusLabelByDb[dbValue] ?? "Aberta";
}

export function formatPriority(dbValue: OrderPriorityDb): OrderPriority {
  return priorityLabelByDb[dbValue] ?? "Média";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function parseBrazilianDateTimeToIso(value?: string | null) {
  if (!value) return undefined;
  const cleaned = value.trim();
  const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return undefined;
  const [, dd, mm, yyyy, hh = "00", min = "00", ss = "00"] = match;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

export function formatHours(value?: number | null) {
  if (!value || Number.isNaN(value)) return "—";

  if (value < 24) {
    return `${value.toFixed(1).replace('.', ',')}h`;
  }

  const days = Math.floor(value / 24);
  const hours = value % 24;
  return `${days}d ${hours.toFixed(1).replace('.', ',')}h`;
}
