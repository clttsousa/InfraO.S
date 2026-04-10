import type { PresenceStatus } from "@/types";

export const PRESENCE_ONLINE_WINDOW_MINUTES = 2;
export const PRESENCE_AWAY_WINDOW_MINUTES = 15;

export const presenceLabelByStatus: Record<PresenceStatus, string> = {
  ONLINE: "Online",
  AUSENTE: "Ausente",
  OFFLINE: "Offline"
};

export function getPresenceStatus(lastSeenAt: string | null | undefined, isActive = true): PresenceStatus {
  if (!isActive || !lastSeenAt) return "OFFLINE";

  const lastSeen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(lastSeen)) return "OFFLINE";

  const diffMs = Date.now() - lastSeen;
  if (diffMs <= PRESENCE_ONLINE_WINDOW_MINUTES * 60 * 1000) return "ONLINE";
  if (diffMs <= PRESENCE_AWAY_WINDOW_MINUTES * 60 * 1000) return "AUSENTE";
  return "OFFLINE";
}

export function getPresenceLabel(status: PresenceStatus) {
  return presenceLabelByStatus[status] ?? "Offline";
}
