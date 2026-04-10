import { randomUUID } from "node:crypto";

export type RealtimeEventType =
  | "system.connected"
  | "system.keepalive"
  | "order.created"
  | "order.updated"
  | "order.status_changed"
  | "order.deadline_changed"
  | "order.assigned_changed"
  | "notification.created"
  | "user.presence_changed"
  | "user.updated";

export type RealtimeEvent = {
  id: string;
  type: RealtimeEventType;
  scope: "orders" | "dashboard" | "notifications" | "users" | "system";
  entityId?: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

type Listener = (event: RealtimeEvent) => void;

type RealtimeHub = {
  listeners: Set<Listener>;
};

declare global {
  // eslint-disable-next-line no-var
  var __infraosRealtimeHub: RealtimeHub | undefined;
}

function getHub(): RealtimeHub {
  if (!globalThis.__infraosRealtimeHub) {
    globalThis.__infraosRealtimeHub = { listeners: new Set<Listener>() };
  }
  return globalThis.__infraosRealtimeHub;
}

export function subscribeRealtime(listener: Listener) {
  const hub = getHub();
  hub.listeners.add(listener);
  return () => hub.listeners.delete(listener);
}

export function publishRealtimeEvent(input: Omit<RealtimeEvent, "id" | "timestamp"> & Partial<Pick<RealtimeEvent, "id" | "timestamp">>) {
  const event: RealtimeEvent = {
    id: input.id ?? randomUUID(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    type: input.type,
    scope: input.scope,
    entityId: input.entityId,
    payload: input.payload,
  };

  for (const listener of getHub().listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error("[infraos] realtime listener error", error);
    }
  }

  return event;
}

export function createRealtimeSseMessage(event: RealtimeEvent) {
  return `id: ${event.id}
data: ${JSON.stringify(event)}

`;
}
