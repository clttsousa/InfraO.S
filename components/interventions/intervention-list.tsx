"use client";

import { CalendarClock, MapPin, Navigation, UserRound } from "lucide-react";
import { InterventionStatusBadge } from "@/components/interventions/intervention-status-badge";
import { EmptyState } from "@/components/shared/ui";
import { cn } from "@/components/shared/utils";
import type { InterventionItem } from "@/types";

export function InterventionList({ items, selectedId, pulseId, onSelect }: { items: InterventionItem[]; selectedId?: string; pulseId?: string; onSelect: (id: string) => void }) {
  if (!items.length) {
    return <EmptyState title="Nenhuma intervenção encontrada" description="Cadastre uma intervenção programada ou ajuste os filtros para ampliar a busca." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const selected = selectedId === item.id;
        const pulse = pulseId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "intervention-card-mobile group w-full rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
              selected ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]" : "",
              pulse ? "animate-pulse" : ""
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <InterventionStatusBadge status={item.rawStatus} label={item.status} isLate={item.isLate} />
                  <span className="badge-base badge-neutral">{item.type}</span>
                  <span className="badge-base badge-neutral">{item.source}</span>
                </div>
                <h3 className="app-title mt-3 line-clamp-2 text-base font-semibold group-hover:text-[var(--primary)]">{item.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--text-tertiary)]" />{item.locationName}</span>
                  <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-[var(--text-tertiary)]" />{item.dateLabel} · {item.timeLabel}</span>
                  <span className="inline-flex items-center gap-1.5"><Navigation className="h-4 w-4 text-[var(--text-tertiary)]" />{item.pointsCount} ponto{item.pointsCount === 1 ? "" : "s"}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 text-sm text-[var(--text-secondary)] lg:items-end">
                <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-[var(--text-tertiary)]" />{item.responsibleName}</span>
                <span className="text-xs text-[var(--text-tertiary)]">Atualizado em {item.updatedAt}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
