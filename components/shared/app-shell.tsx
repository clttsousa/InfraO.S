"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { PwaBootstrap } from "@/components/pwa/pwa-bootstrap";
import { SessionPresenceHeartbeat } from "@/components/shared/session-presence-heartbeat";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import type { SessionUser } from "@/lib/auth";
import type { NotificationSummary } from "@/types";

export function AppShell({ children, user, notifications }: { children: ReactNode; user: SessionUser; notifications: NotificationSummary }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RealtimeProvider>
      <div className="app-shell-bg min-h-screen">
        <PwaBootstrap />
        <SessionPresenceHeartbeat />
        <div className="mx-auto flex min-h-screen max-w-[1800px]">
          <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <Topbar pathname={pathname} user={user} notifications={notifications} onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 pb-[calc(4.85rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
            <MobileBottomNav user={user} />
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}
