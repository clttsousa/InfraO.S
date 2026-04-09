"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { PoolClient } from "pg";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { toDateTimeLocalValue } from "@/lib/format";
import { isTrustedServerActionRequest } from "@/lib/server-action-security";
import { ensureExternalHttpUrl } from "@/lib/url-safety";
import { cleanText, ensureDateTime, ensureEnum, ensureUuid, normalizeUuid } from "@/lib/validation";
import type { OrderPriorityDb, OrderStatusDb } from "@/types";

function encodeMessage(value: string) {
  return encodeURIComponent(value);
}

function stripActionParam(url: string) {
  return url.replace(/([?&])action=[^&]+&?/, "$1").replace(/[?&]$/, "");
}

function appendMessage(url: string, key: "success" | "error", message: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${stripActionParam(url)}${joiner}${key}=${encodeMessage(message)}`;
}

async function guardOrderAction(fallbackPath: string) {
  const isTrusted = await isTrustedServerActionRequest();
  if (isTrusted) return;
  redirect(appendMessage(fallbackPath, "error", "Solicitação bloqueada por segurança. Recarregue a página e tente novamente."));
}

function normalizeSupportTechnicianIds(formData: FormData) {
  const values = formData
    .getAll("supportTechnicianIds")
    .map((value) => normalizeUuid(cleanText(value)))
    .filter((value): value is string => Boolean(value));

  return [...new Set(values)];
}

function normalizeOrderPayload(formData: FormData) {
  const deadlineAt = cleanText(formData.get("deadlineAt"));
  const technicianId = normalizeUuid(cleanText(formData.get("technicianId")));
  return {
    orderNumber: cleanText(formData.get("orderNumber")),
    openedAt: cleanText(formData.get("openedAt")),
    openedBy: cleanText(formData.get("openedBy")),
    openingDescription: cleanText(formData.get("openingDescription")),
    clientCode: cleanText(formData.get("clientCode")),
    clientName: cleanText(formData.get("clientName")),
    addressText: cleanText(formData.get("addressText")),
    locationLink: ensureExternalHttpUrl(cleanText(formData.get("locationLink")), "Link de localização"),
    technicianId,
    supportTechnicianIds: normalizeSupportTechnicianIds(formData).filter((id) => id !== technicianId),
    internalOwnerId: normalizeUuid(cleanText(formData.get("internalOwnerId"))),
    priority: (cleanText(formData.get("priority")) ?? "MEDIA") as OrderPriorityDb,
    deadlineAt: deadlineAt ? ensureDateTime(deadlineAt, "Prazo") : null,
    internalNote: cleanText(formData.get("internalNote")),
    rawInput: cleanText(formData.get("rawInput"))
  };
}

async function insertLog(
  client: PoolClient,
  serviceOrderId: string,
  internalUserId: string,
  actionType: string,
  note?: string | null,
  oldValue?: unknown,
  newValue?: unknown
) {
  await client.query(
    `
      insert into service_order_logs (service_order_id, internal_user_id, action_type, note, old_value, new_value)
      values ($1, $2, $3, nullif($4, ''), $5::jsonb, $6::jsonb)
    `,
    [
      serviceOrderId,
      internalUserId,
      actionType,
      note ?? null,
      oldValue !== undefined ? JSON.stringify(oldValue) : null,
      newValue !== undefined ? JSON.stringify(newValue) : null
    ]
  );
}

async function getTechnicianNames(client: PoolClient, oldId: string | null, newId: string | null) {
  const ids = [oldId, newId].filter((value): value is string => Boolean(value));
  if (!ids.length) {
    return { oldName: null, newName: null };
  }
  const result = await client.query<{ id: string; full_name: string }>(`select id, full_name from technicians where id = any($1::uuid[])`, [ids]);
  const map = new Map(result.rows.map((row: { id: string; full_name: string }) => [row.id, row.full_name]));
  return {
    oldName: oldId ? map.get(oldId) ?? null : null,
    newName: newId ? map.get(newId) ?? null : null
  };
}

async function getTechnicianNameMap(client: PoolClient, technicianIds: string[]) {
  if (!technicianIds.length) return new Map<string, string>();
  const result = await client.query<{ id: string; full_name: string }>(`select id, full_name from technicians where id = any($1::uuid[])`, [technicianIds]);
  return new Map(result.rows.map((row) => [row.id, row.full_name]));
}

async function getSupportTechnicianIds(client: PoolClient, serviceOrderId: string) {
  const result = await client.query<{ technician_id: string }>(
    `select technician_id::text as technician_id from service_order_technicians where service_order_id = $1::uuid and role = 'SUPPORT' order by created_at asc`,
    [serviceOrderId]
  );
  return result.rows.map((row) => row.technician_id);
}

async function syncSupportTechnicians(client: PoolClient, serviceOrderId: string, primaryTechnicianId: string | null, supportTechnicianIds: string[]) {
  const filteredIds = [...new Set(supportTechnicianIds)].filter((id) => id !== primaryTechnicianId);
  await client.query(`delete from service_order_technicians where service_order_id = $1::uuid and role = 'SUPPORT'`, [serviceOrderId]);
  if (filteredIds.length) {
    await client.query(
      `insert into service_order_technicians (service_order_id, technician_id, role) select $1::uuid, value::uuid, 'SUPPORT' from unnest($2::text[]) as value`,
      [serviceOrderId, filteredIds]
    );
  }
  return filteredIds;
}

function isRecoverableStatus(value: string): value is Extract<OrderStatusDb, "ABERTA" | "ENCAMINHADA" | "EM_ACOMPANHAMENTO" | "PENDENTE"> {
  return ["ABERTA", "ENCAMINHADA", "EM_ACOMPANHAMENTO", "PENDENTE"].includes(value);
}

function revalidateOperationalViews() {
  revalidatePath("/orders");
  revalidateTag("dashboard", "max");
  revalidateTag("reports", "max");
}

function isMissingSavedViewsTableError(error: unknown) {
  return error instanceof Error && /saved_order_views|does not exist|relation .* does not exist/i.test(error.message);
}

function ensureLifecycleTransition(currentStatus: OrderStatusDb, action: "status" | "finish" | "reopen" | "cancel") {
  if (action === "status" && ["FINALIZADA", "CANCELADA"].includes(currentStatus)) {
    throw new Error("Ordem encerrada não pode trocar status sem reabertura.");
  }
  if (action === "finish" && ["FINALIZADA", "CANCELADA"].includes(currentStatus)) {
    throw new Error("Somente ordens abertas podem ser finalizadas.");
  }
  if (action === "cancel" && ["FINALIZADA", "CANCELADA"].includes(currentStatus)) {
    throw new Error("Somente ordens abertas podem ser canceladas.");
  }
  if (action === "reopen" && !["FINALIZADA", "CANCELADA"].includes(currentStatus)) {
    throw new Error("Apenas ordens finalizadas ou canceladas podem ser reabertas.");
  }
}

export async function createServiceOrderAction(formData: FormData) {
  await guardOrderAction("/orders/new");
  const session = await requireSession();
  const payload = normalizeOrderPayload(formData);

  if (!payload.orderNumber || !payload.openingDescription || !payload.internalOwnerId) {
    redirect(`/orders/new?error=${encodeMessage("Preencha número da O.S., descrição e responsável interno.")}`);
  }

  let redirectTarget = `/orders/new?error=${encodeMessage("Não foi possível salvar a O.S.")}`;
  const client = await db.connect();

  try {
    await client.query("begin");

    const inserted = await client.query<{ id: string }>(
      `
        insert into service_orders (
          order_number, opened_at, opened_by, opening_description, client_code, client_name, address_text,
          location_link, technician_id, internal_owner_id, priority, status, deadline_at, internal_note,
          created_by_user_id, updated_by_user_id, last_status_changed_at, last_status_changed_by_user_id
        )
        values (
          $1, (nullif($2, '')::timestamp at time zone 'America/Sao_Paulo'), nullif($3, ''), $4, nullif($5, ''), nullif($6, ''), nullif($7, ''),
          nullif($8, ''), $9::uuid, $10::uuid, $11, 'ABERTA', (nullif($12, '')::timestamp at time zone 'America/Sao_Paulo'), nullif($13, ''),
          $14::uuid, $14::uuid, now(), $14::uuid
        )
        returning id
      `,
      [
        payload.orderNumber,
        payload.openedAt,
        payload.openedBy,
        payload.openingDescription,
        payload.clientCode,
        payload.clientName,
        payload.addressText,
        payload.locationLink,
        payload.technicianId,
        payload.internalOwnerId,
        ensureEnum(payload.priority, ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const, "Prioridade"),
        payload.deadlineAt,
        payload.internalNote,
        session.id
      ]
    );

    const orderId = inserted.rows[0]?.id;
    if (!orderId) throw new Error("Falha ao criar a ordem.");

    const supportTechnicianIds = await syncSupportTechnicians(client, orderId, payload.technicianId, payload.supportTechnicianIds);

    await insertLog(client, orderId, session.id, "Criou a O.S.", payload.rawInput ? "Cadastro realizado com apoio do parser por texto colado." : "Cadastro manual da O.S.", null, {
      orderNumber: payload.orderNumber,
      internalOwnerId: payload.internalOwnerId,
      technicianId: payload.technicianId,
      supportTechnicianIds,
      priority: payload.priority
    });

    if (supportTechnicianIds.length) {
      const supportNameMap = await getTechnicianNameMap(client, supportTechnicianIds);
      const supportNames = supportTechnicianIds.map((id) => supportNameMap.get(id) ?? id);
      await insertLog(client, orderId, session.id, "Definiu técnicos de apoio.", supportNames.join(", "), null, { supportTechnicianIds });
    }

    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = `/orders?selected=${orderId}&success=${encodeMessage("O.S. cadastrada com sucesso.")}`;
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error && /duplicate key/i.test(error.message) ? "Já existe uma O.S. com esse número." : error instanceof Error ? error.message : "Não foi possível salvar a O.S.";
    redirectTarget = `/orders/new?error=${encodeMessage(message)}`;
  } finally {
    client.release();
  }

  redirect(redirectTarget);
}

export async function updateServiceOrderAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const payload = normalizeOrderPayload(formData);

  if (!payload.orderNumber || !payload.openingDescription || !payload.internalOwnerId) {
    redirect(appendMessage(redirectTo, "error", "Dados obrigatórios da O.S. não foram informados."));
  }

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível atualizar a O.S.");
  const client = await db.connect();

  try {
    await client.query("begin");

    const current = await client.query<{
      order_number: string; opened_at: string | null; opened_by: string | null; opening_description: string; client_code: string | null; client_name: string | null; address_text: string | null; location_link: string | null; technician_id: string | null; internal_owner_id: string | null; priority: string; deadline_at: string | null; internal_note: string | null;
    }>(`select order_number, opened_at, opened_by, opening_description, client_code, client_name, address_text, location_link, technician_id, internal_owner_id, priority, deadline_at, internal_note from service_orders where id = $1 limit 1`, [id]);

    const currentRow = current.rows[0];
    if (!currentRow) throw new Error("Ordem não encontrada.");
    const currentSupportTechnicianIds = await getSupportTechnicianIds(client, id);

    await client.query(
      `
        update service_orders
        set order_number = $2, opened_at = (nullif($3, '')::timestamp at time zone 'America/Sao_Paulo'), opened_by = nullif($4, ''), opening_description = $5,
            client_code = nullif($6, ''), client_name = nullif($7, ''), address_text = nullif($8, ''), location_link = nullif($9, ''),
            technician_id = $10::uuid, internal_owner_id = $11::uuid, priority = $12, deadline_at = (nullif($13, '')::timestamp at time zone 'America/Sao_Paulo'),
            internal_note = nullif($14, ''), updated_by_user_id = $15::uuid, updated_at = now()
        where id = $1
      `,
      [id, payload.orderNumber, payload.openedAt, payload.openedBy, payload.openingDescription, payload.clientCode, payload.clientName, payload.addressText, payload.locationLink, payload.technicianId, payload.internalOwnerId, ensureEnum(payload.priority, ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const, "Prioridade"), payload.deadlineAt, payload.internalNote, session.id]
    );

    const supportTechnicianIds = await syncSupportTechnicians(client, id, payload.technicianId, payload.supportTechnicianIds);

    await insertLog(client, id, session.id, "Editou a O.S.", "Dados principais atualizados.", { ...currentRow, supportTechnicianIds: currentSupportTechnicianIds }, { ...payload, supportTechnicianIds });

    if ((currentRow.technician_id ?? null) !== (payload.technicianId ?? null)) {
      const names = await getTechnicianNames(client, currentRow.technician_id, payload.technicianId);
      await insertLog(client, id, session.id, "Alterou o técnico responsável.", `${names.oldName ?? "Não definido"} → ${names.newName ?? "Não definido"}`, { technicianId: currentRow.technician_id }, { technicianId: payload.technicianId });
    }

    const currentSupportKey = currentSupportTechnicianIds.slice().sort().join(",");
    const newSupportKey = supportTechnicianIds.slice().sort().join(",");
    if (currentSupportKey !== newSupportKey) {
      const supportNameMap = await getTechnicianNameMap(client, [...currentSupportTechnicianIds, ...supportTechnicianIds]);
      const oldNames = currentSupportTechnicianIds.map((supportId) => supportNameMap.get(supportId) ?? supportId);
      const newNames = supportTechnicianIds.map((supportId) => supportNameMap.get(supportId) ?? supportId);
      await insertLog(client, id, session.id, "Atualizou os técnicos de apoio.", `${oldNames.length ? oldNames.join(", ") : "Sem apoio"} → ${newNames.length ? newNames.join(", ") : "Sem apoio"}`, { supportTechnicianIds: currentSupportTechnicianIds }, { supportTechnicianIds });
    }

    const currentDeadlineValue = currentRow.deadline_at ? toDateTimeLocalValue(currentRow.deadline_at) : null;
    if ((currentDeadlineValue ?? null) != (payload.deadlineAt ?? null)) {
      await insertLog(client, id, session.id, "Alterou o prazo da O.S.", `Prazo anterior: ${currentRow.deadline_at ?? "sem prazo"}. Novo prazo: ${payload.deadlineAt ?? "sem prazo"}.`, { deadlineAt: currentRow.deadline_at }, { deadlineAt: payload.deadlineAt });
    }

    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "O.S. atualizada com sucesso.");
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error && /duplicate key/i.test(error.message) ? "Já existe uma O.S. com esse número." : error instanceof Error ? error.message : "Não foi possível atualizar a O.S.";
    redirectTarget = appendMessage(redirectTo, "error", message);
  } finally {
    client.release();
  }

  redirect(redirectTarget);
}

export async function updateServiceOrderStatusAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!isRecoverableStatus(status)) {
    redirect(appendMessage(redirectTo, "error", "Selecione um status válido."));
  }

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível alterar o status.");
  const client = await db.connect();
  try {
    await client.query("begin");
    const current = await client.query<{ status: OrderStatusDb }>(`select status from service_orders where id = $1 limit 1`, [id]);
    if (!current.rows[0]) throw new Error("Ordem não encontrada.");
    ensureLifecycleTransition(current.rows[0].status, "status");

    await client.query(`update service_orders set status = $2, updated_by_user_id = $3::uuid, updated_at = now(), last_status_changed_at = now(), last_status_changed_by_user_id = $3::uuid where id = $1`, [id, status, session.id]);
    await insertLog(client, id, session.id, "Alterou o status da O.S.", note || `Novo status: ${status}`, { status: current.rows[0].status }, { status });
    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "Status atualizado com sucesso.");
  } catch (error) {
    await client.query("rollback");
    redirectTarget = appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível alterar o status.");
  } finally { client.release(); }

  redirect(redirectTarget);
}

export async function finalizeServiceOrderAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const note = String(formData.get("note") ?? "").trim();

  if (!note) redirect(appendMessage(redirectTo, "error", "Informe a observação de fechamento para finalizar a O.S."));

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível finalizar a O.S.");
  const client = await db.connect();
  try {
    await client.query("begin");
    const current = await client.query<{ status: OrderStatusDb; finalized_at: string | null }>(`select status, finalized_at from service_orders where id = $1 limit 1`, [id]);
    if (!current.rows[0]) throw new Error("Ordem não encontrada.");
    ensureLifecycleTransition(current.rows[0].status, "finish");

    await client.query(`update service_orders set status = 'FINALIZADA', finalized_at = now(), finalized_by_user_id = $2::uuid, closing_note = $3, updated_by_user_id = $2::uuid, updated_at = now(), last_status_changed_at = now(), last_status_changed_by_user_id = $2::uuid where id = $1`, [id, session.id, note]);
    await insertLog(client, id, session.id, "Finalizou a O.S.", note, { status: current.rows[0].status, finalizedAt: current.rows[0].finalized_at }, { status: "FINALIZADA", finalizedAt: "now" });
    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "O.S. finalizada com sucesso.");
  } catch (error) {
    await client.query("rollback");
    redirectTarget = appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível finalizar a O.S.");
  } finally { client.release(); }
  redirect(redirectTarget);
}

export async function reopenServiceOrderAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(appendMessage(redirectTo, "error", "Informe o motivo da reabertura."));

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível reabrir a O.S.");
  const client = await db.connect();
  try {
    await client.query("begin");
    const current = await client.query<{ status: OrderStatusDb }>(`select status from service_orders where id = $1 limit 1`, [id]);
    if (!current.rows[0]) throw new Error("Ordem não encontrada.");
    ensureLifecycleTransition(current.rows[0].status, "reopen");

    await client.query(`update service_orders set status = 'ABERTA', reopened_at = now(), reopened_by_user_id = $2::uuid, updated_by_user_id = $2::uuid, updated_at = now(), last_status_changed_at = now(), last_status_changed_by_user_id = $2::uuid, finalized_at = null, finalized_by_user_id = null, closing_note = null, canceled_at = null, canceled_by_user_id = null, cancellation_note = null where id = $1`, [id, session.id]);
    await insertLog(client, id, session.id, "Reabriu a O.S.", reason, { status: current.rows[0].status }, { status: "ABERTA" });
    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "O.S. reaberta com sucesso.");
  } catch (error) {
    await client.query("rollback");
    redirectTarget = appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível reabrir a O.S.");
  } finally { client.release(); }
  redirect(redirectTarget);
}

export async function cancelServiceOrderAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(appendMessage(redirectTo, "error", "Informe o motivo do cancelamento."));

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível cancelar a O.S.");
  const client = await db.connect();
  try {
    await client.query("begin");
    const current = await client.query<{ status: OrderStatusDb }>(`select status from service_orders where id = $1 limit 1`, [id]);
    if (!current.rows[0]) throw new Error("Ordem não encontrada.");
    ensureLifecycleTransition(current.rows[0].status, "cancel");

    await client.query(`update service_orders set status = 'CANCELADA', canceled_at = now(), canceled_by_user_id = $2::uuid, cancellation_note = $3, updated_by_user_id = $2::uuid, updated_at = now(), last_status_changed_at = now(), last_status_changed_by_user_id = $2::uuid where id = $1`, [id, session.id, reason]);
    await insertLog(client, id, session.id, "Cancelou a O.S.", reason, { status: current.rows[0].status }, { status: "CANCELADA" });
    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "O.S. cancelada com sucesso.");
  } catch (error) {
    await client.query("rollback");
    redirectTarget = appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível cancelar a O.S.");
  } finally { client.release(); }
  redirect(redirectTarget);
}

export async function addServiceOrderNoteAction(formData: FormData) {
  const rawId = String(formData.get("id") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? (rawId ? `/orders?selected=${rawId}` : "/orders")).trim();
  await guardOrderAction(redirectTo);
  const session = await requireSession();
  const id = ensureUuid(rawId, "Ordem");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) redirect(appendMessage(redirectTo, "error", "Escreva uma observação antes de salvar."));

  let redirectTarget = appendMessage(redirectTo, "error", "Não foi possível salvar a observação.");
  const client = await db.connect();
  try {
    await client.query("begin");
    await client.query(`insert into service_order_notes (service_order_id, internal_user_id, note) values ($1, $2, $3)`, [id, session.id, note]);
    await client.query(`update service_orders set updated_by_user_id = $2, updated_at = now() where id = $1`, [id, session.id]);
    await insertLog(client, id, session.id, "Adicionou observação interna.", note);
    await client.query("commit");
    revalidateOperationalViews();
    redirectTarget = appendMessage(redirectTo, "success", "Observação adicionada com sucesso.");
  } catch (error) {
    await client.query("rollback");
    redirectTarget = appendMessage(redirectTo, "error", error instanceof Error ? error.message : "Não foi possível salvar a observação.");
  } finally { client.release(); }
  redirect(redirectTarget);
}


export async function saveOrderViewAction(formData: FormData) {
  await guardOrderAction("/orders");
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const queryString = String(formData.get("queryString") ?? "").trim();

  if (!name) {
    redirect(`/orders?error=${encodeMessage("Informe um nome para salvar a visão atual.")}`);
  }

  try {
    await db.query(
      `
        insert into saved_order_views (internal_user_id, name, query_string)
        values ($1::uuid, $2, $3)
        on conflict (internal_user_id, name) do update
        set query_string = excluded.query_string, updated_at = now()
      `,
      [session.id, name, queryString]
    );
    revalidatePath("/orders");
    redirect(`/orders?${queryString}${queryString ? "&" : ""}success=${encodeMessage("Visão salva com sucesso.")}`);
  } catch (error) {
    const message = isMissingSavedViewsTableError(error)
      ? "Aplique a migration database/11_saved_order_views.sql para habilitar filtros salvos."
      : error instanceof Error
        ? error.message
        : "Não foi possível salvar a visão atual.";
    redirect(`/orders?${queryString}${queryString ? "&" : ""}error=${encodeMessage(message)}`);
  }
}

export async function deleteOrderViewAction(formData: FormData) {
  await guardOrderAction("/orders");
  const session = await requireSession();

  try {
    const id = ensureUuid(String(formData.get("id") ?? "").trim(), "Filtro salvo");
    await db.query(`delete from saved_order_views where id = $1::uuid and internal_user_id = $2::uuid`, [id, session.id]);
    revalidatePath("/orders");
    redirect(`/orders?success=${encodeMessage("Filtro salvo removido.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover o filtro salvo.";
    redirect(`/orders?error=${encodeMessage(message)}`);
  }
}
