"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { RealtimeEvent } from "@/lib/realtime";

type RealtimeStatus = "connecting" | "connected" | "error";
type RealtimeListener = (event: RealtimeEvent) => void;

type RealtimeContextValue = {
  status: RealtimeStatus;
  isConnected: boolean;
  lastEventAt?: string;
  subscribe: (listener: RealtimeListener) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Set<RealtimeListener>());
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [lastEventAt, setLastEventAt] = useState<string | undefined>(undefined);

  const subscribe = useCallback((listener: RealtimeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cleanupSource = () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isMounted || reconnectTimeoutRef.current !== null) return;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 2500);
    };

    const connect = () => {
      cleanupSource();
      setStatus("connecting");
      const source = new EventSource("/api/realtime/stream");
      sourceRef.current = source;

      source.onopen = () => {
        if (!isMounted) return;
        setStatus("connected");
      };

      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as RealtimeEvent;
          setLastEventAt(event.timestamp ?? new Date().toISOString());
          listenersRef.current.forEach((listener) => listener(event));
          if (event.type === "system.connected") {
            setStatus("connected");
          }
        } catch (error) {
          console.error("[infraos] realtime parse error", error);
        }
      };

      source.onerror = () => {
        if (!isMounted) return;
        setStatus("error");
        cleanupSource();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      isMounted = false;
      cleanupSource();
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  const value = useMemo<RealtimeContextValue>(() => ({ status, isConnected: status === "connected", lastEventAt, subscribe }), [lastEventAt, status, subscribe]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
}
