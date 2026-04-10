import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await request.json().catch(() => ({} as { reason?: string; pathname?: string }));
    await query(
      `update internal_users set last_seen_at = now() where id = $1`,
      [session.id],
    );

    return NextResponse.json({
      ok: true,
      status: "ONLINE",
      lastSeenAt: new Date().toISOString(),
      reason: typeof body.reason === "string" ? body.reason : "heartbeat"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível registrar a presença." },
      { status: 500 },
    );
  }
}
