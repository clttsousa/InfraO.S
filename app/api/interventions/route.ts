import { NextResponse } from "next/server";
import { getInterventionsPageData, parseInterventionFilters } from "@/lib/data";
import { requireApiSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const filters = parseInterventionFilters(params);
  const data = await getInterventionsPageData(filters);
  return NextResponse.json(data);
}
