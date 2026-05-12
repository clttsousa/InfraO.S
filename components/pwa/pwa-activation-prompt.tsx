"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, Loader2, X } from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";
import { arrayBufferEquals, getBrowserPermission, getServiceWorkerRegistration, urlBase64ToUint8Array, type PermissionStateLabel } from "@/components/pwa/device-notification-settings";

const SNOOZE_KEY = "infraos:pwa-activation-snooze-until:v1";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

type PushStatus = {
  configured: boolean;
  currentDeviceActive: boolean;
  currentDeviceKnown: boolean;
};

function readSnoozed() {
  try {
    const value = Number(window.localStorage.getItem(SNOOZE_KEY) ?? "0");
    return Number.isFinite(value) && value > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // localStorage pode estar indisponível; apenas oculta até o próximo carregamento.
  }
}

async function getCurrentSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration?.pushManager.getSubscription() ?? null;
}

async function fetchStatus(endpoint?: string | null) {
  const suffix = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : "";
  const response = await fetch(`/api/push/status${suffix}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível verificar o status das notificações.");
  return response.json() as Promise<PushStatus>;
}

export function PwaActivationPrompt() {
  const { success, error, info } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<PermissionStateLabel>("unsupported");

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (readSnoozed()) return;

    const browserPermission = getBrowserPermission();
    setPermission(browserPermission);
    if (browserPermission === "unsupported" || browserPermission === "denied") return;

    try {
      const subscription = await getCurrentSubscription();
      const status = await fetchStatus(subscription?.endpoint ?? null);
      if (!status.configured) return;
      setVisible(!status.currentDeviceActive);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function activate() {
    setLoading(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
      if (!publicKey) throw new Error("Chave pública VAPID não configurada.");
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

      subscription = subscription ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }));
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON())
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.message ?? "Falha ao salvar dispositivo.");

      setVisible(false);
      success("Este dispositivo agora receberá notificações tipo app.", { title: "Notificações ativadas" });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Não foi possível ativar notificações.", { title: "Falha ao ativar" });
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    snooze();
    setVisible(false);
    info("Você pode ativar depois em Configurações > Notificações neste dispositivo.", { title: "Lembrete ocultado" });
  }

  if (!visible) return null;

  return (
    <div className="px-4 pt-3 sm:px-6 lg:px-8">
      <div className="app-surface-muted mx-auto flex max-w-[1700px] flex-col gap-3 rounded-[var(--radius-panel)] border border-[var(--primary)]/25 bg-[var(--primary-soft)]/60 px-4 py-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-2xl border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
            {permission === "denied" ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="app-title text-sm font-semibold">Ative as notificações do InfraOS neste dispositivo</p>
            <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
              Receba lembretes de intervenções programadas no Windows/celular, mesmo fora da aba do navegador.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:items-center">
          <button type="button" className="btn-base btn-primary btn-sm" onClick={activate} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}Ativar
          </button>
          <button type="button" className="btn-base btn-secondary btn-sm" onClick={dismiss} disabled={loading}>
            <X className="h-3.5 w-3.5" />Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
