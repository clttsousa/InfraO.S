"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import { Button, SelectInput, TextInput } from "@/components/shared/ui";
import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import type { InternalUserItem, InterventionFilters, InterventionQuickFilter } from "@/types";

type Props = {
  filters: InterventionFilters;
  internalUsers: InternalUserItem[];
  quick: InterventionQuickFilter;
  activeCount: number;
};

export function InterventionMobileFilters({ filters, internalUsers, quick, activeCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className="intervention-mobile-filter-trigger shrink-0" onClick={() => setIsOpen(true)}>
        <Filter className="h-4 w-4" />
        Filtrar
        {activeCount > 0 ? <span className="intervention-filter-count">{activeCount}</span> : null}
      </Button>

      {isOpen ? (
        <div className="intervention-filter-sheet-overlay fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby="intervention-filter-sheet-title">
          <button type="button" aria-label="Fechar filtros" className="absolute inset-0 h-full w-full bg-black/45 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
          <div className="intervention-filter-sheet app-panel absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-[1.45rem] border-x-0 border-b-0 p-4 shadow-[var(--shadow-lg)]">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[var(--border-strong)]" />
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="app-eyebrow text-[0.68rem] font-medium">Intervenções</p>
                <h3 id="intervention-filter-sheet-title" className="app-title mt-1 text-lg font-semibold">Filtros avançados</h3>
              </div>
              <Button type="button" variant="ghost" size="sm" className="px-2.5" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form className="grid grid-cols-1 gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]" action="/intervencoes">
              <input type="hidden" name="quick" value={quick} />
              <input type="hidden" name="q" value={filters.q ?? ""} />
              <SelectInput label="Tipo" name="type" defaultValue={filters.type ?? ""} options={[{ label: "Todos", value: "" }, ...INTERVENTION_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
              <TextInput label="Localidade" name="location" defaultValue={filters.location ?? ""} placeholder="Pirajuba" />
              <SelectInput label="Status" name="status" defaultValue={filters.status ?? ""} options={[{ label: "Todos", value: "" }, ...INTERVENTION_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
              <SelectInput label="Origem" name="source" defaultValue={filters.source ?? ""} options={[{ label: "Todas", value: "" }, ...INTERVENTION_SOURCE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))]} />
              <SelectInput label="Responsável" name="responsible" defaultValue={filters.responsibleId ?? ""} options={[{ label: "Todos", value: "" }, ...internalUsers.filter((user) => user.active).map((user) => ({ label: user.name, value: user.id }))]} />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="De" name="from" type="date" defaultValue={filters.from ?? ""} />
                <TextInput label="Até" name="to" type="date" defaultValue={filters.to ?? ""} />
              </div>
              <div className="sticky bottom-0 -mx-4 mt-1 grid grid-cols-2 gap-2 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-3">
                <Link href="/intervencoes" className="btn-base btn-secondary btn-md justify-center">Limpar filtros</Link>
                <button type="submit" className="btn-base btn-primary btn-md justify-center">Aplicar filtros</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
