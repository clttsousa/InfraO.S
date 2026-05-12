import type { ReminderTypeDb, InterventionReminderConfig } from "@/types";

export const DAILY_REMINDER_DEFAULT_TIME = "08:00";

export const DEFAULT_REMINDER_TYPES: ReminderTypeDb[] = ["one_day_before", "same_day"];

export const REMINDER_TYPE_OPTIONS: Array<{ value: ReminderTypeDb; label: string; description: string; category: "daily" | "relative" | "custom" }> = [
  { value: "one_day_before", label: "1 dia antes", description: "Lembra no dia anterior, no horário padrão diário.", category: "daily" },
  { value: "same_day", label: "No dia", description: "Lembra no dia da intervenção, no horário padrão diário.", category: "daily" },
  { value: "six_hours_before", label: "6 horas antes", description: "Lembra 6 horas antes do início da intervenção.", category: "relative" },
  { value: "two_hours_before", label: "2 horas antes", description: "Lembra 2 horas antes do início da intervenção.", category: "relative" },
  { value: "thirty_minutes_before", label: "30 minutos antes", description: "Lembra 30 minutos antes do início da intervenção.", category: "relative" },
  { value: "custom", label: "Personalizado", description: "Permite programar uma data e hora específica para lembrar.", category: "custom" }
];

export const REMINDER_TYPE_LABELS: Record<ReminderTypeDb, string> = REMINDER_TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {} as Record<ReminderTypeDb, string>);

export const REMINDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  processed: "Processado",
  failed: "Falhou",
  canceled: "Cancelado"
};

export function normalizeDailyTime(value?: string | null) {
  const text = String(value ?? "").trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : DAILY_REMINDER_DEFAULT_TIME;
}

export function normalizeReminderTypes(values: unknown, fallback: ReminderTypeDb[] = DEFAULT_REMINDER_TYPES): ReminderTypeDb[] {
  const rawValues = Array.isArray(values) ? values : [];
  const allowed = new Set(REMINDER_TYPE_OPTIONS.map((item) => item.value));
  const normalized = rawValues
    .map((value) => String(value ?? "").trim())
    .filter((value): value is ReminderTypeDb => allowed.has(value as ReminderTypeDb));
  return Array.from(new Set(normalized.length ? normalized : fallback));
}

export function normalizeReminderConfig(value: unknown): InterventionReminderConfig {
  if (!value || typeof value !== "object") {
    return { enabledTypes: DEFAULT_REMINDER_TYPES, dailyTime: DAILY_REMINDER_DEFAULT_TIME, customAt: null };
  }
  const config = value as Partial<InterventionReminderConfig>;
  return {
    enabledTypes: normalizeReminderTypes(config.enabledTypes, DEFAULT_REMINDER_TYPES),
    dailyTime: normalizeDailyTime(config.dailyTime),
    customAt: typeof config.customAt === "string" && config.customAt.trim() ? config.customAt.trim() : null
  };
}

export function parseReminderConfigFromJson(value: unknown): InterventionReminderConfig {
  if (!value) return normalizeReminderConfig(null);
  if (typeof value === "string") {
    try {
      return normalizeReminderConfig(JSON.parse(value));
    } catch {
      return normalizeReminderConfig(null);
    }
  }
  return normalizeReminderConfig(value);
}

export function summarizeReminderConfig(config: InterventionReminderConfig) {
  const labels = config.enabledTypes.map((type) => REMINDER_TYPE_LABELS[type] ?? type);
  if (!labels.length) return "Sem lembretes automáticos";
  return `${labels.join(", ")} · horário diário ${config.dailyTime}`;
}
