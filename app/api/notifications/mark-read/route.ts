import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiSession } from "@/lib/session";
import { isUuid } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  let payload: { id?: string; all?: boolean } = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  if (payload.all) {
    const result = await query(
      `update app_notifications set read_at = now() where user_id = $1::uuid and read_at is null`,
      [session.id]
    );
    return NextResponse.json({ ok: true, updated: result.rowCount ?? 0 });
  }

  if (!isUuid(payload.id)) {
    return NextResponse.json({ ok: false, message: "Notificação inválida." }, { status: 400 });
  }

  const result = await query(
    `update app_notifications set read_at = now() where id = $1::uuid and user_id = $2::uuid and read_at is null`,
    [payload.id, session.id]
  );

  return NextResponse.json({ ok: true, updated: result.rowCount ?? 0 });
}
