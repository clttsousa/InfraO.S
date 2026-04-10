import { NextResponse } from "next/server";
import { getServiceOrderDetail } from "@/lib/data";
import { requireSession } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await context.params;
    const order = await getServiceOrderDetail(id);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar a ordem." },
      { status: 500 },
    );
  }
}
