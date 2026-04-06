import type { OrderPriority, OrderPriorityDb, OrderStatus, OrderStatusDb } from "@/types";

export const APP_TIME_ZONE = "America/Sao_Paulo";

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

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: APP_TIME_ZONE
});

const localDateTimePartsFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatStatus(dbValue: OrderStatusDb, late = false): OrderStatus {
  if (late) return "Atrasada";
  return statusLabelByDb[dbValue] ?? "Aberta";
}

export function formatPriority(dbValue: OrderPriorityDb): OrderPriority {
  return priorityLabelByDb[dbValue] ?? "Média";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return localDateTimePartsFormatter.format(date).replace(" ", "T");
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
