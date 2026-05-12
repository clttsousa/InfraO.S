"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  notify: (message: string, options?: Partial<Notification>) => string;
  success: (message: string, options?: Partial<Notification>) => string;
  error: (message: string, options?: Partial<Notification>) => string;
  warning: (message: string, options?: Partial<Notification>) => string;
  info: (message: string, options?: Partial<Notification>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = useCallback(
    (message: string, options?: Partial<Notification>) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        type: options?.type || "info",
        title: options?.title,
        message,
        duration: options?.duration ?? 3200,
        action: options?.action
      };

      setNotifications((prev) => [...prev, notification]);

      if (notification.duration && notification.duration > 0) {
        window.setTimeout(() => dismiss(id), notification.duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string, options?: Partial<Notification>) => notify(message, { ...options, type: "success" }), [notify]);
  const error = useCallback((message: string, options?: Partial<Notification>) => notify(message, { ...options, type: "error" }), [notify]);
  const warning = useCallback((message: string, options?: Partial<Notification>) => notify(message, { ...options, type: "warning" }), [notify]);
  const info = useCallback((message: string, options?: Partial<Notification>) => notify(message, { ...options, type: "info" }), [notify]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

function NotificationContainer({ notifications, onDismiss }: { notifications: Notification[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-50 flex w-[min(92vw,26rem)] flex-col gap-2 sm:bottom-4 sm:right-4">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onDismiss={() => onDismiss(notification.id)} />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const tone = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 shrink-0" />,
      boxStyle: { background: "color-mix(in srgb, var(--success-soft) 72%, var(--surface))", borderColor: "color-mix(in srgb, var(--success) 24%, var(--border))", color: "var(--text-primary)" },
      iconStyle: { color: "var(--success)" }
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 shrink-0" />,
      boxStyle: { background: "color-mix(in srgb, var(--danger-soft) 72%, var(--surface))", borderColor: "color-mix(in srgb, var(--danger) 24%, var(--border))", color: "var(--text-primary)" },
      iconStyle: { color: "var(--danger)" }
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 shrink-0" />,
      boxStyle: { background: "color-mix(in srgb, var(--warning-soft) 72%, var(--surface))", borderColor: "color-mix(in srgb, var(--warning) 24%, var(--border))", color: "var(--text-primary)" },
      iconStyle: { color: "var(--warning)" }
    },
    info: {
      icon: <Info className="h-5 w-5 shrink-0" />,
      boxStyle: { background: "color-mix(in srgb, var(--primary-soft) 72%, var(--surface))", borderColor: "color-mix(in srgb, var(--primary) 24%, var(--border))", color: "var(--text-primary)" },
      iconStyle: { color: "var(--primary)" }
    }
  }[notification.type];

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 rounded-[var(--radius-modal)] border p-4 shadow-[var(--shadow-lg)] backdrop-blur"
      style={tone.boxStyle}
      role="status"
    >
      <div style={tone.iconStyle}>{tone.icon}</div>
      <div className="min-w-0 flex-1">
        {notification.title ? <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title}</p> : null}
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{notification.message}</p>
        {notification.action ? (
          <button
            type="button"
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            {notification.action.label}
          </button>
        ) : null}
      </div>
      <button type="button" onClick={onDismiss} className="btn-base btn-ghost btn-sm h-8 w-8 rounded-lg p-0" aria-label="Fechar notificação">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
