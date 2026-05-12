import { NextResponse } from "next/server";
import { disablePushSubscription } from "@/lib/push-notifications";
import { requireApiSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let endpoint: string | undefined;
  let subscriptionId: string | undefined;
  try {
    const payload = await request.json();
    endpoint = typeof payload?.endpoint === "string" ? payload.endpoint : undefined;
    subscriptionId = typeof payload?.subscriptionId === "string" ? payload.subscriptionId : undefined;
  } catch {
    endpoint = undefined;
    subscriptionId = undefined;
  }

  const disabled = await disablePushSubscription(session.id, endpoint, subscriptionId);
  return NextResponse.json({ ok: true, disabled });
}
