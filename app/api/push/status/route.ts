import { NextResponse } from "next/server";
import { getPushSubscriptionStatus } from "@/lib/push-notifications";
import { requireApiSession } from "@/lib/session";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const status = await getPushSubscriptionStatus(session.id);
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
