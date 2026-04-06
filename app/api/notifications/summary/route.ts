import { NextResponse } from "next/server";
import { getNotificationSummary } from "@/lib/data";

export async function GET() {
  const summary = await getNotificationSummary();
  return NextResponse.json(summary, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
