import { NextResponse } from "next/server";
import { sendTestPushToUser } from "@/lib/push-notifications";
import { requireApiSession } from "@/lib/session";

export async function POST() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  try {
    const result = await sendTestPushToUser(session.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Falha ao enviar notificação de teste." }, { status: 500 });
  }
}
