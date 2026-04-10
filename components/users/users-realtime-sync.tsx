"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { useRealtime } from "@/components/realtime/realtime-provider";

export function UsersRealtimeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, subscribe } = useRealtime();
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    return subscribe((event) => {
      if (pathname !== "/users") return;
      if (!["user.presence_changed", "user.updated"].includes(event.type)) return;
      const now = Date.now();
      if (now - lastRefreshAtRef.current < 2500) return;
      lastRefreshAtRef.current = now;
      router.refresh();
    });
  }, [pathname, router, subscribe]);

  return <div className={`badge-base ${isConnected ? "badge-success" : "badge-neutral"}`}><Radio className="h-3.5 w-3.5" />{isConnected ? "Presença ao vivo" : "Reconectando"}</div>;
}
