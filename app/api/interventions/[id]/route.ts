import { NextResponse } from "next/server";
import { getInterventionDetail } from "@/lib/data";
import { requireApiSession } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const { id } = await context.params;
  const intervention = await getInterventionDetail(id);
  return NextResponse.json({ intervention });
}
