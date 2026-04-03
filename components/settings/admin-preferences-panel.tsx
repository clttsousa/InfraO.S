"use client";

import { Monitor, Rows3, Search, Siren, Sparkles, TableProperties } from "lucide-react";
import { ThemeSelector } from "@/components/providers/theme-provider-custom";
import { useSystemPreferences } from "@/components/providers/system-preferences-provider";
import { Button, Surface } from "@/components/shared/ui";

function ToggleCard({ icon, title, description, checked, onToggle }: { icon: React.ReactNode; title: string; description: string; checked: boolean; onToggle: () => void; }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="app-surface-muted flex w-full items-start justify-between gap-4 rounded-[var(--radius-panel)] border px-4 py-4 text-left transition-all hover:-translate-y-[1px]"
      style={{ borderColor: checked ? "color-mix(in srgb, var(--primary) 30%, var(--border))" : undefined }}
    >
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <span className={`badge-base ${checked ? "badge-primary" : "badge-neutral"}`}>{checked ? "Ativo" : "Desligado"}</span>
    </button>
  );
}

export function AdminPreferencesPanel() {
  const { preferences, updatePreferences, resetPreferences } = useSystemPreferences();

  return (
    <div className="space-y-6">
      <Surface className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="app-title text-lg font-semibold">Preferências operacionais</h3>
            <p className="app-text-secondary mt-1 text-sm leading-6">
              Estas preferências ficam salvas neste navegador e impactam diretamente a experiência da equipe no painel.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={resetPreferences}>
            Restaurar padrão
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="app-surface-muted rounded-[var(--radius-panel)] border p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Rows3 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Densidade da listagem de O.S.</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Ajusta espaçamento de linhas e cards na operação principal.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => updatePreferences({ ordersDensity: "comfortable" })} className={`btn-base btn-md ${preferences.ordersDensity === "comfortable" ? "btn-primary" : "btn-secondary"}`}>
                    <TableProperties className="h-4 w-4" />Confortável
                  </button>
                  <button type="button" onClick={() => updatePreferences({ ordersDensity: "compact" })} className={`btn-base btn-md ${preferences.ordersDensity === "compact" ? "btn-primary" : "btn-secondary"}`}>
                    <Rows3 className="h-4 w-4" />Compacta
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="app-surface-muted rounded-[var(--radius-panel)] border p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Monitor className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Cards do dashboard</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Define se o topo do dashboard fica mais espaçado ou mais denso para leitura rápida.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => updatePreferences({ dashboardCardsMode: "expanded" })} className={`btn-base btn-md ${preferences.dashboardCardsMode === "expanded" ? "btn-primary" : "btn-secondary"}`}>
                    <Sparkles className="h-4 w-4" />Expandido
                  </button>
                  <button type="button" onClick={() => updatePreferences({ dashboardCardsMode: "compact" })} className={`btn-base btn-md ${preferences.dashboardCardsMode === "compact" ? "btn-primary" : "btn-secondary"}`}>
                    <Rows3 className="h-4 w-4" />Compacto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ToggleCard
            icon={<Search className="h-5 w-5" />}
            title="Exibir atalho da paleta de comandos"
            description="Mostra ou oculta o gatilho visual de Cmd/Ctrl + K na topbar. O atalho continua funcionando normalmente."
            checked={preferences.showCommandPaletteHint}
            onToggle={() => updatePreferences({ showCommandPaletteHint: !preferences.showCommandPaletteHint })}
          />
          <ToggleCard
            icon={<Siren className="h-5 w-5" />}
            title="Realçar alertas operacionais"
            description="Mantém atrasos, vencimentos e blocos críticos com destaque visual mais forte na operação."
            checked={preferences.emphasizeOperationalAlerts}
            onToggle={() => updatePreferences({ emphasizeOperationalAlerts: !preferences.emphasizeOperationalAlerts })}
          />
        </div>
      </Surface>

      <Surface className="p-5">
        <h3 className="app-title text-lg font-semibold">Tema visual</h3>
        <p className="app-text-secondary mt-1 text-sm leading-6">Personalize a cor de destaque do sistema para alinhar com o padrão visual da equipe.</p>
        <div className="mt-4"><ThemeSelector /></div>
      </Surface>
    </div>
  );
}
