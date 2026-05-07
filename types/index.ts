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
export type PresenceStatus = "ONLINE" | "AUSENTE" | "OFFLINE";

export type AuditScope = "order" | "user" | "technician" | "system";
export type AuditEntityType = "service_order" | "internal_user" | "technician" | "system";
export type AuditFieldName =
  | "status"
  | "deadline_at"
  | "technician_id"
  | "support_technician_ids"
  | "internal_owner_id"
  | "priority"
  | "order_number";
export type AuditActionType =
  | "order.created"
  | "order.updated"
  | "order.status_changed"
  | "order.deadline_changed"
  | "order.assigned_changed"
  | "order.support_team_changed"
  | "order.finalized"
  | "order.reopened"
  | "order.canceled";

export type AuditEventItem = {
  id: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  scope: string;
  actionType: string;
  fieldName?: string | null;
  actorUserId?: string | null;
  actorName: string;
  oldValue?: unknown;
  newValue?: unknown;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  when: string;
  createdAtIso?: string | null;
};


export type InternalUserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastAccess: string;
  lastLogin: string;
  lastActivity: string;
  lastLoginAtIso?: string | null;
  lastSeenAtIso?: string | null;
  presenceStatus: PresenceStatus;
  presenceLabel: string;
  createdAt: string;
};

export type TechnicianAssignment = {
  id: string;
  name: string;
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
  supportTechnicianIds: string[];
  supportTechnicians: TechnicianAssignment[];
  supportTechnicianCount: number;
  teamSummary: string;
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
  summary: {
    late: number;
    dueToday: number;
    stale: number;
  };
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
  auditEvents: AuditEventItem[];
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


export type NotificationLevel = "danger" | "warning" | "info" | "success";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  level: NotificationLevel;
  when?: string;
  category: "late" | "dueToday" | "stale" | "activity";
};

export type NotificationSummary = {
  total: number;
  counts: {
    late: number;
    dueToday: number;
    stale: number;
    recentActivities: number;
  };
  items: NotificationItem[];
  activeAlertIds: {
    late: string[];
    dueToday: string[];
    stale: string[];
  };
  checkedAt: string;
};

export type SavedOrderView = {
  id: string;
  name: string;
  queryString: string;
  createdAt: string;
  updatedAt: string;
};

export type SystemHealth = {
  ok: boolean;
  environment: { ok: boolean; message: string };
  database: { ok: boolean; message: string };
  checkedAt: string;
};
