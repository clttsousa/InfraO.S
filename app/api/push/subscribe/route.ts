import { NextResponse } from "next/server";
import { savePushSubscription, type PushSubscriptionPayload } from "@/lib/push-notifications";
import { requireApiSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let payload: PushSubscriptionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido." }, { status: 400 });
  }

  try {
    const saved = await savePushSubscription(session.id, payload, request.headers.get("user-agent"));
    return NextResponse.json({ ok: true, id: saved?.id ?? null });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Falha ao salvar dispositivo." }, { status: 400 });
  }
}
