import { NextResponse } from "next/server";
import { getNotificationSummary } from "@/lib/data";
import { requireApiSession } from "@/lib/session";
import type { NotificationFeedFilter } from "@/types";

function getPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function normalizeFilter(value: string | null): NotificationFeedFilter {
  if (["all", "interventions", "orders", "system", "read"].includes(value ?? "")) return value as NotificationFeedFilter;
  return "all";
}

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const url = new URL(request.url);
  const summary = await getNotificationSummary({
    filter: normalizeFilter(url.searchParams.get("filter")),
    page: getPositiveInt(url.searchParams.get("page"), 1),
    pageSize: getPositiveInt(url.searchParams.get("pageSize"), 20)
  });

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
