import type { InterventionStatusDb, InterventionTypeDb } from "@/types";

export const interventionStatusLabelByDb: Record<InterventionStatusDb, string> = {
  PROGRAMADO: "Programado",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  ATRASADO: "Atrasado"
};

export const interventionTypeLabelByDb: Record<InterventionTypeDb, string> = {
  TROCA_POSTES: "Troca de postes",
  MANUTENCAO_ELETRICA: "Manutenção elétrica",
  DESLIGAMENTO_PROGRAMADO: "Desligamento programado",
  OBRA_TERCEIROS: "Obra de terceiros",
  REMANEJAMENTO_REDE: "Remanejamento de rede",
  OUTRO: "Outro"
};

export function formatInterventionStatus(status: InterventionStatusDb, isLate = false) {
  if (isLate && !["CONCLUIDO", "CANCELADO"].includes(status)) return "Atrasado";
  return interventionStatusLabelByDb[status] ?? "Programado";
}

export function formatInterventionType(type: InterventionTypeDb) {
  return interventionTypeLabelByDb[type] ?? "Outro";
}

export function getInterventionStatusBadgeClass(status: InterventionStatusDb, isLate = false) {
  const normalized = isLate && !["CONCLUIDO", "CANCELADO"].includes(status) ? "ATRASADO" : status;
  const classes: Record<InterventionStatusDb, string> = {
    PROGRAMADO: "badge-primary",
    EM_ACOMPANHAMENTO: "badge-warning",
    CONCLUIDO: "badge-success",
    CANCELADO: "badge-neutral",
    ATRASADO: "badge-danger"
  };
  return classes[normalized];
}

export function combineDateAndTime(date: string | null | undefined, time: string | null | undefined) {
  if (!date) return null;
  return `${date}T${time || "00:00"}`;
}
