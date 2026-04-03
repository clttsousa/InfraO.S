import type { OrderFilters, OrderSortDirection, OrderSortField, ReportFilters } from "@/types";
import { isUuid } from "@/lib/validation";

function getFilterValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getFlagValue(value: string | string[] | undefined) {
  return value === "1" || value === "true";
}

function getPositiveInt(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getFilterValue(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const ORDER_SORT_FIELDS: OrderSortField[] = ["deadline", "updated", "opened", "orderNumber", "status", "priority"];
const ORDER_SORT_DIRECTIONS: OrderSortDirection[] = ["asc", "desc"];

export function parseOrderFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const technicianId = getFilterValue(params.technician);
  const rawSortBy = getFilterValue(params.sortBy) as OrderSortField;
  const rawSortDir = getFilterValue(params.sortDir) as OrderSortDirection;

  return {
    q: getFilterValue(params.q),
    technicianId: isUuid(technicianId) ? technicianId : "",
    status: getFilterValue(params.status),
    priority: getFilterValue(params.priority),
    from: getFilterValue(params.from),
    to: getFilterValue(params.to),
    lateOnly: getFlagValue(params.lateOnly),
    dueToday: getFlagValue(params.dueToday),
    staleOnly: getFlagValue(params.staleOnly),
    page: getPositiveInt(params.page, 1),
    pageSize: 25,
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
  if (filters.sortBy) url.set("sortBy", filters.sortBy);
  if (filters.sortDir) url.set("sortDir", filters.sortDir);
  return url;
}

export function parseReportFilters(params: Record<string, string | string[] | undefined>): ReportFilters {
  const technicianId = getFilterValue(params.technician);
  return {
    from: getFilterValue(params.from),
    to: getFilterValue(params.to),
    technicianId: isUuid(technicianId) ? technicianId : "",
    status: getFilterValue(params.status),
    priority: getFilterValue(params.priority)
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
