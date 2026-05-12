"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, BellOff, CheckCircle2, Loader2, Smartphone, TriangleAlert, Activity, Radio, ShieldCheck } from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";

type PermissionStateLabel = "not-requested" | "granted" | "denied" | "unsupported";

type DeliveryLog = {
  channel: string;
  status: "sent" | "failed" | "skipped" | string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

type PushStatus = {
  configured: boolean;
  total: number;
  active: number;
  lastUsedAt: string | null;
  lastDelivery: DeliveryLog | null;
};

type PushTestResponse = {
  ok?: boolean;
  message?: string;
  sent?: number;
  failed?: number;
  skipped?: number;
  details?: Array<{ status: string; message: string; httpStatus?: number }>;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferEquals(a: ArrayBuffer | null | undefined, b: Uint8Array) {
  if (!a) return false;
  const first = new Uint8Array(a);
  if (first.length !== b.length) return false;
  return first.every((value, index) => value === b[index]);
}

function getBrowserPermission(): PermissionStateLabel {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "not-requested";
}

function permissionText(permission: PermissionStateLabel, active: boolean) {
  if (permission === "unsupported") return "Indisponível neste navegador";
  if (permission === "denied") return "Bloqueado pelo navegador";
  if (permission === "granted" && active) return "Ativo neste dispositivo";
  if (permission === "granted") return "Permitido, mas inativo";
  return "Não solicitado";
}

function deliveryText(delivery: DeliveryLog | null) {
  if (!delivery) return "Nenhum envio PWA registrado ainda.";
  const date = new Date(delivery.created_at).toLocaleString("pt-BR");
  if (delivery.status === "sent") return `Último push aceito pelo serviço em ${date}.`;
  if (delivery.status === "failed") return `Último push falhou em ${date}: ${delivery.error_message ?? "sem detalhe"}`;
  return `Último push ignorado em ${date}: ${delivery.error_message ?? "sem detalhe"}`;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker indisponível neste navegador.");
  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  await registration.update().catch(() => undefined);
  return navigator.serviceWorker.ready;
}

async function fetchStatus() {
  const response = await fetch("/api/push/status", { cache: "no-store" });
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

export function DeviceNotificationSettings({ compact = false }: { compact?: boolean }) {
  const { success, error, info } = useNotifications();
  const [permission, setPermission] = useState<PermissionStateLabel>("unsupported");
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPermission(getBrowserPermission());
    try {
      const nextStatus = await fetchStatus();
      setStatus(nextStatus);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const active = Boolean(status?.active && permission === "granted");
  const stateLabel = permissionText(permission, active);

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

      // Quando a chave VAPID muda, subscriptions antigas continuam no navegador, mas
      // o push do servidor pode ser aceito pelo serviço e não chegar no dispositivo.
      // Por isso a V6.9.1 força uma nova inscrição se a chave atual for diferente.
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

  async function deactivate() {
    setLoading(true);
    setLastResult(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint })
      });
      await subscription?.unsubscribe().catch(() => undefined);
      await refresh();
      info("Notificações tipo app desativadas neste dispositivo.", { title: "Dispositivo atualizado" });
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
            Receba lembretes de intervenções como notificação tipo app no Windows/celular. O InfraOS não aplica cache offline agressivo; o Service Worker desta versão é usado apenas para push.
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
            <button type="button" className="btn-base btn-secondary btn-md" onClick={deactivate} disabled={loading}>
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
    </Wrapper>
  );
}
