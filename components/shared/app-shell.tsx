"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { PwaBootstrap } from "@/components/pwa/pwa-bootstrap";
import { PwaActivationPrompt } from "@/components/pwa/pwa-activation-prompt";
import { SessionPresenceHeartbeat } from "@/components/shared/session-presence-heartbeat";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import type { SessionUser } from "@/lib/auth";
import type { NotificationSummary } from "@/types";

export function AppShell({ children, user, notifications }: { children: ReactNode; user: SessionUser; notifications: NotificationSummary }) {
  const pathname = usePathname();
  return (
    <RealtimeProvider>
      <div className="app-shell app-shell-bg min-h-screen w-full overflow-x-hidden">
        <PwaBootstrap />
        <SessionPresenceHeartbeat />
        <div className="app-shell-layout flex min-h-screen w-full min-w-0">
          <Sidebar user={user} />
          <div className="app-shell-main flex min-h-screen min-w-0 flex-1 flex-col">
            <Topbar pathname={pathname} user={user} notifications={notifications} />
            <PwaActivationPrompt />
            <main className="app-main-content flex min-w-0 flex-1 flex-col pb-[calc(4.85rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
            <MobileBottomNav user={user} />
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}
