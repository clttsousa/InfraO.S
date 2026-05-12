"use client";

import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import { cn } from "@/components/shared/utils";
import { BrandLogo } from "@/components/shared/brand-logo";

function SidebarBody({ user, onNavigate, compact = false }: { user: SessionUser; onNavigate?: () => void; compact?: boolean }) {
  const pathname = usePathname();
  const navigationItems = getNavigationItems(user);

  if (compact) {
    return (
      <>
        <div className="px-3 py-5">
          <div className="rail-card flex flex-col items-center justify-center gap-3 rounded-[1.2rem] px-2 py-4 text-center">
            <BrandLogo variant="mark" size="sm" />
            <div>
              <p className="rail-caption text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">InfraOS</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Painel</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-2 px-2 pb-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} data-active={active} aria-label={item.label} title={item.label} className="nav-rail-item group">
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[var(--icon-active)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]")} />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <div className="rail-card flex flex-col items-center gap-2 rounded-[1.15rem] px-2 py-3 text-center text-xs text-[var(--text-secondary)]">
            <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
            <span className="font-semibold text-[var(--text-primary)]">{user.role === "ADMIN" ? "Admin" : "Operador"}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-5 py-6">
        <div className="sidebar-brand-card rounded-[1.2rem] px-4 py-4">
          <BrandLogo size="md" subtitle="Operação interna e gestão de O.S." />
          <p className="app-text-secondary mt-4 text-sm leading-6">
            Centralize ordens, acompanhe alertas operacionais e mantenha a equipe alinhada com uma experiência mais limpa e objetiva.
          </p>
        </div>
      </div>
      <nav className="space-y-1 px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} data-active={active} className="nav-item group text-sm font-medium">
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[var(--icon-active)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]")} />
              <span className={active ? "text-[var(--icon-active)]" : "text-[var(--text-primary)]"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="app-surface-muted flex items-center gap-2 rounded-[1.05rem] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-[var(--text-tertiary)]" />
          Perfil atual:
          <span className="font-semibold text-[var(--text-primary)]">{user.role === "ADMIN" ? "Admin" : "Operador"}</span>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ user, mobileOpen = false, onClose }: { user: SessionUser; mobileOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      <aside className="desktop-sidebar hidden w-[96px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-surface)] lg:flex">
        <SidebarBody user={user} compact />
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[320px] flex-col border-r border-[var(--border)] bg-[var(--sidebar-surface)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <BrandLogo size="sm" subtitle="Painel interno" />
              <button onClick={onClose} className="btn-base btn-ghost btn-md h-10 w-10 rounded-[var(--radius-control)] p-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarBody user={user} onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
