import { Users } from "lucide-react";
import type { TechnicianDirectoryItem } from "@/types";

export function SupportTechnicianSelector({
  technicians,
  selectedIds = [],
  label = "Técnicos de apoio",
  description = "Marque os técnicos que também vão atuar nesta O.S. Se marcar o mesmo técnico do responsável principal, ele continua apenas como principal.",
  name = "supportTechnicianIds"
}: {
  technicians: TechnicianDirectoryItem[];
  selectedIds?: string[];
  label?: string;
  description?: string;
  name?: string;
}) {
  const activeTechnicians = technicians.filter((item) => item.active);
  const selected = new Set(selectedIds);

  return (
    <div className="field-stack block">
      <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
        <Users className="h-4 w-4 text-[var(--primary)]" />
        <span>{label}</span>
      </div>
      <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)]/60 p-3">
        {activeTechnicians.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Nenhum técnico ativo disponível.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {activeTechnicians.map((technician) => (
              <label
                key={technician.id}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={technician.id}
                  defaultChecked={selected.has(technician.id)}
                  className="rounded border-[var(--border-strong)]"
                />
                <span className="min-w-0 truncate">{technician.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <span className="field-hint">{description}</span>
    </div>
  );
}
