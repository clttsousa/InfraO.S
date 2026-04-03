export type OrderStatusDb =
  | "ABERTA"
  | "ENCAMINHADA"
  | "EM_ACOMPANHAMENTO"
  | "PENDENTE"
  | "FINALIZADA"
  | "CANCELADA";

export type OrderStatus =
  | "Aberta"
  | "Encaminhada"
  | "Em acompanhamento"
  | "Pendente"
  | "Finalizada"
  | "Cancelada"
  | "Atrasada";

export type OrderPriorityDb = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
export type OrderPriority = "Baixa" | "Média" | "Alta" | "Urgente";
export type UserRole = "ADMIN" | "OPERADOR";

export type InternalUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastAccess: string;
  createdAt: string;
};

export type TechnicianItem = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  openOrders: number;
  lateOrders: number;
  pendingOrders: number;
  finishedOrders: number;
};

export type ServiceOrderItem = {
  id: string;
  number: string;
  openedAt: string;
  openedBy: string;
  openingDescription: string;
  clientCode?: string | null;
  clientName?: string | null;
  address?: string | null;
  locationLink?: string | null;
  technicianId?: string | null;
  internalOwnerId?: string | null;
  assignedTechnician: string;
  internalOwner: string;
  priority: OrderPriority;
  status: OrderStatus;
  rawStatus: OrderStatusDb;
  rawPriority: OrderPriorityDb;
  deadline: string;
  deadlineAt?: string | null;
  internalNote: string;
  openedAtIso?: string | null;
  createdAtIso: string;
  updatedAtIso?: string | null;
  isLate: boolean;
  isDueToday: boolean;
  isStale: boolean;
};

export type ServiceOrderListResult = {
  items: ServiceOrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ServiceOrderNoteItem = {
  id: string;
  author: string;
  note: string;
  when: string;
};

export type ServiceOrderLogItem = {
  id: string;
  actor: string;
  description: string;
  note?: string | null;
  when: string;
};

export type ServiceOrderDetail = ServiceOrderItem & {
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  updatedByName: string;
  finalizedAt?: string | null;
  finalizedByName?: string | null;
  closingNote?: string | null;
  canceledAt?: string | null;
  canceledByName?: string | null;
  cancellationNote?: string | null;
  reopenedAt?: string | null;
  reopenedByName?: string | null;
  openingDescriptionRaw: string;
  openedAtInput: string;
  deadlineInput: string;
  notes: ServiceOrderNoteItem[];
  logs: ServiceOrderLogItem[];
};

export type ActivityItem = {
  id: string;
  actor: string;
  description: string;
  when: string;
};

export type DashboardData = {
  stats: {
    abertas: number;
    acompanhamento: number;
    pendentes: number;
    atrasadas: number;
    finalizadasHoje: number;
  };
  dueToday: ServiceOrderItem[];
  overdue: ServiceOrderItem[];
  stale: ServiceOrderItem[];
  activities: ActivityItem[];
  technicianSummary: TechnicianItem[];
};

export type OrderSortField = "deadline" | "updated" | "opened" | "orderNumber" | "status" | "priority";
export type OrderSortDirection = "asc" | "desc";

export type OrderFilters = {
  q?: string;
  technicianId?: string;
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  lateOnly?: boolean;
  dueToday?: boolean;
  staleOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: OrderSortField;
  sortDir?: OrderSortDirection;
};

export type ParsedServiceOrderInput = {
  orderNumber?: string;
  openedAt?: string;
  openedBy?: string;
  openingDescription?: string;
  clientCode?: string;
  clientName?: string;
  address?: string;
  locationLink?: string;
};

export type ReportFilters = {
  from?: string;
  to?: string;
  technicianId?: string;
  status?: string;
  priority?: string;
};

export type ReportSummary = {
  totalOrders: number;
  lateOrders: number;
  avgHoursToFinish: number;
  finishedOrders: number;
  pendingOrders: number;
};

export type ReportBreakdownItem = {
  label: string;
  total: number;
};

export type ReportTechnicianProductivity = {
  technicianId: string;
  technicianName: string;
  totalOrders: number;
  finishedOrders: number;
  lateOrders: number;
  pendingOrders: number;
  avgHoursToFinish: number;
};

export type ReportsData = {
  filters: Required<ReportFilters>;
  summary: ReportSummary;
  byStatus: ReportBreakdownItem[];
  byPriority: ReportBreakdownItem[];
  byTechnician: ReportTechnicianProductivity[];
};
