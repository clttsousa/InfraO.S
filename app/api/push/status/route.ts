import { NextResponse } from "next/server";
import { getPushSubscriptionStatus } from "@/lib/push-notifications";
import { requireApiSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const status = await getPushSubscriptionStatus(session.id, endpoint);
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
