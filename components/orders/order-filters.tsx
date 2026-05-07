"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownWideNarrow, CalendarClock, ChevronsUpDown, Search, SlidersHorizontal, TimerReset } from "lucide-react";
import { Button } from "@/components/shared/ui";
import { ORDER_PRIORITY_OPTIONS, ORDER_STATUS_ALL_OPTIONS } from "@/lib/constants";
import { buildOrderQuery, DEFAULT_ORDER_PAGE_SIZE } from "@/lib/filter-params";
import type { OrderFilters as OrderFiltersType, TechnicianItem } from "@/types";

function isChecked(value?: boolean) {
  return value ? true : false;
}

function hasAdvancedFilters(filters: OrderFiltersType) {
  return Boolean(
    filters.technicianId ||
    filters.status ||
    filters.priority ||
    filters.from ||
    filters.to ||
    filters.lateOnly ||
    filters.dueToday ||
    filters.staleOnly ||
    (filters.sortBy && filters.sortBy !== "deadline") ||
    (filters.sortDir && filters.sortDir !== "asc")
  );
}

export function OrderFilters({ technicians, filters }: { technicians: TechnicianItem[]; filters: OrderFiltersType }) {
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedFilters(filters));
  const advancedId = "orders-advanced-filters";
  const searchId = "orders-search-input";

  const activeCount = useMemo(() => (
    [filters.q, filters.technicianId, filters.status, filters.priority, filters.from, filters.to, filters.lateOnly, filters.dueToday, filters.staleOnly]
      .filter(Boolean).length
  ), [filters]);

  const quickFilters = useMemo(() => {
    const createQuickHref = (key: "lateOnly" | "dueToday" | "staleOnly") => {
      const nextFilters = {
        ...filters,
        page: 1,
        lateOnly: key === "lateOnly",
        dueToday: key === "dueToday",
        staleOnly: key === "staleOnly",
      };
      const query = buildOrderQuery(nextFilters).toString();
      return query ? `/orders?${query}` : "/orders";
    };

    return [
      { href: createQuickHref("lateOnly"), label: "Atrasadas", icon: <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger)]" />, active: Boolean(filters.lateOnly) },
      { href: createQuickHref("dueToday"), label: "Vence hoje", icon: <CalendarClock className="h-3.5 w-3.5 text-[var(--warning)]" />, active: Boolean(filters.dueToday) },
      { href: createQuickHref("staleOnly"), label: "Sem atualização", icon: <TimerReset className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />, active: Boolean(filters.staleOnly) }
    ];
  }, [filters]);

  return (
    <form method="get" className="orders-filter-toolbar app-surface animate-slideInUp rounded-[var(--radius-panel)] p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <SlidersHorizontal className="h-4 w-4 text-[var(--primary)]" />
              Filtros da fila
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Busca rápida no topo e refinamento avançado só quando necessário.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeCount ? <div className="badge-base badge-primary px-2 py-1 text-[11px]">{activeCount} ativo(s)</div> : null}
            <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="filter-quick-link filter-quick-link-compact" aria-expanded={showAdvanced} aria-controls={advancedId}>
              <ChevronsUpDown className="h-3.5 w-3.5" />
              {showAdvanced ? "Menos filtros" : "Mais filtros"}
            </button>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
          <label htmlFor={searchId} className="input-base flex h-10 items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
            <input id={searchId} name="q" defaultValue={filters.q ?? ""} placeholder="Buscar por número, cliente ou descrição" className="w-full border-0 bg-transparent text-sm outline-none" />
          </label>

          <div className="flex flex-wrap gap-2">
            {quickFilters.map((item) => (
              <Link key={item.href} href={item.href} className={`filter-quick-link filter-quick-link-compact ${item.active ? "filter-chip-active" : ""}`} aria-current={item.active ? "page" : undefined}>
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <input type="hidden" name="page" value="1" />
            {(filters.pageSize ?? DEFAULT_ORDER_PAGE_SIZE) !== DEFAULT_ORDER_PAGE_SIZE ? <input type="hidden" name="pageSize" value={filters.pageSize} /> : null}
            <Button type="submit" size="sm">Aplicar</Button>
            <a href="/orders" className="btn-base btn-secondary btn-sm">Limpar</a>
          </div>
        </div>
      </div>

      {showAdvanced ? (
        <div id={advancedId} className="mt-3 space-y-3 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-muted)]/55 p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <select name="technician" defaultValue={filters.technicianId ?? ""} className="select-base h-10 text-sm outline-none">
              <option value="">Técnico envolvido: Todos</option>
              {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} className="select-base h-10 text-sm outline-none">
              <option value="">Status: Todos</option>
              {ORDER_STATUS_ALL_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
            <select name="priority" defaultValue={filters.priority ?? ""} className="select-base h-10 text-sm outline-none">
              <option value="">Prioridade: Todas</option>
              {ORDER_PRIORITY_OPTIONS.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="field-stack block">
                <span className="app-text-secondary mb-1 block text-xs font-medium uppercase tracking-[0.08em]">De</span>
                <input type="date" name="from" defaultValue={filters.from ?? ""} className="input-base h-10 text-sm outline-none" />
              </label>
              <label className="field-stack block">
                <span className="app-text-secondary mb-1 block text-xs font-medium uppercase tracking-[0.08em]">Até</span>
                <input type="date" name="to" defaultValue={filters.to ?? ""} className="input-base h-10 text-sm outline-none" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[38px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="lateOnly" value="1" defaultChecked={isChecked(filters.lateOnly)} className="rounded border-[var(--border-strong)]" />
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
              Somente atrasadas
            </label>
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[38px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="dueToday" value="1" defaultChecked={isChecked(filters.dueToday)} className="rounded border-[var(--border-strong)]" />
              <CalendarClock className="h-4 w-4 text-[var(--warning)]" />
              Vencendo hoje
            </label>
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[38px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="staleOnly" value="1" defaultChecked={isChecked(filters.staleOnly)} className="rounded border-[var(--border-strong)]" />
              <TimerReset className="h-4 w-4 text-[var(--text-tertiary)]" />
              Sem atualização
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
            <label className="block">
              <span className="app-text-secondary mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em]"><ArrowDownWideNarrow className="h-4 w-4" />Ordenar por</span>
              <select name="sortBy" defaultValue={filters.sortBy ?? "deadline"} className="select-base h-10 text-sm outline-none">
                <option value="deadline">Prazo</option>
                <option value="updated">Última atualização</option>
                <option value="opened">Data de abertura</option>
                <option value="orderNumber">Número da O.S.</option>
                <option value="status">Status</option>
                <option value="priority">Prioridade</option>
              </select>
            </label>
            <label className="block">
              <span className="app-text-secondary mb-1 block text-xs font-medium uppercase tracking-[0.08em]">Direção</span>
              <select name="sortDir" defaultValue={filters.sortDir ?? "asc"} className="select-base h-10 text-sm outline-none">
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </label>
            <div className="hidden xl:block" />
          </div>
        </div>
      ) : null}
    </form>
  );
}
