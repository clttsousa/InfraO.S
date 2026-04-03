"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownWideNarrow, CalendarClock, Search, TimerReset } from "lucide-react";
import { DateRangePicker } from "@/components/shared/date-picker";
import { Button } from "@/components/shared/ui";
import type { OrderFilters as OrderFiltersType, TechnicianItem } from "@/types";

function isChecked(value?: boolean) {
  return value ? true : false;
}

export function OrderFilters({ technicians, filters }: { technicians: TechnicianItem[]; filters: OrderFiltersType }) {
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  return (
    <form className="app-surface space-y-4 rounded-[var(--radius-panel)] p-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-6">
        <label className="input-base flex min-h-[44px] items-center gap-2 px-3 py-2 md:col-span-2 2xl:col-span-2">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Buscar por número da O.S., cliente ou descrição" className="w-full border-0 bg-transparent text-sm outline-none" />
        </label>
        <select name="technician" defaultValue={filters.technicianId ?? ""} className="select-base text-sm outline-none">
          <option value="">Técnico: Todos</option>
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
        <div className="2xl:col-span-2">
          <DateRangePicker label="Período" startDate={from} endDate={to} onStartDateChange={setFrom} onEndDateChange={setTo} />
          <input type="hidden" name="from" value={from} />
          <input type="hidden" name="to" value={to} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <label className="app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" name="lateOnly" value="1" defaultChecked={isChecked(filters.lateOnly)} className="rounded border-[var(--border-strong)]" />
          <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
          Somente atrasadas
        </label>
        <label className="app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" name="dueToday" value="1" defaultChecked={isChecked(filters.dueToday)} className="rounded border-[var(--border-strong)]" />
          <CalendarClock className="h-4 w-4 text-[var(--warning)]" />
          Vencendo hoje
        </label>
        <label className="app-surface-muted inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" name="staleOnly" value="1" defaultChecked={isChecked(filters.staleOnly)} className="rounded border-[var(--border-strong)]" />
          <TimerReset className="h-4 w-4 text-[var(--text-tertiary)]" />
          Sem atualização
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
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
          <Button type="submit">Aplicar filtros</Button>
          <a href="/orders" className="btn-base btn-secondary btn-md">Limpar filtros</a>
        </div>
      </div>
    </form>
  );
}
