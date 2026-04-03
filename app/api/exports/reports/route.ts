export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getReportsData } from "@/lib/data";
import { createReportsWorkbook } from "@/lib/export";
import { parseReportFilters } from "@/lib/filter-params";
import { requireApiSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const filters = parseReportFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const report = await getReportsData(filters);
    const workbook = createReportsWorkbook(report);

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="infraos-relatorios.xlsx"',
        "Cache-Control": "private, no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("[infraos] reports export error", error);
    return NextResponse.json({ message: "Não foi possível exportar os relatórios agora." }, { status: 500 });
  }
}
