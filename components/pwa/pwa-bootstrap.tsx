"use client";

import { useEffect } from "react";

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext && window.location.hostname !== "localhost") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => {
        // Falha silenciosa: a UI de notificações mostra orientação quando o usuário tenta ativar.
      });
  }, []);

  return null;
}
