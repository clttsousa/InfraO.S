import { NextResponse } from "next/server";
import { runNotificationRulesOnce } from "@/lib/notifications/rule-engine";
import { processInterventionReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, message: "CRON_SECRET não configurado no ambiente." };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-cron-secret") ?? "";
  const urlSecret = new URL(request.url).searchParams.get("secret") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  const received = bearer || headerSecret || urlSecret;
  if (received !== secret) {
    return { ok: false, message: "Acesso negado para a rotina de lembretes." };
  }

  return { ok: true, message: "ok" };
}

export async function GET(request: Request) {
  const authorization = isAuthorized(request);
  if (!authorization.ok) {
    return NextResponse.json({ ok: false, message: authorization.message }, { status: authorization.message.includes("configurado") ? 500 : 401 });
  }

  try {
    const reminders = await processInterventionReminders();
    const smartRules = await runNotificationRulesOnce().catch((error) => ({
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao executar motor de notificações inteligentes."
    }));

    return NextResponse.json({ ok: true, reminders, smartRules, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[infraos] cron reminders error", error);
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao processar lembretes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
