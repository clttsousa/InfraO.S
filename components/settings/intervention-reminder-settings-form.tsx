import { BellRing } from "lucide-react";
import { updateInterventionReminderSettingsAction } from "@/app/(protected)/settings/actions";
import { SubmitButton } from "@/components/shared/form-submit-button";
import { FormHelper } from "@/components/shared/ui";
import { REMINDER_TYPE_OPTIONS, summarizeReminderConfig } from "@/lib/intervention-reminder-config";
import type { InterventionReminderConfig } from "@/types";

export function InterventionReminderSettingsForm({ settings }: { settings: InterventionReminderConfig }) {
  const allowedTypes = REMINDER_TYPE_OPTIONS.filter((option) => option.value !== "custom");
  return (
    <form action={updateInterventionReminderSettingsAction} className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="app-title text-lg font-semibold">Lembretes de intervenções</h3>
          <p className="app-text-secondary mt-1 text-sm leading-6">
            Defina os lembretes padrão usados ao criar novas intervenções. Cada intervenção pode ser ajustada individualmente depois.
          </p>
        </div>
      </div>

      <label className="field-stack block">
        <span className="app-text-secondary mb-1.5 block text-sm font-medium">Horário padrão dos lembretes diários</span>
        <input name="defaultDailyReminderTime" type="time" defaultValue={settings.dailyTime} className="input-base text-sm outline-none" />
        <span className="field-hint">Usado para os lembretes “1 dia antes” e “No dia”.</span>
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {allowedTypes.map((option) => (
          <label key={option.value} className="app-surface-muted flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--border)] p-3">
            <input
              type="checkbox"
              name="defaultReminderType"
              value={option.value}
              defaultChecked={settings.enabledTypes.includes(option.value)}
              className="mt-1 h-4 w-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--text-primary)]">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Padrão atual:</span> {summarizeReminderConfig(settings)}.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormHelper>Alterações passam a valer para novas intervenções. Registros existentes mantêm seus próprios lembretes até serem editados.</FormHelper>
        <SubmitButton pendingLabel="Salvando...">Salvar lembretes</SubmitButton>
      </div>
    </form>
  );
}
