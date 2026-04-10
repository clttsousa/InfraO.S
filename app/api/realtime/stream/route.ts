import { NextResponse } from "next/server";
import { createRealtimeSseMessage, subscribeRealtime, type RealtimeEvent } from "@/lib/realtime";
import { requireApiSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      const sendEvent = (event: RealtimeEvent) => send(createRealtimeSseMessage(event));

      sendEvent({ id: `connected-${session.id}-${Date.now()}`, type: "system.connected", scope: "system", timestamp: new Date().toISOString(), payload: { userId: session.id } });
      unsubscribe = subscribeRealtime((event) => send(createRealtimeSseMessage(event)));
      keepaliveTimer = setInterval(() => {
        send(`: keepalive ${Date.now()}\n\n`);
      }, 15000);

      request.signal.addEventListener("abort", () => {
        unsubscribe?.();
        if (keepaliveTimer) clearInterval(keepaliveTimer);
        controller.close();
      });
    },
    cancel() {
      unsubscribe?.();
      if (keepaliveTimer) clearInterval(keepaliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
