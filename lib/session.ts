import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { type SessionUser, verifySessionToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }
  return session as SessionUser;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    redirect("/dashboard?forbidden=1");
  }
  return session;
}

export async function requireApiSession() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 });
  }
  return session;
}

export async function requireApiAdmin() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Acesso restrito a administradores." }, { status: 403 });
  }
  return session;
}
