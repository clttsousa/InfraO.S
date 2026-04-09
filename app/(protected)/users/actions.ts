"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { query } from "@/lib/db";
import { isTrustedServerActionRequest } from "@/lib/server-action-security";
import { requireAdmin, requireSession } from "@/lib/session";
import { ensureEmail, ensurePasswordStrength, ensureUuid } from "@/lib/validation";

function fail(message: string) {
  redirect(`/users?error=${encodeURIComponent(message)}`);
}

function success(message: string) {
  revalidatePath("/users");
  revalidatePath("/settings");
  redirect(`/users?success=${encodeURIComponent(message)}`);
}

async function guardUserAction(fallbackPath: string) {
  if (await isTrustedServerActionRequest()) return;
  redirect(`${fallbackPath}?error=${encodeURIComponent("Solicitação bloqueada por segurança. Recarregue a página e tente novamente.")}`);
}

async function ensureLastAdminIsPreserved(userId: string, nextRole?: string, nextActive?: boolean) {
  const result = await query<{ active_admins: string }>(`select count(*)::text as active_admins from internal_users where role = 'ADMIN' and is_active = true`);
  const activeAdmins = Number(result.rows[0]?.active_admins ?? 0);
  const current = await query<{ role: "ADMIN" | "OPERADOR"; is_active: boolean }>(`select role, is_active from internal_users where id = $1 limit 1`, [userId]);
  const row = current.rows[0];
  if (!row) fail("Usuário não encontrado.");

  const isRemovingAdmin = row.role === "ADMIN" && row.is_active && (nextRole === "OPERADOR" || nextActive === false);
  if (isRemovingAdmin && activeAdmins <= 1) {
    fail("Não é possível remover ou inativar o último administrador ativo.");
  }
}

export async function createInternalUserAction(formData: FormData) {
  await guardUserAction("/users");
  await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = ensureEmail(String(formData.get("email") ?? ""));
  const password = ensurePasswordStrength(String(formData.get("password") ?? ""));
  const role = String(formData.get("role") ?? "OPERADOR");
  const isActive = formData.get("isActive") === "on";

  if (!fullName) fail("Preencha o nome do usuário.");
  if (!["ADMIN", "OPERADOR"].includes(role)) fail("Perfil inválido.");

  try {
    await query(`insert into internal_users (full_name, email, password_hash, role, is_active, password_changed_at) values ($1, $2, crypt($3, gen_salt('bf')), $4, $5, now())`, [fullName, email, password, role, isActive]);
  } catch (error) {
    if (error instanceof Error && /duplicate key|unique/i.test(error.message)) fail("Já existe um usuário com este e-mail.");
    throw error;
  }

  success("Usuário cadastrado.");
}

export async function updateInternalUserAction(formData: FormData) {
  await guardUserAction("/users");
  const session = await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Usuário");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = ensureEmail(String(formData.get("email") ?? ""));
  const role = String(formData.get("role") ?? "OPERADOR");

  if (!fullName) fail("Nome obrigatório.");
  if (!["ADMIN", "OPERADOR"].includes(role)) fail("Perfil inválido.");

  await ensureLastAdminIsPreserved(id, role);

  try {
    await query(`update internal_users set full_name = $2, email = $3, role = $4, updated_at = now() where id = $1`, [id, fullName, email, role]);
  } catch (error) {
    if (error instanceof Error && /duplicate key|unique/i.test(error.message)) fail("Já existe um usuário com este e-mail.");
    throw error;
  }

  success(session.id === id ? "Seu usuário foi atualizado." : "Usuário atualizado.");
}


export async function updateInternalUserRoleAction(formData: FormData) {
  await guardUserAction("/users");
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Usuário");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "OPERADOR");

  if (!fullName) fail("Nome obrigatório.");
  if (!["ADMIN", "OPERADOR"].includes(role)) fail("Perfil inválido.");

  await ensureLastAdminIsPreserved(id, role);
  await query(`update internal_users set full_name = $2, role = $3, updated_at = now() where id = $1`, [id, fullName, role]);
  success("Perfil do usuário atualizado.");
}

export async function toggleInternalUserAction(formData: FormData) {
  await guardUserAction("/users");
  const session = await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Usuário");
  const nextActive = String(formData.get("nextActive") ?? "false") === "true";

  if (session.id === id && !nextActive) fail("Você não pode inativar a sua própria conta em sessão.");
  await ensureLastAdminIsPreserved(id, undefined, nextActive);
  await query(`update internal_users set is_active = $2, updated_at = now() where id = $1`, [id, nextActive]);
  success("Status do usuário atualizado.");
}

export async function resetInternalUserPasswordAction(formData: FormData) {
  await guardUserAction("/users");
  await requireAdmin();
  const id = ensureUuid(String(formData.get("id") ?? ""), "Usuário");
  const newPassword = ensurePasswordStrength(String(formData.get("newPassword") ?? ""));

  await query(`update internal_users set password_hash = crypt($2, gen_salt('bf')), password_changed_at = now(), session_version = session_version + 1, updated_at = now() where id = $1`, [id, newPassword]);
  success("Senha redefinida.");
}

export async function changeOwnPasswordAction(formData: FormData) {
  await guardUserAction("/profile");
  const session = await requireSession();
  const currentPassword = ensurePasswordStrength(String(formData.get("currentPassword") ?? ""));
  const newPassword = ensurePasswordStrength(String(formData.get("newPassword") ?? ""));
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (newPassword !== confirmPassword) {
    redirect(`/profile?error=${encodeURIComponent("A confirmação de senha não confere.")}`);
  }

  const current = await query<{ id: string }>(
    `select id from internal_users where id = $1 and password_hash = crypt($2, password_hash) limit 1`,
    [session.id, currentPassword]
  );

  if (!current.rows[0]) {
    redirect(`/profile?error=${encodeURIComponent("A senha atual não confere.")}`);
  }

  await query(`update internal_users set password_hash = crypt($2, gen_salt('bf')), password_changed_at = now(), session_version = session_version + 1, updated_at = now() where id = $1`, [session.id, newPassword]);
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect(`/login?success=${encodeURIComponent("Senha alterada. Faça login novamente.")}`);
}
