"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { InterventionDetailDrawer } from "@/components/interventions/intervention-detail-drawer";
import { InterventionDetailPanel } from "@/components/interventions/intervention-detail-panel";
import { InterventionDetailSkeleton } from "@/components/interventions/intervention-detail-skeleton";
import { InterventionForm } from "@/components/interventions/intervention-form";
import { InterventionList } from "@/components/interventions/intervention-list";
import { OrderActionOverlay } from "@/components/orders/order-action-overlay";
import { useRealtime } from "@/components/realtime/realtime-provider";
import { Button, EmptyState } from "@/components/shared/ui";
import type { InternalUserItem, InterventionDetail, InterventionItem } from "@/types";

type HistoryMode = "push" | "replace";

type Props = {
  baseQueryString: string;
  items: InterventionItem[];
  internalUsers: InternalUserItem[];
  initialSelectedId?: string;
  initialAction?: string;
  success?: string;
  error?: string;
};

function buildHref(baseQueryString: string, selectedId?: string, action?: string) {
  const params = new URLSearchParams(baseQueryString);
  if (selectedId) params.set("selected", selectedId);
  else params.delete("selected");

  if (action) params.set("action", action);
  else params.delete("action");

  const query = params.toString();
  return query ? `/intervencoes?${query}` : "/intervencoes";
}

function readStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return {
    selectedId: params.get("selected") ?? undefined,
    action: params.get("action") ?? undefined
  };
}

export function InterventionWorkspaceClient({ baseQueryString, items, internalUsers, initialSelectedId, initialAction, success, error }: Props) {
  const { subscribe } = useRealtime();
  const [interventions, setInterventions] = useState(items);
  const [pulseId, setPulseId] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(initialSelectedId));
  const [action, setAction] = useState<string | undefined>(initialAction);
  const [detail, setDetail] = useState<InterventionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialSelectedId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const detailCacheRef = useRef<Map<string, InterventionDetail>>(new Map());
  const currentRequestId = useRef<string | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const baseHref = useMemo(() => buildHref(baseQueryString, selectedId), [baseQueryString, selectedId]);
  const isNewActionOpen = action === "new";

  const syncUrl = useCallback((nextSelectedId?: string, nextAction?: string, mode: HistoryMode = "replace") => {
    const href = buildHref(baseQueryString, nextSelectedId, nextAction);
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", href);
  }, [baseQueryString]);

  const refreshList = useCallback(async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      const response = await fetch(`/api/interventions${baseQueryString ? `?${baseQueryString}` : ""}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Falha ao atualizar intervenções.");
      const payload = (await response.json()) as { items: InterventionItem[] };
      setInterventions(payload.items ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }, [baseQueryString]);

  const refreshDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/interventions/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao atualizar detalhe.");
      const payload = (await response.json()) as { intervention: InterventionDetail | null };
      if (payload.intervention) {
        detailCacheRef.current.set(id, payload.intervention);
        setDetail(payload.intervention);
        setLoadError(null);
      }
    } catch {
      // Mantém o detalhe atual em falhas transitórias.
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    currentRequestId.current = id;
    const cached = detailCacheRef.current.get(id);
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
      const response = await fetch(`/api/interventions/${id}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Não foi possível carregar a intervenção.");
      const payload = (await response.json()) as { intervention: InterventionDetail | null };
      if (currentRequestId.current !== id) return;

      if (payload.intervention) {
        detailCacheRef.current.set(id, payload.intervention);
        setDetail(payload.intervention);
      } else {
        setDetail(null);
        setLoadError("Intervenção não encontrada.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (currentRequestId.current !== id) return;
      setDetail(null);
      setLoadError(err instanceof Error ? err.message : "Não foi possível carregar a intervenção.");
    } finally {
      if (currentRequestId.current === id) setIsLoading(false);
    }
  }, []);

  const openIntervention = useCallback((id: string) => {
    setSelectedId(id);
    setAction(undefined);
    setDrawerOpen(true);
    setLoadError(null);
    syncUrl(id, undefined, "push");
    void loadDetail(id);
  }, [loadDetail, syncUrl]);

  const closeDrawer = useCallback(() => {
    currentRequestId.current = null;
    setDrawerOpen(false);
    setAction(undefined);
    setSelectedId(undefined);
    setIsLoading(false);
    setLoadError(null);
    syncUrl(undefined, undefined, "replace");
  }, [syncUrl]);

  const openNew = useCallback(() => {
    setAction("new");
    syncUrl(selectedId, "new", "push");
  }, [selectedId, syncUrl]);

  const closeNew = useCallback(() => {
    setAction(undefined);
    syncUrl(selectedId, undefined, "replace");
  }, [selectedId, syncUrl]);

  const handleActionChange = useCallback((nextAction?: string) => {
    setAction(nextAction);
    syncUrl(selectedId, nextAction, "replace");
  }, [selectedId, syncUrl]);

  useEffect(() => setInterventions(items), [items]);

  useEffect(() => {
    if (initialSelectedId) void loadDetail(initialSelectedId);
  }, [initialSelectedId, loadDetail]);

  useEffect(() => {
    return subscribe((event) => {
      if (!["intervention.created", "intervention.updated", "intervention.status_changed"].includes(event.type)) return;

      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        void refreshList();
      }, 180);

      if (event.entityId) {
        setPulseId(event.entityId);
        if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setPulseId(undefined), 2200);
      }

      if (event.entityId && event.entityId === selectedId) {
        detailCacheRef.current.delete(event.entityId);
        void refreshDetail(event.entityId);
      }
    });
  }, [refreshDetail, refreshList, selectedId, subscribe]);

  useEffect(() => {
    const handlePopState = () => {
      const { selectedId: nextSelectedId, action: nextAction } = readStateFromLocation();
      setSelectedId(nextSelectedId);
      setAction(nextAction);
      setDrawerOpen(Boolean(nextSelectedId));
      setLoadError(null);

      if (nextSelectedId) {
        const cached = detailCacheRef.current.get(nextSelectedId);
        if (cached) {
          setDetail(cached);
          setIsLoading(false);
        } else {
          void loadDetail(nextSelectedId);
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

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current);
      listAbortRef.current?.abort();
      detailAbortRef.current?.abort();
    };
  }, []);

  return (
    <>
      <div className="intervention-action-row flex justify-end">
        <Button type="button" onClick={openNew} className="intervention-new-button"><Plus className="h-4 w-4" /><span>Nova</span><span className="hidden sm:inline"> intervenção</span></Button>
      </div>
      <InterventionList items={interventions} selectedId={selectedId} pulseId={pulseId} onSelect={openIntervention} />

      <InterventionDetailDrawer isOpen={drawerOpen} isActionOpen={Boolean(action && action !== "new")} onClose={closeDrawer}>
        {isLoading ? <InterventionDetailSkeleton /> : null}
        {!isLoading && loadError ? (
          <div className="p-6">
            <EmptyState compact title="Não foi possível abrir a intervenção" description={loadError} action={<Button type="button" variant="secondary" onClick={() => selectedId ? void loadDetail(selectedId) : undefined}><AlertTriangle className="h-4 w-4" />Tentar novamente</Button>} />
          </div>
        ) : null}
        {!isLoading && !loadError ? (
          <InterventionDetailPanel intervention={detail} internalUsers={internalUsers} action={action} onActionChange={handleActionChange} baseHref={baseHref} success={success} error={error} />
        ) : null}
      </InterventionDetailDrawer>

      <OrderActionOverlay isOpen={isNewActionOpen} closeHref={baseHref} onClose={closeNew}>
        <div className="app-panel animate-scaleIn new-intervention-modal relative z-[73] w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[var(--radius-modal)] p-5 shadow-[var(--shadow-lg)]">
          <div className="sticky top-0 z-10 -mx-5 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-5 pb-4 pt-1">
            <div>
              <p className="app-eyebrow text-xs font-medium">Cadastro operacional</p>
              <h3 className="app-title mt-1 text-xl font-semibold">Nova intervenção programada</h3>
            </div>
            <Button type="button" variant="ghost" size="sm" className="px-2.5 py-2" onClick={closeNew}><X className="h-4 w-4" /></Button>
          </div>
          <div className="mt-5"><InterventionForm mode="create" internalUsers={internalUsers} closeHref={`${baseHref}${baseHref.includes("?") ? "&" : "?"}action=new`} /></div>
        </div>
      </OrderActionOverlay>
    </>
  );
}
