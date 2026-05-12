export const AUTH_COOKIE_NAME = "infraos_auth";

export const ORDER_STATUS_OPTIONS = [
  { value: "ABERTA", label: "Aberta" },
  { value: "ENCAMINHADA", label: "Encaminhada" },
  { value: "EM_ACOMPANHAMENTO", label: "Em acompanhamento" },
  { value: "PENDENTE", label: "Pendente" }
] as const;

export const ORDER_STATUS_ALL_OPTIONS = [
  ...ORDER_STATUS_OPTIONS,
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" }
] as const;

export const ORDER_PRIORITY_OPTIONS = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" }
] as const;


export const INTERVENTION_STATUS_OPTIONS = [
  { value: "PROGRAMADO", label: "Programado" },
  { value: "EM_ACOMPANHAMENTO", label: "Em acompanhamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ATRASADO", label: "Atrasado" }
] as const;

export const INTERVENTION_TYPE_OPTIONS = [
  { value: "TROCA_POSTES", label: "Troca de postes" },
  { value: "MANUTENCAO_ELETRICA", label: "Manutenção elétrica" },
  { value: "DESLIGAMENTO_PROGRAMADO", label: "Desligamento programado" },
  { value: "OBRA_TERCEIROS", label: "Obra de terceiros" },
  { value: "REMANEJAMENTO_REDE", label: "Remanejamento de rede" },
  { value: "OUTRO", label: "Outro" }
] as const;

export const INTERVENTION_SOURCE_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "TELEFONE", label: "Telefone" },
  { value: "INTERNO", label: "Interno" },
  { value: "OUTRO", label: "Outro" }
] as const;
