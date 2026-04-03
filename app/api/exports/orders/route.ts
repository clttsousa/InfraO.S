export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServiceOrders } from "@/lib/data";
import { createOrdersWorkbook } from "@/lib/export";
import { parseOrderFilters } from "@/lib/filter-params";
import { requireApiSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const filters = parseOrderFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const orders = await getServiceOrders(filters);
    const workbook = createOrdersWorkbook(orders);

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="infraos-ordens.xlsx"',
        "Cache-Control": "private, no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("[infraos] orders export error", error);
    return NextResponse.json({ message: "Não foi possível exportar as ordens agora." }, { status: 500 });
  }
}
