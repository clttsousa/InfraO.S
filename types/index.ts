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


export type InterventionStatusDb = "PROGRAMADO" | "EM_ACOMPANHAMENTO" | "CONCLUIDO" | "CANCELADO" | "ATRASADO";
export type InterventionTypeDb = "TROCA_POSTES" | "MANUTENCAO_ELETRICA" | "DESLIGAMENTO_PROGRAMADO" | "OBRA_TERCEIROS" | "REMANEJAMENTO_REDE" | "OUTRO";
export type InterventionSourceDb = "WHATSAPP" | "EMAIL" | "TELEFONE" | "INTERNO" | "OUTRO";
export type InterventionQuickFilter = "all" | "today" | "tomorrow" | "week" | "late" | "concluded" | "canceled";
export type ReminderTypeDb = "one_day_before" | "same_day" | "six_hours_before" | "two_hours_before" | "thirty_minutes_before" | "custom";
export type ReminderStatusDb = "pending" | "processed" | "failed" | "canceled";

export type InterventionReminderConfig = {
  enabledTypes: ReminderTypeDb[];
  dailyTime: string;
  customAt?: string | null;
};

export type InterventionReminderItem = {
  id: string;
  type: string;
  rawType: ReminderTypeDb;
  remindAt: string;
  remindAtIso: string;
  status: string;
  rawStatus: ReminderStatusDb;
  processedAt?: string | null;
  errorMessage?: string | null;
};

export type InterventionPointItem = {
  id: string;
  label: string;
  mapsUrl: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type InterventionItem = {
  id: string;
  title: string;
  type: string;
  rawType: InterventionTypeDb;
  locationName: string;
  status: string;
  rawStatus: InterventionStatusDb;
  source: string;
  rawSource: InterventionSourceDb;
  startAt: string;
  endAt: string;
  startAtIso: string;
  endAtIso: string;
  dateLabel: string;
  timeLabel: string;
  pointsCount: number;
  createdByName: string;
  responsibleId?: string | null;
  responsibleName: string;
  notes?: string | null;
  isLate: boolean;
  createdAt: string;
  updatedAt: string;
  remindersCount?: number;
  nextReminderAt?: string | null;
};

export type InterventionDetail = InterventionItem & {
  originalMessage?: string | null;
  dateInput: string;
  startTimeInput: string;
  endTimeInput: string;
  points: InterventionPointItem[];
  reminders: InterventionReminderItem[];
  reminderConfig: InterventionReminderConfig;
};

export type InterventionSummary = {
  today: number;
  tomorrow: number;
  week: number;
  late: number;
  concluded: number;
  canceled: number;
};

export type InterventionListResult = {
  items: InterventionItem[];
  summary: InterventionSummary;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type InterventionFilters = {
  q?: string;
  quick?: InterventionQuickFilter;
  type?: string;
  location?: string;
  status?: string;
  source?: string;
  responsibleId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type InternalUserFilters = {
  q?: string;
  accountStatus?: "all" | "active" | "inactive";
  role?: "all" | UserRole;
  presence?: "all" | PresenceStatus;
  page?: number;
  pageSize?: number;
};

export type InternalUsersListResult = {
  items: InternalUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    active: number;
    admins: number;
    inactive: number;
    online: number;
    away: number;
  };
};

export type PresenceStatus = "ONLINE" | "AUSENTE" | "OFFLINE";

export type AuditScope = "order" | "user" | "technician" | "system" | "intervention";
export type AuditEntityType = "service_order" | "internal_user" | "technician" | "system" | "infra_event";
export type AuditFieldName =
  | "status"
  | "deadline_at"
  | "technician_id"
  | "support_technician_ids"
  | "internal_owner_id"
  | "priority"
  | "order_number"
  | "start_at"
  | "end_at"
  | "location_name";
export type AuditActionType =
  | "order.created"
  | "order.updated"
  | "order.status_changed"
  | "order.deadline_changed"
  | "order.assigned_changed"
  | "order.support_team_changed"
  | "order.finalized"
  | "order.reopened"
  | "order.canceled"
  | "intervention.created"
  | "intervention.updated"
  | "intervention.status_changed"
  | "intervention.canceled"
  | "intervention.concluded";

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
  interventions: DashboardInterventionItem[];
  interventionSummary: {
    today: number;
    tomorrow: number;
    late: number;
  };
  operationalSummary: {
    overdueOrders: number;
    dueTodayOrders: number;
    staleOrders: number;
    todayInterventions: number;
    tomorrowInterventions: number;
    lateInterventions: number;
    criticalNotifications: number;
    pendingReminders: number;
  };
};

export type DashboardInterventionItem = {
  id: string;
  title: string;
  locationName: string;
  startAt: string;
  endAt: string;
  startAtIso: string;
  endAtIso: string;
  timeLabel: string;
  pointsCount: number;
  status: string;
  rawStatus: InterventionStatusDb;
  isLate: boolean;
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
  read?: boolean;
  category: "late" | "dueToday" | "stale" | "activity" | "intervention";
};

export type NotificationFeedFilter = "all" | "interventions" | "orders" | "system" | "read";

export type NotificationSummary = {
  total: number;
  counts: {
    late: number;
    dueToday: number;
    stale: number;
    recentActivities: number;
    interventions: number;
    read: number;
  };
  items: NotificationItem[];
  activeAlertIds: {
    late: string[];
    dueToday: string[];
    stale: string[];
    intervention: string[];
  };
  checkedAt: string;
  page: number;
  pageSize: number;
  totalPages: number;
  itemsTotal: number;
  filter: NotificationFeedFilter;
};

export type AuditEventsFilters = {
  q?: string;
  actorUserId?: string;
  actionType?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
};

export type AuditEventsListResult = {
  items: AuditEventItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    today: number;
    uniqueActors: number;
  };
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
