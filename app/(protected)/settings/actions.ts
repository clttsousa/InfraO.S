"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_REMINDER_TYPES, normalizeDailyTime, normalizeReminderTypes } from "@/lib/intervention-reminder-config";
import { requireAdmin } from "@/lib/session";
import { cleanText } from "@/lib/validation";
import type { ReminderTypeDb } from "@/types";

function encodeMessage(value: string) {
  return encodeURIComponent(value);
}

export async function updateInterventionReminderSettingsAction(formData: FormData) {
  await requireAdmin();
  const dailyTime = normalizeDailyTime(cleanText(formData.get("defaultDailyReminderTime")));
  const enabledTypes = normalizeReminderTypes(formData.getAll("defaultReminderType"), DEFAULT_REMINDER_TYPES).filter((type) => type !== "custom") as ReminderTypeDb[];

  await db.query(
    `
      insert into intervention_reminder_settings (id, default_daily_time, default_enabled_types, updated_at)
      values (1, $1, $2::text[], now())
      on conflict (id) do update set
        default_daily_time = excluded.default_daily_time,
        default_enabled_types = excluded.default_enabled_types,
        updated_at = now()
    `,
    [dailyTime, enabledTypes]
  );

  revalidatePath("/settings");
  redirect(`/settings?success=${encodeMessage("Configurações de lembretes atualizadas.")}`);
}
