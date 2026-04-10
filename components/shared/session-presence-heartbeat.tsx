"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000;
const ACTIVITY_THROTTLE_MS = 25_000;

function buildPayload(reason: string, pathname: string) {
  return JSON.stringify({ reason, pathname, sentAt: new Date().toISOString() });
}

export function SessionPresenceHeartbeat() {
  const pathname = usePathname();
  const lastSentAtRef = useRef(0);
  const inflightRef = useRef(false);
  const pathnameRef = useRef(pathname);

  pathnameRef.current = pathname;

  const sendHeartbeat = async (reason: string, force = false, useBeacon = false) => {
    const now = Date.now();
    if (!force && now - lastSentAtRef.current < ACTIVITY_THROTTLE_MS) return;
    if (inflightRef.current && !useBeacon) return;

    lastSentAtRef.current = now;
    const payload = buildPayload(reason, pathnameRef.current);

    if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/presence/heartbeat", new Blob([payload], { type: "application/json" }));
      return;
    }

    inflightRef.current = true;
    try {
      await fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        cache: "no-store",
        keepalive: true
      });
    } catch {
      // silent heartbeat failure; next interval retries automatically
    } finally {
      inflightRef.current = false;
    }
  };

  useEffect(() => {
    void sendHeartbeat("mount", true);
    const interval = window.setInterval(() => {
      void sendHeartbeat("interval", true);
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat("visible", true);
      } else {
        void sendHeartbeat("hidden", false, true);
      }
    };

    const handleFocus = () => {
      void sendHeartbeat("focus", true);
    };

    const handleActivity = () => {
      void sendHeartbeat("activity");
    };

    const handlePageHide = () => {
      void sendHeartbeat("pagehide", false, true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("pagehide", handlePageHide);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void sendHeartbeat("route", true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
