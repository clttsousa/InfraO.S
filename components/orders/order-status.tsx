import { Badge } from "@/components/shared/ui";
import type { OrderPriority, OrderStatus } from "@/types";

const statusClassName: Record<OrderStatus, string> = {
  Aberta: "badge-neutral",
  Encaminhada: "badge-primary",
  "Em acompanhamento": "badge-primary",
  Pendente: "badge-warning",
  Finalizada: "badge-success",
  Cancelada: "badge-danger",
  Atrasada: "badge-danger"
};

const priorityClassName: Record<OrderPriority, string> = {
  Baixa: "badge-neutral",
  Média: "badge-primary",
  Alta: "badge-warning",
  Urgente: "badge-danger"
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={statusClassName[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  return <Badge className={priorityClassName[priority]}>{priority}</Badge>;
}
