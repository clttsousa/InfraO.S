import { query } from "@/lib/db";
import { DEFAULT_REMINDER_TYPES, normalizeDailyTime, normalizeReminderTypes } from "@/lib/intervention-reminder-config";
import type { InterventionReminderConfig } from "@/types";

type ReminderSettingsRow = {
  default_daily_time: string | null;
  default_enabled_types: string[] | null;
};

export async function getInterventionReminderSettings(): Promise<InterventionReminderConfig> {
  try {
    const result = await query<ReminderSettingsRow>(
      `select default_daily_time, default_enabled_types from intervention_reminder_settings where id = 1 limit 1`
    );
    const row = result.rows[0];
    if (!row) return { enabledTypes: DEFAULT_REMINDER_TYPES, dailyTime: "08:00", customAt: null };
    return {
      enabledTypes: normalizeReminderTypes(row.default_enabled_types, DEFAULT_REMINDER_TYPES),
      dailyTime: normalizeDailyTime(row.default_daily_time),
      customAt: null
    };
  } catch {
    return { enabledTypes: DEFAULT_REMINDER_TYPES, dailyTime: "08:00", customAt: null };
  }
}
