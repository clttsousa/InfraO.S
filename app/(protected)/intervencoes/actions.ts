"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PoolClient } from "pg";
import { writeAuditEvent } from "@/lib/audit";
import { getSafeActionErrorMessage, isNextRedirectError } from "@/lib/action-errors";
import { INTERVENTION_SOURCE_OPTIONS, INTERVENTION_STATUS_OPTIONS, INTERVENTION_TYPE_OPTIONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { combineDateAndTime } from "@/lib/interventions";
import { publishRealtimeEvent } from "@/lib/realtime";
import { DEFAULT_REMINDER_TYPES, REMINDER_TYPE_OPTIONS, normalizeDailyTime, normalizeReminderTypes } from "@/lib/intervention-reminder-config";
import { syncInterventionReminders } from "@/lib/reminders";
import { requireSession } from "@/lib/session";
import { cleanText, ensureDateTime, ensureEnum, ensureUuid, normalizeUuid } from "@/lib/validation";
import type { InterventionReminderConfig, InterventionSourceDb, InterventionStatusDb, InterventionTypeDb, ReminderTypeDb } from "@/types";

const typeValues = INTERVENTION_TYPE_OPTIONS.map((item) => item.value) as InterventionTypeDb[];
const statusValues = INTERVENTION_STATUS_OPTIONS.map((item) => item.value) as InterventionStatusDb[];
const sourceValues = INTERVENTION_SOURCE_OPTIONS.map((item) => item.value) as InterventionSourceDb[];

function encodeMessage(value: string) {
  return encodeURIComponent(value);
}

function stripActionParam(url: string) {
  return url.replace(/([?&])action=[^&]+&?/, "$1").replace(/[?&]$/, "");
}

function appendMessage(url: string, key: "success" | "error", message: string) {
  const cleanUrl = stripActionParam(url || "/intervencoes");
  const joiner = cleanUrl.includes("?") ? "&" : "?";
  return `${cleanUrl}${joiner}${key}=${encodeMessage(message)}`;
}

function normalizePoints(formData: FormData) {
  const labels = formData.getAll("pointLabel").map((value) => String(value ?? "").trim());
  const urls = formData.getAll("pointMapsUrl").map((value) => String(value ?? "").trim());

  return labels
    .map((label, index) => ({ label, mapsUrl: urls[index] ?? "" }))
    .filter((point) => point.label || point.mapsUrl)
    .map((point, index) => ({
      label: point.label || `Ponto ${String(index + 1).padStart(2, "0")}`,
      mapsUrl: point.mapsUrl
    }));
}

function normalizeReminderPayload(formData: FormData): InterventionReminderConfig {
  const enabledTypes = normalizeReminderTypes(formData.getAll("reminderType"), DEFAULT_REMINDER_TYPES);
  const customAt = cleanText(formData.get("customReminderAt"));
  const finalTypes = enabledTypes.filter((type) => type !== "custom" || Boolean(customAt));
  return {
    enabledTypes: finalTypes.length ? finalTypes as ReminderTypeDb[] : DEFAULT_REMINDER_TYPES,
    dailyTime: normalizeDailyTime(cleanText(formData.get("dailyReminderTime"))),
    customAt: customAt || null
  };
}

function normalizePayload(formData: FormData) {
  const date = cleanText(formData.get("date"));
  const startAt = combineDateAndTime(date, cleanText(formData.get("startTime")));
  const endAt = combineDateAndTime(date, cleanText(formData.get("endTime")));
  const responsibleId = normalizeUuid(cleanText(formData.get("responsibleUserId")));

  if (!date || !startAt || !endAt) {
    throw new Error("Preencha data, horário inicial e horário final da intervenção.");
  }

  ensureDateTime(startAt, "Horário inicial");
  ensureDateTime(endAt, "Horário final");

  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error("O horário final deve ser maior que o horário inicial.");
  }

  return {
    title: cleanText(formData.get("title")),
    type: ensureEnum(cleanText(formData.get("type")) ?? "OUTRO", typeValues, "Tipo"),
    locationName: cleanText(formData.get("locationName")),
    startAt,
    endAt,
    status: ensureEnum(cleanText(formData.get("status")) ?? "PROGRAMADO", statusValues, "Status"),
    source: ensureEnum(cleanText(formData.get("source")) ?? "WHATSAPP", sourceValues, "Origem"),
    originalMessage: cleanText(formData.get("originalMessage")),
    notes: cleanText(formData.get("notes")),
    responsibleId,
    points: normalizePoints(formData),
    reminderConfig: normalizeReminderPayload(formData)
  };
}

async function syncPoints(client: PoolClient, eventId: string, points: Array<{ label: string; mapsUrl: string }>) {
  await client.query(`delete from infra_event_points where event_id = $1::uuid`, [eventId]);
  if (!points.length) return;

  await client.query(
    `
      insert into infra_event_points (event_id, label, maps_url)
      select $1::uuid, point.label, point.maps_url
      from jsonb_to_recordset($2::jsonb) as point(label text, maps_url text)
    `,
    [eventId, JSON.stringify(points.map((point) => ({ label: point.label, maps_url: point.mapsUrl })))]
  );
}

function publishInterventionRealtime(eventId: string, type: "intervention.created" | "intervention.updated" | "intervention.status_changed", payload?: Record<string, unknown>) {
  publishRealtimeEvent({ type, scope: "interventions", entityId: eventId, payload });
  publishRealtimeEvent({ type: "notification.created", scope: "notifications", entityId: eventId, payload: { sourceType: type, ...payload } });
}

export async function createInterventionAction(formData: FormData) {
  const session = await requireSession();
  const redirectTo = cleanText(formData.get("redirectTo")) ?? "/intervencoes";

  let payload: ReturnType<typeof normalizePayload>;
  try {
    payload = normalizePayload(formData);
  } catch (error) {
    redirect(appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível validar a intervenção."));
  }

  if (!payload.title || !payload.locationName) {
    redirect(appendMessage(redirectTo, "error", "Preencha título e localidade da intervenção."));
  }

  const client = await db.connect();
  try {
    await client.query("begin");
    const inserted = await client.query<{ id: string }>(
      `
        insert into infra_events (
          title, type, location_name, start_at, end_at, status, source,
          original_message, notes, responsible_user_id, reminder_config, created_by, updated_by
        )
        values (
          $1, $2, $3,
          ($4::timestamp at time zone 'America/Sao_Paulo'),
          ($5::timestamp at time zone 'America/Sao_Paulo'),
          $6, $7, nullif($8, ''), nullif($9, ''), $10::uuid, $11::jsonb, $12::uuid, $12::uuid
        )
        returning id::text
      `,
      [
        payload.title,
        payload.type,
        payload.locationName,
        payload.startAt,
        payload.endAt,
        payload.status,
        payload.source,
        payload.originalMessage,
        payload.notes,
        payload.responsibleId,
        JSON.stringify(payload.reminderConfig),
        session.id
      ]
    );

    const eventId = inserted.rows[0]?.id;
    if (!eventId) throw new Error("Falha ao criar intervenção.");

    await syncPoints(client, eventId, payload.points);
    await syncInterventionReminders(client, eventId);

    await writeAuditEvent(client, {
      entityType: "infra_event",
      entityId: eventId,
      scope: "intervention",
      actionType: "intervention.created",
      actorUserId: session.id,
      actorName: session.name,
      note: payload.originalMessage ? "Intervenção criada com mensagem original colada do WhatsApp/origem externa." : "Intervenção criada manualmente.",
      metadata: {
        title: payload.title,
        type: payload.type,
        locationName: payload.locationName,
        startAt: payload.startAt,
        endAt: payload.endAt,
        pointsCount: payload.points.length,
        reminderConfig: payload.reminderConfig
      }
    });

    await client.query("commit");
    revalidatePath("/intervencoes");
    publishInterventionRealtime(eventId, "intervention.created", { title: payload.title, locationName: payload.locationName });
    redirect(`/intervencoes?selected=${eventId}&success=${encodeMessage("Intervenção criada com sucesso.")}`);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    await client.query("rollback");
    console.error("[infraos] create intervention error", error);
    redirect(appendMessage(redirectTo, "error", getSafeActionErrorMessage(error, "Não foi possível criar a intervenção.")));
  } finally {
    client.release();
  }
}

export async function updateInterventionAction(formData: FormData) {
  const session = await requireSession();
  const eventId = ensureUuid(cleanText(formData.get("id")), "Intervenção");
  const redirectTo = cleanText(formData.get("redirectTo")) ?? `/intervencoes?selected=${eventId}`;

  let payload: ReturnType<typeof normalizePayload>;
  try {
    payload = normalizePayload(formData);
  } catch (error) {
    redirect(appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível validar a intervenção."));
  }

  if (!payload.title || !payload.locationName) {
    redirect(appendMessage(redirectTo, "error", "Preencha título e localidade da intervenção."));
  }

  const client = await db.connect();
  try {
    await client.query("begin");

    const currentResult = await client.query<{ status: InterventionStatusDb; title: string; start_at: string; end_at: string; location_name: string }>(
      `select status, title, start_at, end_at, location_name from infra_events where id = $1::uuid and archived_at is null for update`,
      [eventId]
    );
    const current = currentResult.rows[0];
    if (!current) throw new Error("Intervenção não encontrada.");

    await client.query(
      `
        update infra_events
        set title = $2,
            type = $3,
            location_name = $4,
            start_at = ($5::timestamp at time zone 'America/Sao_Paulo'),
            end_at = ($6::timestamp at time zone 'America/Sao_Paulo'),
            status = $7,
            source = $8,
            original_message = nullif($9, ''),
            notes = nullif($10, ''),
            responsible_user_id = $11::uuid,
            reminder_config = $12::jsonb,
            updated_by = $13::uuid,
            updated_at = now()
        where id = $1::uuid
      `,
      [
        eventId,
        payload.title,
        payload.type,
        payload.locationName,
        payload.startAt,
        payload.endAt,
        payload.status,
        payload.source,
        payload.originalMessage,
        payload.notes,
        payload.responsibleId,
        JSON.stringify(payload.reminderConfig),
        session.id
      ]
    );

    await syncPoints(client, eventId, payload.points);
    await syncInterventionReminders(client, eventId);

    await writeAuditEvent(client, {
      entityType: "infra_event",
      entityId: eventId,
      scope: "intervention",
      actionType: current.status !== payload.status ? "intervention.status_changed" : "intervention.updated",
      fieldName: current.status !== payload.status ? "status" : null,
      oldValue: current.status !== payload.status ? current.status : { title: current.title, locationName: current.location_name, startAt: current.start_at, endAt: current.end_at },
      newValue: current.status !== payload.status ? payload.status : { title: payload.title, locationName: payload.locationName, startAt: payload.startAt, endAt: payload.endAt },
      actorUserId: session.id,
      actorName: session.name,
      note: "Intervenção atualizada pela tela de Intervenções.",
      metadata: { pointsCount: payload.points.length, reminderConfig: payload.reminderConfig }
    });

    await client.query("commit");
    revalidatePath("/intervencoes");
    publishInterventionRealtime(eventId, current.status !== payload.status ? "intervention.status_changed" : "intervention.updated", { title: payload.title, status: payload.status });
    redirect(appendMessage(`/intervencoes?selected=${eventId}`, "success", "Intervenção atualizada com sucesso."));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    await client.query("rollback");
    console.error("[infraos] update intervention error", error);
    redirect(appendMessage(redirectTo, "error", getSafeActionErrorMessage(error, "Não foi possível atualizar a intervenção.")));
  } finally {
    client.release();
  }
}

export async function changeInterventionStatusAction(formData: FormData) {
  const session = await requireSession();
  const eventId = ensureUuid(cleanText(formData.get("id")), "Intervenção");
  const status = ensureEnum(cleanText(formData.get("status")), statusValues, "Status");
  const redirectTo = cleanText(formData.get("redirectTo")) ?? `/intervencoes?selected=${eventId}`;

  const client = await db.connect();
  try {
    await client.query("begin");
    const currentResult = await client.query<{ status: InterventionStatusDb; title: string }>(
      `select status, title from infra_events where id = $1::uuid and archived_at is null for update`,
      [eventId]
    );
    const current = currentResult.rows[0];
    if (!current) throw new Error("Intervenção não encontrada.");

    await client.query(
      `update infra_events set status = $2, updated_by = $3::uuid, updated_at = now() where id = $1::uuid`,
      [eventId, status, session.id]
    );
    await syncInterventionReminders(client, eventId);

    await writeAuditEvent(client, {
      entityType: "infra_event",
      entityId: eventId,
      scope: "intervention",
      actionType: status === "CONCLUIDO" ? "intervention.concluded" : status === "CANCELADO" ? "intervention.canceled" : "intervention.status_changed",
      fieldName: "status",
      oldValue: current.status,
      newValue: status,
      actorUserId: session.id,
      actorName: session.name,
      note: "Status alterado pelo detalhe da intervenção."
    });

    await client.query("commit");
    revalidatePath("/intervencoes");
    publishInterventionRealtime(eventId, "intervention.status_changed", { title: current.title, status });
    redirect(appendMessage(`/intervencoes?selected=${eventId}`, "success", "Status da intervenção atualizado."));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    await client.query("rollback");
    console.error("[infraos] change intervention status error", error);
    redirect(appendMessage(redirectTo, "error", getSafeActionErrorMessage(error, "Não foi possível alterar o status.")));
  } finally {
    client.release();
  }
}
