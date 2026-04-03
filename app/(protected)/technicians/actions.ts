"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ensureUuid } from "@/lib/validation";

function fail(message: string) {
  redirect(`/technicians?error=${encodeURIComponent(message)}`);
}

function done(message: string) {
  revalidatePath("/technicians");
  revalidatePath("/orders");
  redirect(`/technicians?success=${encodeURIComponent(message)}`);
}

export async function createTechnicianAction(formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!fullName) fail("Nome do técnico obrigatório.");
  await query(`insert into technicians (full_name, phone, is_active) values ($1, nullif($2, ''), $3)`, [fullName, phone, isActive]);
  done("Técnico cadastrado.");
}

export async function updateTechnicianAction(formData: FormData) {
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Técnico");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) fail("Nome do técnico obrigatório.");
  await query(`update technicians set full_name = $2, phone = nullif($3, ''), updated_at = now() where id = $1`, [id, fullName, phone]);
  done("Técnico atualizado.");
}

export async function toggleTechnicianAction(formData: FormData) {
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Técnico");
  const nextActive = String(formData.get("nextActive") ?? "false") === "true";

  await query(`update technicians set is_active = $2, updated_at = now() where id = $1`, [id, nextActive]);
  done("Status do técnico atualizado.");
}
