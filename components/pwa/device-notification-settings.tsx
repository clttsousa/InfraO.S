"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, BellOff, CheckCircle2, Loader2, Smartphone, TriangleAlert, Activity, Radio, ShieldCheck, MonitorSmartphone, Trash2 } from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";

export type PermissionStateLabel = "not-requested" | "granted" | "denied" | "unsupported";

type DeliveryLog = {
  channel: string;
  status: "sent" | "failed" | "skipped" | string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

type PushDevice = {
  id: string;
  endpoint: string;
  userAgent: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
};

type PushStatus = {
  configured: boolean;
  total: number;
  active: number;
  currentDeviceActive: boolean;
  currentDeviceKnown: boolean;
  lastUsedAt: string | null;
  lastDelivery: DeliveryLog | null;
  devices: PushDevice[];
};

type PushTestResponse = {
  ok?: boolean;
  message?: string;
  sent?: number;
  failed?: number;
  skipped?: number;
  details?: Array<{ status: string; message: string; httpStatus?: number }>;
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function arrayBufferEquals(a: ArrayBuffer | null | undefined, b: Uint8Array) {
  if (!a) return false;
  const first = new Uint8Array(a);
  if (first.length !== b.length) return false;
  return first.every((value, index) => value === b[index]);
}

export function getBrowserPermission(): PermissionStateLabel {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "not-requested";
}

function permissionText(permission: PermissionStateLabel, active: boolean, known: boolean) {
  if (permission === "unsupported") return "Indisponível neste navegador";
  if (permission === "denied") return "Bloqueado pelo navegador";
  if (permission === "granted" && active) return "Ativo neste dispositivo";
  if (permission === "granted" && known) return "Inativo neste dispositivo";
  if (permission === "granted") return "Permitido, mas não ativado";
  return "Não solicitado";
}

function deliveryText(delivery: DeliveryLog | null) {
  if (!delivery) return "Nenhum envio PWA registrado ainda.";
  const date = new Date(delivery.created_at).toLocaleString("pt-BR");
  if (delivery.status === "sent") return `Último push aceito pelo serviço em ${date}.`;
  if (delivery.status === "failed") return `Último push falhou em ${date}: ${delivery.error_message ?? "sem detalhe"}`;
  return `Último push ignorado em ${date}: ${delivery.error_message ?? "sem detalhe"}`;
}

export async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker indisponível neste navegador.");
  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  await registration.update().catch(() => undefined);
  return navigator.serviceWorker.ready;
}

async function getCurrentEndpoint() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
}

async function fetchStatus(endpoint?: string | null) {
  const suffix = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : "";
  const response = await fetch(`/api/push/status${suffix}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível ler o status das notificações.");
  return response.json() as Promise<PushStatus>;
}

function summarizePushResult(body: PushTestResponse) {
  const sent = Number(body.sent ?? 0);
  const failed = Number(body.failed ?? 0);
  const skipped = Number(body.skipped ?? 0);
  const details = body.details?.map((detail) => detail.message).filter(Boolean).slice(0, 2).join(" | ");
  return { sent, failed, skipped, details };
}

function summarizeUserAgent(userAgent: string | null) {
  if (!userAgent) return "Dispositivo sem identificação";
  const browser = userAgent.includes("Edg/") ? "Edge" : userAgent.includes("Chrome/") ? "Chrome" : userAgent.includes("Safari/") ? "Safari" : userAgent.includes("Firefox/") ? "Firefox" : "Navegador";
  const system = userAgent.includes("Android") ? "Android" : userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS" : userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "macOS" : "Dispositivo";
  return `${browser} · ${system}`;
}

function formatShortDate(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function DeviceNotificationSettings({ compact = false }: { compact?: boolean }) {
  const { success, error, info } = useNotifications();
  const [permission, setPermission] = useState<PermissionStateLabel>("unsupported");
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPermission(getBrowserPermission());
    try {
      const endpoint = await getCurrentEndpoint();
      setCurrentEndpoint(endpoint);
      const nextStatus = await fetchStatus(endpoint);
      setStatus(nextStatus);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const active = Boolean(status?.currentDeviceActive && permission === "granted");
  const stateLabel = permissionText(permission, active, Boolean(status?.currentDeviceKnown));

  const tone = useMemo(() => {
    if (active) return "badge-success";
    if (permission === "denied" || permission === "unsupported" || status?.configured === false) return "badge-danger";
    return "badge-warning";
  }, [active, permission, status?.configured]);

  async function activate() {
    setLoading(true);
    setLastResult(null);
    try {
      if (!status?.configured || !publicKey) {
        throw new Error("As chaves VAPID ainda não foram configuradas no ambiente.");
      }
      if (permission === "unsupported") {
        throw new Error("Este navegador não suporta Push Notification/PWA.");
      }
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Notificações exigem HTTPS em produção.");
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(getBrowserPermission());
      if (nextPermission !== "granted") {
        throw new Error("Permissão de notificação não foi concedida.");
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const registration = await getServiceWorkerRegistration();
      let subscription = await registration.pushManager.getSubscription();

      if (subscription && !arrayBufferEquals(subscription.options.applicationServerKey, applicationServerKey)) {
        const oldEndpoint = subscription.endpoint;
        await subscription.unsubscribe().catch(() => undefined);
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: oldEndpoint })
        }).catch(() => undefined);
        subscription = null;
      }

      subscription =
        subscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.message ?? "Falha ao salvar dispositivo.");

      await refresh();
      success("Notificações tipo app ativadas neste dispositivo.", { title: "PWA ativo" });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Não foi possível ativar notificações.", { title: "Falha ao ativar" });
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(subscriptionId?: string) {
    setLoading(true);
    setLastResult(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const endpoint = subscriptionId ? undefined : subscription?.endpoint ?? currentEndpoint ?? undefined;

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, subscriptionId })
      });
      if (!subscriptionId) {
        await subscription?.unsubscribe().catch(() => undefined);
      }
      await refresh();
      info(subscriptionId ? "Dispositivo desativado." : "Notificações tipo app desativadas neste dispositivo.", { title: "Dispositivo atualizado" });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Não foi possível desativar notificações.", { title: "Falha ao desativar" });
    } finally {
      setLoading(false);
    }
  }

  async function sendLocalTest() {
    setLoading(true);
    setLastResult(null);
    try {
      if (getBrowserPermission() !== "granted") {
        throw new Error("Permita notificações no navegador antes de testar localmente.");
      }
      const registration = await getServiceWorkerRegistration();
      await registration.showNotification("InfraOS — teste local", {
        body: "Se este aviso apareceu no Windows/celular, o navegador consegue exibir notificações.",
        icon: "/icons/icon-192.svg",
        badge: "/icons/badge.svg",
        tag: "infraos-local-test",
        data: { url: "/notifications" }
      });
      setLastResult("Teste local disparado pelo próprio navegador. Se não apareceu fora da aba, o bloqueio está no Windows/celular/navegador.");
      success("Teste local disparado pelo navegador.", { title: "Teste local" });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Não foi possível testar localmente.", { title: "Teste local falhou" });
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setLoading(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as PushTestResponse;
      if (!response.ok || body.ok === false) throw new Error(body?.message ?? "Falha ao enviar teste.");

      const { sent, failed, skipped, details } = summarizePushResult(body);
      const message = `Push servidor → dispositivo: ${sent} enviada(s), ${failed} falha(s), ${skipped} ignorada(s).${details ? ` ${details}` : ""}`;
      setLastResult(message);
      await refresh();

      if (sent > 0 && failed === 0) {
        success(message, { title: "Push aceito" });
        return;
      }
      if (failed > 0) {
        throw new Error(message);
      }
      info(message, { title: "Push não entregue" });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Não foi possível enviar o teste.", { title: "Teste push falhou" });
    } finally {
      setLoading(false);
    }
  }

  const Wrapper = compact ? "div" : "section";

  return (
    <Wrapper className="app-surface-muted rounded-[var(--radius-panel)] border border-[var(--border)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="badge-base badge-primary"><Smartphone className="h-3.5 w-3.5" />PWA</div>
            <div className={`badge-base ${tone}`}>{stateLabel}</div>
            {status ? <div className="badge-base badge-muted"><Activity className="h-3.5 w-3.5" />{status.active} ativo(s)</div> : null}
          </div>
          <h3 className="app-title mt-3 text-base font-semibold">Notificações neste dispositivo</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Cada usuário precisa ativar uma vez em cada dispositivo. Se você usa Windows e celular, ative nos dois para receber lembretes em ambos.
          </p>
          <div className="mt-3 grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-2">
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <span className="font-semibold text-[var(--text-secondary)]">Permissão:</span> {stateLabel}
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <span className="font-semibold text-[var(--text-secondary)]">Dispositivos:</span> {status ? `${status.active} ativo(s) de ${status.total}` : "carregando..."}
            </div>
            <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:col-span-2">
              <span className="font-semibold text-[var(--text-secondary)]">Último envio:</span> {deliveryText(status?.lastDelivery ?? null)}
            </div>
          </div>
          {lastResult ? (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" /> {lastResult}
            </div>
          ) : null}
          {status?.configured === false ? (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" /> Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT para habilitar o envio real.
            </div>
          ) : null}
          {permission === "denied" ? (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" /> O navegador bloqueou notificações. Libere o site nas permissões do navegador e tente novamente.
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {active ? (
            <button type="button" className="btn-base btn-secondary btn-md" onClick={() => void deactivate()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}Desativar
            </button>
          ) : (
            <button type="button" className="btn-base btn-primary btn-md" onClick={activate} disabled={loading || permission === "unsupported"}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}Ativar notificações
            </button>
          )}
          <button type="button" className="btn-base btn-secondary btn-md" onClick={sendLocalTest} disabled={loading || permission !== "granted"}>
            <ShieldCheck className="h-4 w-4" />Testar local
          </button>
          <button type="button" className="btn-base btn-secondary btn-md" onClick={sendTest} disabled={loading || !active}>
            <CheckCircle2 className="h-4 w-4" />Enviar teste push
          </button>
        </div>
      </div>

      {status?.devices?.length ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <MonitorSmartphone className="h-4 w-4 text-[var(--primary)]" /> Dispositivos deste usuário
          </div>
          <div className="mt-3 grid gap-2">
            {status.devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{summarizeUserAgent(device.userAgent)}</span>
                    {device.isCurrent ? <span className="badge-base badge-primary">este dispositivo</span> : null}
                    <span className={`badge-base ${device.enabled ? "badge-success" : "badge-muted"}`}>{device.enabled ? "ativo" : "inativo"}</span>
                  </div>
                  <p className="mt-1 break-all text-xs text-[var(--text-muted)]">{device.endpoint}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Criado em {formatShortDate(device.createdAt)} · Último uso: {formatShortDate(device.lastUsedAt)}</p>
                </div>
                {device.enabled ? (
                  <button type="button" className="btn-base btn-secondary btn-sm" onClick={() => void deactivate(device.id)} disabled={loading}>
                    <Trash2 className="h-3.5 w-3.5" />Desativar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Wrapper>
  );
}
