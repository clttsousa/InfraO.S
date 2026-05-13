"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { parseRuleFormData, runNotificationRulesOnce } from "@/lib/notifications/rule-engine";
import { publishRealtimeEvent } from "@/lib/realtime";
import { requireAdmin, requireSession } from "@/lib/session";
import { ensureUuid } from "@/lib/validation";

function done(message: string) {
  revalidatePath("/settings");
  revalidatePath("/settings/notifications");
  revalidatePath("/notifications");
  redirect(`/settings/notifications?success=${encodeURIComponent(message)}`);
}

function fail(message: string) {
  redirect(`/settings/notifications?error=${encodeURIComponent(message)}`);
}

export async function createNotificationRuleAction(formData: FormData) {
  const session = await requireAdmin();
  try {
    const rule = parseRuleFormData(formData, session.id);
    const result = await query<{ id: string }>(
      `insert into notification_rules (name, description, event_type, entity_type, conditions, severity, recipient_strategy, channels, template, action_label, action_url_template, cooldown_minutes, is_active, created_by)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14::uuid)
       returning id::text`,
      [rule.name, rule.description, rule.eventType, rule.entityType, JSON.stringify(rule.conditions), rule.severity, JSON.stringify(rule.recipientStrategy), JSON.stringify(rule.channels), rule.template, rule.actionLabel, rule.actionUrlTemplate, rule.cooldownMinutes, rule.isActive, session.id]
    );
    publishRealtimeEvent({ type: "notification.created", scope: "notifications", entityId: result.rows[0]?.id, payload: { sourceType: "rule.created", title: rule.name } });
    done("Regra de notificação criada.");
  } catch (error) {
    fail(error instanceof Error ? error.message : "Não foi possível criar a regra.");
  }
}

export async function updateNotificationRuleAction(formData: FormData) {
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Regra");
  try {
    const rule = parseRuleFormData(formData);
    await query(
      `update notification_rules set
        name = $2,
        description = $3,
        event_type = $4,
        entity_type = $5,
        conditions = $6::jsonb,
        severity = $7,
        recipient_strategy = $8::jsonb,
        channels = $9::jsonb,
        template = $10,
        action_label = $11,
        action_url_template = $12,
        cooldown_minutes = $13,
        is_active = $14,
        updated_at = now()
       where id = $1::uuid`,
      [id, rule.name, rule.description, rule.eventType, rule.entityType, JSON.stringify(rule.conditions), rule.severity, JSON.stringify(rule.recipientStrategy), JSON.stringify(rule.channels), rule.template, rule.actionLabel, rule.actionUrlTemplate, rule.cooldownMinutes, rule.isActive]
    );
    publishRealtimeEvent({ type: "notification.created", scope: "notifications", entityId: id, payload: { sourceType: "rule.updated", title: rule.name } });
    done("Regra de notificação atualizada.");
  } catch (error) {
    fail(error instanceof Error ? error.message : "Não foi possível atualizar a regra.");
  }
}

export async function toggleNotificationRuleAction(formData: FormData) {
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Regra");
  const nextActive = String(formData.get("nextActive") ?? "false") === "true";
  await query(`update notification_rules set is_active = $2, updated_at = now() where id = $1::uuid`, [id, nextActive]);
  done(nextActive ? "Regra ativada." : "Regra desativada.");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const session = await requireSession();
  const receiveInternal = formData.get("receiveInternal") === "on";
  const receivePush = formData.get("receivePush") === "on";
  const muteInfo = formData.get("muteInfo") === "on";
  const keepCriticalEnabled = formData.get("keepCriticalEnabled") === "on";
  const muteUntilRaw = String(formData.get("muteUntil") ?? "").trim();
  const quietEnabled = formData.get("quietEnabled") === "on";
  const quietFrom = String(formData.get("quietFrom") ?? "18:00").trim() || "18:00";
  const quietTo = String(formData.get("quietTo") ?? "08:00").trim() || "08:00";
  const mutedRuleIds = formData.getAll("mutedRuleIds").map(String).filter(Boolean);

  await query(
    `insert into notification_preferences (user_id, receive_internal, receive_push, mute_info, keep_critical_enabled, mute_until, quiet_hours, muted_rule_ids)
     values ($1::uuid, $2, $3, $4, $5, nullif($6, '')::timestamptz, $7::jsonb, $8::uuid[])
     on conflict (user_id) do update set
      receive_internal = excluded.receive_internal,
      receive_push = excluded.receive_push,
      mute_info = excluded.mute_info,
      keep_critical_enabled = excluded.keep_critical_enabled,
      mute_until = excluded.mute_until,
      quiet_hours = excluded.quiet_hours,
      muted_rule_ids = excluded.muted_rule_ids,
      updated_at = now()`,
    [session.id, receiveInternal, receivePush, muteInfo, keepCriticalEnabled, muteUntilRaw, JSON.stringify({ enabled: quietEnabled, from: quietFrom, to: quietTo }), mutedRuleIds]
  );
  done("Preferências de notificação salvas.");
}

export async function runNotificationRulesAction() {
  await requireAdmin();
  try {
    const result = await runNotificationRulesOnce();
    done(`Motor executado: ${result.notificationsCreated} notificação(ões) criada(s), ${result.skippedByCooldown} ignorada(s) por cooldown.`);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Não foi possível executar o motor de regras.");
  }
}
