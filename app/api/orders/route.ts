import { NextResponse } from "next/server";
import { getServiceOrdersPageData } from "@/lib/data";
import { parseOrderFilters } from "@/lib/filter-params";
import { requireApiSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const filters = parseOrderFilters(params);
    const pageData = await getServiceOrdersPageData(filters);
    return NextResponse.json(pageData, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[infraos] orders api error", error);
    return NextResponse.json({ message: "Não foi possível carregar as ordens no momento." }, { status: 500 });
  }
}
