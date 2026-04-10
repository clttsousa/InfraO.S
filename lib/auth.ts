import { SignJWT, jwtVerify } from "jose";
import { query } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERADOR";
  sessionVersion: number;
};

type InternalUserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "OPERADOR";
  is_active: boolean;
  session_version: number;
};

function getAuthSecret() {
  return new TextEncoder().encode(getEnv().authSecret);
}

export async function authenticateInternalUser(email: string, password: string): Promise<SessionUser | null> {
  const result = await query<InternalUserRow>(
    `
      select id, full_name, email, role, is_active, session_version
      from internal_users
      where lower(email) = lower($1)
        and is_active = true
        and password_hash = crypt($2, password_hash)
      limit 1
    `,
    [email, password]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  await query(`update internal_users set last_login_at = now(), last_seen_at = now(), updated_at = now() where id = $1`, [user.id]);

  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    sessionVersion: user.session_version
  };
}

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({ role: user.role, name: user.name, email: user.email, sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }

    const result = await query<InternalUserRow>(
      `select id, full_name, email, role, is_active, session_version from internal_users where id = $1 limit 1`,
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return null;
    }

    const tokenSessionVersion = typeof payload.sv === "number" ? payload.sv : Number(payload.sv ?? 0);
    if (!Number.isFinite(tokenSessionVersion) || tokenSessionVersion !== user.session_version) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      sessionVersion: user.session_version
    };
  } catch {
    return null;
  }
}

export function getSessionCookie(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}
