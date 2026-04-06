"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownWideNarrow, CalendarClock, ChevronsUpDown, Search, SlidersHorizontal, TimerReset } from "lucide-react";
import { Button } from "@/components/shared/ui";
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

  const activeCount = useMemo(() => (
    [filters.q, filters.technicianId, filters.status, filters.priority, filters.from, filters.to, filters.lateOnly, filters.dueToday, filters.staleOnly]
      .filter(Boolean).length
  ), [filters]);

  const quickFilters = [
    { href: "/orders?lateOnly=1", label: "Fila atrasada", icon: <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger)]" /> },
    { href: "/orders?dueToday=1", label: "Vence hoje", icon: <CalendarClock className="h-3.5 w-3.5 text-[var(--warning)]" /> },
    { href: "/orders?staleOnly=1", label: "Sem atualização", icon: <TimerReset className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> }
  ];

  return (
    <form method="get" className="app-surface animate-slideInUp space-y-4 rounded-[var(--radius-panel)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><SlidersHorizontal className="h-4 w-4 text-[var(--primary)]" />Filtros</div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Use a busca rápida e abra os filtros avançados só quando precisar refinar a fila. O filtro por técnico considera responsável e apoios.</p>
        </div>
        {activeCount ? <div className="badge-base badge-primary">{activeCount} ativo(s)</div> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((item) => (
          <Link key={item.href} href={item.href} className="filter-quick-link">
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="filter-quick-link">
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {showAdvanced ? "Fechar filtros" : "Abrir filtros"}
        </button>
      </div>

      <label className="input-base flex min-h-[44px] items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
        <input name="q" defaultValue={filters.q ?? ""} placeholder="Buscar por número da O.S., cliente ou descrição" className="w-full border-0 bg-transparent text-sm outline-none" />
      </label>

      {showAdvanced ? (
        <div className="space-y-4 rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface-muted)]/55 p-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <select name="technician" defaultValue={filters.technicianId ?? ""} className="select-base text-sm outline-none">
              <option value="">Técnico envolvido: Todos</option>
              {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} className="select-base text-sm outline-none">
              <option value="">Status: Todos</option>
              <option value="ABERTA">Aberta</option>
              <option value="ENCAMINHADA">Encaminhada</option>
              <option value="EM_ACOMPANHAMENTO">Em acompanhamento</option>
              <option value="PENDENTE">Pendente</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <select name="priority" defaultValue={filters.priority ?? ""} className="select-base text-sm outline-none">
              <option value="">Prioridade: Todas</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="field-stack block">
                <span className="app-text-secondary mb-1.5 block text-sm font-medium">De</span>
                <input type="date" name="from" defaultValue={filters.from ?? ""} className="input-base text-sm outline-none" />
              </label>
              <label className="field-stack block">
                <span className="app-text-secondary mb-1.5 block text-sm font-medium">Até</span>
                <input type="date" name="to" defaultValue={filters.to ?? ""} className="input-base text-sm outline-none" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="lateOnly" value="1" defaultChecked={isChecked(filters.lateOnly)} className="rounded border-[var(--border-strong)]" />
              <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
              Somente atrasadas
            </label>
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="dueToday" value="1" defaultChecked={isChecked(filters.dueToday)} className="rounded border-[var(--border-strong)]" />
              <CalendarClock className="h-4 w-4 text-[var(--warning)]" />
              Vencendo hoje
            </label>
            <label className="filter-checkbox app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" name="staleOnly" value="1" defaultChecked={isChecked(filters.staleOnly)} className="rounded border-[var(--border-strong)]" />
              <TimerReset className="h-4 w-4 text-[var(--text-tertiary)]" />
              Sem atualização
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="app-text-secondary mb-1.5 flex items-center gap-2 text-sm font-medium"><ArrowDownWideNarrow className="h-4 w-4" />Ordenar por</span>
              <select name="sortBy" defaultValue={filters.sortBy ?? "deadline"} className="select-base text-sm outline-none">
                <option value="deadline">Prazo</option>
                <option value="updated">Última atualização</option>
                <option value="opened">Data de abertura</option>
                <option value="orderNumber">Número da O.S.</option>
                <option value="status">Status</option>
                <option value="priority">Prioridade</option>
              </select>
            </label>
            <label className="block">
              <span className="app-text-secondary mb-1.5 block text-sm font-medium">Direção</span>
              <select name="sortDir" defaultValue={filters.sortDir ?? "asc"} className="select-base text-sm outline-none">
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </label>
            <input type="hidden" name="page" value="1" />
            <div className="flex flex-wrap items-end gap-2 md:justify-end">
              <Button type="submit">Aplicar</Button>
              <a href="/orders" className="btn-base btn-secondary btn-md">Limpar</a>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
