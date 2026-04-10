import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import { requireApiSession } from "@/lib/session";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const data = await getDashboardData();
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
