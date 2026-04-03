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
