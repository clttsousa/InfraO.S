"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer";
import { OrderDetailPanel } from "@/components/orders/order-detail-panel";
import { OrderDetailSkeleton } from "@/components/orders/order-detail-skeleton";
import { OrderInteractiveList } from "@/components/orders/order-interactive-list";
import { EmptyState } from "@/components/shared/ui";
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
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialSelectedId));
  const [action, setAction] = useState<string | undefined>(initialAction);
  const [detail, setDetail] = useState<ServiceOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialSelectedId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const detailCacheRef = useRef<Map<string, ServiceOrderDetail>>(new Map());
  const currentRequestId = useRef<string | null>(null);

  const baseHref = useMemo(() => buildOrdersHref(baseQueryString, selectedId), [baseQueryString, selectedId]);

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

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
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
    if (!initialSelectedId) return;
    void loadDetail(initialSelectedId);
  }, [initialSelectedId, loadDetail]);

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
      <OrderInteractiveList
        items={items}
        selectedId={selectedId}
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
            baseHref={baseHref}
            success={success}
            error={error}
          />
        ) : null}
      </OrderDetailDrawer>
    </>
  );
}
