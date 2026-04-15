"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { AlertTriangle, ChevronsDownUp, ChevronsUpDown, History } from "lucide-react";
import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer";
import { OrderDetailPanel } from "@/components/orders/order-detail-panel";
import { OrderDetailSkeleton } from "@/components/orders/order-detail-skeleton";
import { OrderInteractiveList } from "@/components/orders/order-interactive-list";
import { Button, EmptyState } from "@/components/shared/ui";
import type { InternalUserItem, ServiceOrderDetail, ServiceOrderItem, TechnicianItem } from "@/types";

type HistoryMode = "push" | "replace";

type OrderWorkspaceClientProps = {
  baseQueryString: string;
  items: ServiceOrderItem[];
  technicians: TechnicianItem[];
  internalUsers: InternalUserItem[];
  initialSelectedId?: string;
  initialAction?: string;
  success?: string;
  error?: string;
};

function buildOrdersHref(baseQueryString: string, selectedId?: string, action?: string) {
  const params = new URLSearchParams(baseQueryString);
  if (selectedId) params.set("selected", selectedId);
  else params.delete("selected");

  if (action) params.set("action", action);
  else params.delete("action");

  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

function readStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return {
    selectedId: params.get("selected") ?? undefined,
    action: params.get("action") ?? undefined,
  };
}

export function OrderWorkspaceClient({
  baseQueryString,
  items,
  technicians,
  internalUsers,
  initialSelectedId,
  initialAction,
  success,
  error,
}: OrderWorkspaceClientProps) {
  const { subscribe } = useRealtime();
  const [orders, setOrders] = useState<ServiceOrderItem[]>(items);
  const [pulseOrderId, setPulseOrderId] = useState<string | undefined>(undefined);
  const refreshTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialSelectedId));
  const [action, setAction] = useState<string | undefined>(initialAction);
  const [detail, setDetail] = useState<ServiceOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialSelectedId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const detailCacheRef = useRef<Map<string, ServiceOrderDetail>>(new Map());
  const currentRequestId = useRef<string | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  const baseHref = useMemo(() => buildOrdersHref(baseQueryString, selectedId), [baseQueryString, selectedId]);
  const selectedIndex = useMemo(() => orders.findIndex((item) => item.id === selectedId), [orders, selectedId]);
  const nextOrderId = selectedIndex >= 0 ? orders[selectedIndex + 1]?.id : orders[0]?.id;
  const prevOrderId = selectedIndex > 0 ? orders[selectedIndex - 1]?.id : undefined;
  const recentOrders = useMemo(() => recentOrderIds.map((id) => orders.find((item) => item.id === id)).filter(Boolean) as ServiceOrderItem[], [orders, recentOrderIds]);

  const refreshList = useCallback(async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      const response = await fetch(`/api/orders${baseQueryString ? `?${baseQueryString}` : ""}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Falha ao atualizar a fila de ordens.");
      const payload = (await response.json()) as { items: ServiceOrderItem[] };
      setOrders(payload.items ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Falha transitória ignorada; próximo evento ou interação tenta novamente.
    }
  }, [baseQueryString]);

  const refreshDetail = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao atualizar detalhes da O.S.");
      const payload = (await response.json()) as { order: ServiceOrderDetail | null };
      if (payload.order) {
        detailCacheRef.current.set(orderId, payload.order);
        setDetail(payload.order);
        setLoadError(null);
      }
    } catch {
      // Mantém o detalhe atual se a atualização incremental falhar.
    }
  }, []);

  const syncUrl = useCallback(
    (nextSelectedId?: string, nextAction?: string, mode: HistoryMode = "replace") => {
      const href = buildOrdersHref(baseQueryString, nextSelectedId, nextAction);
      window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", href);
    },
    [baseQueryString],
  );

  const loadDetail = useCallback(async (orderId: string) => {
    currentRequestId.current = orderId;
    const cached = detailCacheRef.current.get(orderId);

    if (cached) {
      setDetail(cached);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    setDetail(null);
    setIsLoading(true);
    setLoadError(null);
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os detalhes da O.S.");
      }

      const payload = (await response.json()) as { order: ServiceOrderDetail | null };

      if (currentRequestId.current !== orderId) return;

      if (payload.order) {
        detailCacheRef.current.set(orderId, payload.order);
        setDetail(payload.order);
      } else {
        setDetail(null);
        setLoadError("A ordem selecionada não foi encontrada.");
      }
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      if (currentRequestId.current !== orderId) return;
      setDetail(null);
      setLoadError(fetchError instanceof Error ? fetchError.message : "Não foi possível carregar os detalhes da O.S.");
    } finally {
      if (currentRequestId.current === orderId) {
        setIsLoading(false);
      }
    }
  }, []);

  const openOrder = useCallback(
    (orderId: string) => {
      setSelectedId(orderId);
      setAction(undefined);
      setDrawerOpen(true);
      setLoadError(null);
      setRecentOrderIds((current) => {
        const next = [orderId, ...current.filter((id) => id !== orderId)].slice(0, 6);
        window.localStorage.setItem("infraos:orders:recent", JSON.stringify(next));
        return next;
      });
      syncUrl(orderId, undefined, "push");
      void loadDetail(orderId);
    },
    [loadDetail, syncUrl],
  );

  const closeOrder = useCallback(() => {
    currentRequestId.current = null;
    setDrawerOpen(false);
    setAction(undefined);
    setSelectedId(undefined);
    setIsLoading(false);
    setLoadError(null);
    syncUrl(undefined, undefined, "replace");
  }, [syncUrl]);

  const handleActionChange = useCallback(
    (nextAction?: string) => {
      setAction(nextAction);
      syncUrl(selectedId, nextAction, "replace");
    },
    [selectedId, syncUrl],
  );

  useEffect(() => {
    setOrders(items);
  }, [items]);

  useEffect(() => {
    if (window.localStorage.getItem("infraos:orders:compact") === "1") {
      setCompactMode(true);
    }

    try {
      const recentStored = window.localStorage.getItem("infraos:orders:recent");
      if (!recentStored) return;
      const parsed = JSON.parse(recentStored);
      if (!Array.isArray(parsed)) return;
      setRecentOrderIds(parsed.filter((item) => typeof item === "string").slice(0, 6));
    } catch {
      // Ignora estado inválido no storage local.
    }
  }, []);

  useEffect(() => {
    if (!initialSelectedId) return;
    void loadDetail(initialSelectedId);
  }, [initialSelectedId, loadDetail]);

  useEffect(() => {
    return subscribe((event) => {
      if (!["order.created", "order.updated", "order.status_changed", "order.deadline_changed", "order.assigned_changed"].includes(event.type)) {
        return;
      }

      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void refreshList();
      }, 180);

      if (event.entityId) {
        setPulseOrderId(event.entityId);
        if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setPulseOrderId(undefined), 2200);
      }

      if (event.entityId && event.entityId === selectedId) {
        void refreshDetail(event.entityId);
      }
    });
  }, [refreshDetail, refreshList, selectedId, subscribe]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
      listAbortRef.current?.abort();
      detailAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag && ["input", "textarea", "select", "button"].includes(tag)) return;
      if (!event.altKey) return;

      if (event.key === "ArrowDown" && nextOrderId) {
        event.preventDefault();
        openOrder(nextOrderId);
      }

      if (event.key === "ArrowUp" && prevOrderId) {
        event.preventDefault();
        openOrder(prevOrderId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextOrderId, openOrder, prevOrderId]);

  useEffect(() => {
    const handlePopState = () => {
      const { selectedId: locationSelectedId, action: locationAction } = readStateFromLocation();
      setSelectedId(locationSelectedId);
      setAction(locationAction);
      setDrawerOpen(Boolean(locationSelectedId));
      setLoadError(null);

      if (locationSelectedId) {
        const cached = detailCacheRef.current.get(locationSelectedId);
        if (cached) {
          setDetail(cached);
          setIsLoading(false);
        } else {
          void loadDetail(locationSelectedId);
        }
      } else {
        currentRequestId.current = null;
        setDetail(null);
        setIsLoading(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadDetail]);

  return (
    <>
      <div className="mb-3 space-y-3">
        <div className="app-surface-muted flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <History className="h-3.5 w-3.5" />
            <span>Navegação rápida: use <strong>Alt + ↑</strong> e <strong>Alt + ↓</strong>.</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setCompactMode((current) => {
                const next = !current;
                window.localStorage.setItem("infraos:orders:compact", next ? "1" : "0");
                return next;
              });
            }}
          >
            {compactMode ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
            {compactMode ? "Modo detalhado" : "Modo compacto"}
          </Button>
        </div>

        {recentOrders.length ? (
          <div className="app-surface-muted rounded-[var(--radius-control)] px-3 py-2">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Recentes</div>
            <div className="flex flex-wrap gap-1.5">
              {recentOrders.map((order) => (
                <button key={order.id} type="button" className={`filter-chip filter-chip-sm ${selectedId === order.id ? "filter-chip-active" : ""}`} onClick={() => openOrder(order.id)}>
                  {order.number}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <OrderInteractiveList
        items={orders}
        selectedId={selectedId}
        pulseOrderId={pulseOrderId}
        compactMode={compactMode}
        onSelect={openOrder}
      />

      <OrderDetailDrawer isOpen={drawerOpen} isActionOpen={Boolean(action)} onClose={closeOrder}>
        {isLoading ? <OrderDetailSkeleton /> : null}
        {!isLoading && loadError ? (
          <div className="p-6">
            <EmptyState
              compact
              title="Não foi possível abrir a O.S."
              description={loadError}
              action={<button type="button" className="btn-base btn-secondary btn-sm" onClick={() => selectedId ? void loadDetail(selectedId) : undefined}><AlertTriangle className="h-4 w-4" />Tentar novamente</button>}
            />
          </div>
        ) : null}
        {!isLoading && !loadError ? (
          <OrderDetailPanel
            order={detail}
            technicians={technicians}
            internalUsers={internalUsers}
            action={action}
            onActionChange={handleActionChange}
            onOpenNextOrder={nextOrderId ? () => openOrder(nextOrderId) : undefined}
            hasNextOrder={Boolean(nextOrderId && nextOrderId !== selectedId)}
            baseHref={baseHref}
            success={success}
            error={error}
          />
        ) : null}
      </OrderDetailDrawer>
    </>
  );
}
