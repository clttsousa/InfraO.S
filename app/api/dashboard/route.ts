import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";
import { requireApiSession } from "@/lib/session";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[infraos] dashboard api error", error);
    return NextResponse.json({ message: "Não foi possível carregar o dashboard no momento." }, { status: 500 });
  }
}
