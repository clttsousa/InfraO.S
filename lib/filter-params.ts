import type { OrderFilters, OrderSortDirection, OrderSortField, ReportFilters } from "@/types";
import { isUuid } from "@/lib/validation";
import { ORDER_PRIORITY_OPTIONS, ORDER_STATUS_ALL_OPTIONS } from "@/lib/constants";

function getFilterValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getTrimmedValue(value: string | string[] | undefined, maxLength = 120) {
  return getFilterValue(value).trim().slice(0, maxLength);
}

function getFlagValue(value: string | string[] | undefined) {
  return value === "1" || value === "true";
}

function getPositiveInt(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getFilterValue(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const ORDER_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_ORDER_PAGE_SIZE = 50;

export function sanitizeOrderPageSize(value: string | string[] | number | undefined, fallback = DEFAULT_ORDER_PAGE_SIZE) {
  const raw = typeof value === "number" ? value : Number(getFilterValue(value));
  const parsed = Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return ORDER_PAGE_SIZE_OPTIONS.includes(parsed as (typeof ORDER_PAGE_SIZE_OPTIONS)[number]) ? parsed : fallback;
}

const ORDER_SORT_FIELDS: OrderSortField[] = ["deadline", "updated", "opened", "orderNumber", "status", "priority"];
const ORDER_SORT_DIRECTIONS: OrderSortDirection[] = ["asc", "desc"];
const ORDER_STATUS_VALUES = new Set<string>(ORDER_STATUS_ALL_OPTIONS.map((item) => item.value));
const ORDER_PRIORITY_VALUES = new Set<string>(ORDER_PRIORITY_OPTIONS.map((item) => item.value));

export function parseOrderFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const technicianId = getFilterValue(params.technician);
  const status = getFilterValue(params.status);
  const priority = getFilterValue(params.priority);
  const rawSortBy = getFilterValue(params.sortBy) as OrderSortField;
  const rawSortDir = getFilterValue(params.sortDir) as OrderSortDirection;

  return {
    q: getTrimmedValue(params.q),
    technicianId: isUuid(technicianId) ? technicianId : "",
    status: ORDER_STATUS_VALUES.has(status) ? status : "",
    priority: ORDER_PRIORITY_VALUES.has(priority) ? priority : "",
    from: getTrimmedValue(params.from, 10),
    to: getTrimmedValue(params.to, 10),
    lateOnly: getFlagValue(params.lateOnly),
    dueToday: getFlagValue(params.dueToday),
    staleOnly: getFlagValue(params.staleOnly),
    page: getPositiveInt(params.page, 1),
    pageSize: sanitizeOrderPageSize(params.pageSize),
    sortBy: ORDER_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "deadline",
    sortDir: ORDER_SORT_DIRECTIONS.includes(rawSortDir) ? rawSortDir : "asc"
  };
}

export function buildOrderQuery(filters: OrderFilters) {
  const url = new URLSearchParams();
  if (filters.q) url.set("q", filters.q);
  if (filters.technicianId) url.set("technician", filters.technicianId);
  if (filters.status) url.set("status", filters.status);
  if (filters.priority) url.set("priority", filters.priority);
  if (filters.from) url.set("from", filters.from);
  if (filters.to) url.set("to", filters.to);
  if (filters.lateOnly) url.set("lateOnly", "1");
  if (filters.dueToday) url.set("dueToday", "1");
  if (filters.staleOnly) url.set("staleOnly", "1");
  if (filters.page && filters.page > 1) url.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== DEFAULT_ORDER_PAGE_SIZE) url.set("pageSize", String(sanitizeOrderPageSize(filters.pageSize)));
  if (filters.sortBy) url.set("sortBy", filters.sortBy);
  if (filters.sortDir) url.set("sortDir", filters.sortDir);
  return url;
}

export function parseReportFilters(params: Record<string, string | string[] | undefined>): ReportFilters {
  const technicianId = getFilterValue(params.technician);
  const status = getFilterValue(params.status);
  const priority = getFilterValue(params.priority);

  return {
    from: getTrimmedValue(params.from, 10),
    to: getTrimmedValue(params.to, 10),
    technicianId: isUuid(technicianId) ? technicianId : "",
    status: ORDER_STATUS_VALUES.has(status) ? status : "",
    priority: ORDER_PRIORITY_VALUES.has(priority) ? priority : ""
  };
}

export function buildReportQuery(filters: ReportFilters) {
  const url = new URLSearchParams();
  if (filters.from) url.set("from", filters.from);
  if (filters.to) url.set("to", filters.to);
  if (filters.technicianId) url.set("technician", filters.technicianId);
  if (filters.status) url.set("status", filters.status);
  if (filters.priority) url.set("priority", filters.priority);
  return url;
}

export function getParamValue(params: Record<string, string | string[] | undefined>, key: string) {
  return getFilterValue(params[key]);
}
