"use client";

import { useEffect, useState } from "react";

export type DevicePlatform = "ios" | "android" | "windows" | "macos" | "desktop" | "other";

export type DeviceEnvironment = {
  ready: boolean;
  platform: DevicePlatform;
  platformLabel: string;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  displayMode: "pwa" | "browser";
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  notificationSupported: boolean;
  showNotificationSupported: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerActive: boolean;
  secureContext: boolean;
  notificationPermission: NotificationPermission | "unsupported";
};

const initialEnvironment: DeviceEnvironment = {
  ready: false,
  platform: "other",
  platformLabel: "Carregando...",
  isIOS: false,
  isAndroid: false,
  isWindows: false,
  isSafari: false,
  isStandalone: false,
  displayMode: "browser",
  serviceWorkerSupported: false,
  pushManagerSupported: false,
  notificationSupported: false,
  showNotificationSupported: false,
  serviceWorkerRegistered: false,
  serviceWorkerActive: false,
  secureContext: false,
  notificationPermission: "unsupported"
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function detectPlatform(userAgent: string, platform: string, maxTouchPoints: number): DevicePlatform {
  const normalized = userAgent.toLowerCase();
  const normalizedPlatform = platform.toLowerCase();
  const iPadOSDesktopMode = normalizedPlatform.includes("mac") && maxTouchPoints > 1;

  if (/iphone|ipad|ipod/.test(normalized) || iPadOSDesktopMode) return "ios";
  if (normalized.includes("android")) return "android";
  if (normalized.includes("windows")) return "windows";
  if (normalized.includes("mac os") || normalizedPlatform.includes("mac")) return "macos";
  if (normalized.includes("linux") || normalized.includes("x11")) return "desktop";
  return "other";
}

function platformLabel(platform: DevicePlatform) {
  if (platform === "ios") return "iOS / iPadOS";
  if (platform === "android") return "Android";
  if (platform === "windows") return "Windows";
  if (platform === "macos") return "macOS";
  if (platform === "desktop") return "Desktop";
  return "Outro";
}

export async function readDeviceEnvironment(): Promise<DeviceEnvironment> {
  if (typeof window === "undefined") return initialEnvironment;

  const userAgent = window.navigator.userAgent;
  const platform = detectPlatform(userAgent, window.navigator.platform ?? "", window.navigator.maxTouchPoints ?? 0);
  const standaloneByMedia = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const standaloneByNavigator = Boolean((window.navigator as NavigatorWithStandalone).standalone);
  const isStandalone = standaloneByMedia || standaloneByNavigator;
  const serviceWorkerSupported = "serviceWorker" in window.navigator;
  const pushManagerSupported = "PushManager" in window;
  const notificationSupported = "Notification" in window;
  const registration = serviceWorkerSupported ? await window.navigator.serviceWorker.getRegistration("/").catch(() => undefined) : undefined;
  const showNotificationSupported = Boolean(registration && "showNotification" in registration);
  const isSafari = /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(userAgent);

  return {
    ready: true,
    platform,
    platformLabel: platformLabel(platform),
    isIOS: platform === "ios",
    isAndroid: platform === "android",
    isWindows: platform === "windows",
    isSafari,
    isStandalone,
    displayMode: isStandalone ? "pwa" : "browser",
    serviceWorkerSupported,
    pushManagerSupported,
    notificationSupported,
    showNotificationSupported,
    serviceWorkerRegistered: Boolean(registration),
    serviceWorkerActive: Boolean(registration?.active),
    secureContext: window.isSecureContext || window.location.hostname === "localhost",
    notificationPermission: notificationSupported ? window.Notification.permission : "unsupported"
  };
}

export function useDeviceEnvironment() {
  const [environment, setEnvironment] = useState<DeviceEnvironment>(initialEnvironment);

  useEffect(() => {
    let mounted = true;
    void readDeviceEnvironment().then((next) => {
      if (mounted) setEnvironment(next);
    });

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const refresh = () => {
      void readDeviceEnvironment().then((next) => {
        if (mounted) setEnvironment(next);
      });
    };
    mediaQuery?.addEventListener?.("change", refresh);

    return () => {
      mounted = false;
      mediaQuery?.removeEventListener?.("change", refresh);
    };
  }, []);

  return environment;
}

export function canRequestPushOnThisContext(environment: DeviceEnvironment) {
  if (!environment.ready) return false;
  if (!environment.secureContext) return false;
  if (!environment.serviceWorkerSupported || !environment.pushManagerSupported || !environment.notificationSupported) return false;
  if (environment.isIOS && !environment.isStandalone) return false;
  return true;
}
