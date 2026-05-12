"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "@/components/providers/notification-provider";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { Bell, CheckCircle2, Clock3, TriangleAlert, Activity } from "lucide-react";
import { cn } from "@/components/shared/utils";
import type { NotificationItem, NotificationSummary } from "@/types";

const STORAGE_KEY = "infraos:notification-ack:v1";
const REFRESH_INTERVAL_MS = 20_000;

function getNotificationMeta(item: NotificationItem) {
  switch (item.level) {
    case "danger":
      return { icon: TriangleAlert, chip: "badge-danger", wrapper: "notification-item-danger" };
    case "warning":
      return { icon: Clock3, chip: "badge-warning", wrapper: "notification-item-warning" };
    case "success":
      return { icon: CheckCircle2, chip: "badge-success", wrapper: "notification-item-success" };
    default:
      return { icon: Activity, chip: "badge-primary", wrapper: "notification-item-info" };
  }
}

function readAcknowledgedIds() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function persistAcknowledgedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-250)));
}

async function markNotificationRead(id: string) {
  await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

async function markAllNotificationsRead() {
  await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true })
  });
}

async function fetchNotificationSummary() {
  const response = await fetch('/api/notifications/summary', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Não foi possível atualizar as notificações.');
  }
  return response.json() as Promise<NotificationSummary>;
}

export function NotificationBell({ summary }: { summary: NotificationSummary }) {
  const { info } = useNotifications();
  const { isConnected, subscribe } = useRealtime();
  const [open, setOpen] = useState(false);
  const [summaryState, setSummaryState] = useState(summary);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSummaryState(summary);
  }, [summary]);

  const refreshSummary = useCallback(async () => {
    try {
      const nextSummary = await fetchNotificationSummary();
      setSummaryState(nextSummary);
    } catch {
      // Ignora falhas transitórias para não poluir a UI.
    }
  }, []);

  useEffect(() => {
    setAcknowledgedIds(readAcknowledgedIds());
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshSummary();
    }, REFRESH_INTERVAL_MS);
    const handleFocus = () => {
      void refreshSummary();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshSummary]);

  useEffect(() => {
    return subscribe((event) => {
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed", "notification.created"].includes(event.type)) return;
      if (event.type === "notification.created" && typeof event.payload?.title === "string") {
        info(event.payload.title, { title: "Novo lembrete", duration: 5200 });
      }
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void refreshSummary();
      }, 160);
    });
  }, [info, refreshSummary, subscribe]);

  const acknowledgedSet = useMemo(() => new Set(acknowledgedIds), [acknowledgedIds]);

  const activeAlertIds = useMemo(
    () => [
      ...summaryState.activeAlertIds.late,
      ...summaryState.activeAlertIds.dueToday,
      ...summaryState.activeAlertIds.stale,
      ...summaryState.activeAlertIds.intervention
    ],
    [summaryState]
  );

  useEffect(() => {
    if (!activeAlertIds.length) {
      if (acknowledgedIds.length) {
        setAcknowledgedIds([]);
        persistAcknowledgedIds([]);
      }
      return;
    }

    const activeSet = new Set(activeAlertIds);
    const pruned = acknowledgedIds.filter((id) => activeSet.has(id));
    if (pruned.length !== acknowledgedIds.length) {
      setAcknowledgedIds(pruned);
      persistAcknowledgedIds(pruned);
    }
  }, [acknowledgedIds, activeAlertIds]);

  const visibleSummary = useMemo(() => {
    const late = summaryState.activeAlertIds.late.filter((id) => !acknowledgedSet.has(id)).length;
    const dueToday = summaryState.activeAlertIds.dueToday.filter((id) => !acknowledgedSet.has(id)).length;
    const stale = summaryState.activeAlertIds.stale.filter((id) => !acknowledgedSet.has(id)).length;
    const interventions = summaryState.activeAlertIds.intervention.filter((id) => !acknowledgedSet.has(id)).length;

    return {
      total: late + dueToday + stale + interventions,
      counts: {
        late,
        dueToday,
        stale,
        interventions,
        recentActivities: summaryState.counts.recentActivities
      },
      items: summaryState.items.filter((item) => item.category === 'activity' || !acknowledgedSet.has(item.id))
    };
  }, [acknowledgedSet, summaryState]);

  const visibleCount = Math.min(visibleSummary.total, 99);
  const headline = useMemo(() => {
    if (visibleSummary.total === 0) return "Nenhum alerta operacional agora";
    if (visibleSummary.total === 1) return "1 alerta operacional exige atenção";
    return `${visibleSummary.total} alertas operacionais exigem atenção`;
  }, [visibleSummary.total]);

  function acknowledge(item: NotificationItem) {
    if (item.category === 'activity') return;
    if (item.category === 'intervention') {
      void markNotificationRead(item.id).then(refreshSummary).catch(() => undefined);
    }
    setAcknowledgedIds((current) => {
      if (current.includes(item.id)) return current;
      const next = [...current, item.id].slice(-250);
      persistAcknowledgedIds(next);
      return next;
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn-base btn-secondary btn-md relative"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir central de notificações"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">Notificações</span>
        <span className={`hidden md:inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${isConnected ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}`}>{isConnected ? "ao vivo" : "sync"}</span>
        {visibleSummary.total > 0 ? <span className="notification-counter">{visibleCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-popover animate-scaleIn app-panel absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[min(92vw,420px)] p-0 shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--border)] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="app-title text-base font-semibold">Central de notificações</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{headline}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Link href="/notifications" className="app-link text-sm font-medium" onClick={() => setOpen(false)}>
                  Abrir painel
                </Link>
                {visibleSummary.total > 0 ? (
                  <button
                    type="button"
                    className="app-link text-xs font-medium"
                    onClick={() => {
                      setAcknowledgedIds(activeAlertIds);
                      persistAcknowledgedIds(activeAlertIds);
                      void markAllNotificationsRead().then(refreshSummary).catch(() => undefined);
                    }}
                  >
                    Marcar todas como lidas
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
              <span className="badge-base badge-danger">{visibleSummary.counts.late} atrasadas</span>
              <span className="badge-base badge-warning">{visibleSummary.counts.dueToday} vencem hoje</span>
              <span className="badge-base badge-primary">{visibleSummary.counts.stale} sem atualização</span>
              <span className="badge-base badge-success">{visibleSummary.counts.interventions} intervenções</span>
            </div>
          </div>

          <div className="app-scrollbar max-h-[420px] overflow-auto p-3">
            {visibleSummary.items.length === 0 ? (
              <div className="empty-state-box px-5 py-8 text-center">
                <p className="app-title text-sm font-semibold">Tudo sob controle</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Quando surgirem novos alertas ou movimentações, eles vão aparecer aqui.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleSummary.items.map((item) => {
                  const meta = getNotificationMeta(item);
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn("notification-item group block rounded-[var(--radius-panel)] border px-3 py-3", meta.wrapper)}
                      onClick={() => {
                        acknowledge(item);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("badge-base mt-0.5", meta.chip)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">{item.title}</div>
                          <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</div>
                          {item.when ? <div className="mt-1 text-xs text-[var(--text-tertiary)]">{item.when}</div> : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
