import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  const session = await getSessionUser();
  if (session) {
    await query(`update internal_users set last_seen_at = now() - interval '16 minutes' where id = $1`, [session.id]).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
