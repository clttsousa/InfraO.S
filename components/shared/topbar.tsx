"use client";

import { Bell, Menu, Plus, Search, Shield, LayoutDashboard, FileText, Users, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { Button, ButtonLink } from "@/components/shared/ui";
import { LogoutButton } from "@/components/shared/logout-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CommandPalette, useCommandPalette } from "@/components/shared/command-palette";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useSystemPreferences } from "@/components/providers/system-preferences-provider";

const titleByPathname: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Ordens de Serviço",
  "/orders/new": "Nova O.S.",
  "/technicians": "Técnicos",
  "/users": "Usuários",
  "/reports": "Relatórios",
  "/settings": "Configurações",
  "/profile": "Meu acesso"
};

export function Topbar({ pathname, user, onMenuClick }: { pathname: string; user: SessionUser; onMenuClick?: () => void }) {
  const { isOpen, setIsOpen } = useCommandPalette();
  const { preferences } = useSystemPreferences();
  const router = useRouter();

  const commands = [
    { id: "dashboard", label: "Dashboard", description: "Ir para o resumo operacional", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard", shortcut: "⌘D" },
    { id: "new-order", label: "Nova O.S.", description: "Criar nova ordem de serviço", icon: <Plus className="h-4 w-4" />, href: "/orders/new", shortcut: "⌘N" },
    { id: "orders", label: "Ordens", description: "Abrir a listagem completa de ordens", icon: <FileText className="h-4 w-4" />, href: "/orders", shortcut: "⌘O" },
    { id: "users", label: "Usuários", description: "Gerenciar equipe interna", icon: <Users className="h-4 w-4" />, href: "/users" },
    { id: "settings", label: "Configurações", description: "Preferências e área administrativa", icon: <Settings className="h-4 w-4" />, href: "/settings" },
    { id: "alerts", label: "Alertas", description: "Ver ordens críticas ou atrasadas", icon: <Bell className="h-4 w-4" />, action: () => router.push("/orders?lateOnly=1") }
  ].filter((command) => (command.id === "users" || command.id === "settings" ? user.role === "ADMIN" : true));

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--surface)]/92 px-4 py-4 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={onMenuClick} className="btn-base btn-secondary btn-md h-10 w-10 rounded-[var(--radius-control)] p-0 lg:hidden" aria-label="Abrir navegação lateral">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="topbar-brand-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                <BrandLogo variant="mark" size="sm" className="shrink-0" />
                <span className="app-eyebrow text-[10px] font-medium">Painel interno</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <h1 className="app-title truncate text-[1.85rem] font-semibold leading-tight md:text-[2.15rem]">{titleByPathname[pathname] ?? "InfraOS"}</h1>
                {user.role === "ADMIN" ? <span className="badge-base badge-primary hidden sm:inline-flex"><Shield className="h-3.5 w-3.5" />Admin</span> : null}
              </div>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            {preferences.showCommandPaletteHint ? (
              <button type="button" onClick={() => setIsOpen(true)} className="command-hint-trigger app-surface-muted hidden items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 xl:inline-flex">
                <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="app-text-tertiary text-sm">Buscar ações</span>
                <span className="app-number rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">⌘ / Ctrl + K</span>
              </button>
            ) : null}
            <ButtonLink href="/orders?lateOnly=1" variant="secondary" className="hidden sm:inline-flex"><Bell className="h-4 w-4" />Alertas</ButtonLink>
            <ThemeToggle />
            <Link href="/orders/new" className="flex-1 sm:flex-none"><Button className="w-full sm:w-auto">Nova O.S.</Button></Link>
            <LogoutButton userName={user.name} />
          </div>
        </div>
      </header>
      <CommandPalette commands={commands} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
