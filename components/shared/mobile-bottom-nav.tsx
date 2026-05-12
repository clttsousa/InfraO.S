"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BellRing, CalendarClock, ClipboardList, LayoutDashboard, LogOut, Menu as MenuIcon, ShieldCheck, X, PlusSquare, Settings, UserCog, History, BarChart3, Users, UserRound } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import { cn } from "@/components/shared/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useNotifications } from "@/components/providers/notification-provider";

const primaryItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/orders", label: "Ordens", icon: ClipboardList, match: ["/orders"] },
  { href: "/intervencoes", label: "Intervenções", icon: CalendarClock, match: ["/intervencoes"] },
  { href: "/notifications", label: "Alertas", icon: BellRing, match: ["/notifications"] }
];

const primaryHrefs = new Set(primaryItems.map((item) => item.href));

const menuGroups = [
  {
    title: "Operação",
    description: "Ações usadas no atendimento diário",
    items: [
      { href: "/orders/new", label: "Nova O.S.", icon: PlusSquare },
      { href: "/orders", label: "Ordens", icon: ClipboardList },
      { href: "/intervencoes", label: "Intervenções", icon: CalendarClock },
      { href: "/notifications", label: "Alertas", icon: BellRing }
    ]
  },
  {
    title: "Gestão",
    description: "Controle administrativo e acompanhamento",
    items: [
      { href: "/technicians", label: "Técnicos", icon: Users, adminOnly: true },
      { href: "/users", label: "Usuários", icon: UserCog, adminOnly: true },
      { href: "/reports", label: "Relatórios", icon: BarChart3 },
      { href: "/audit", label: "Auditoria", icon: History, adminOnly: true }
    ]
  },
  {
    title: "Sistema",
    description: "Preferências, acesso e encerramento",
    items: [
      { href: "/settings", label: "Configurações", icon: Settings, adminOnly: true },
      { href: "/profile", label: "Meu acesso", icon: UserRound }
    ]
  }
];

function isActive(pathname: string, matchers: string[]) {
  return matchers.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`));
}

function getDeviceFriendlyUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS / Safari";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac")) return "macOS";
  return "Dispositivo atual";
}

export function MobileBottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { error } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deviceName, setDeviceName] = useState("Dispositivo atual");

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof navigator !== "undefined") setDeviceName(getDeviceFriendlyUserAgent(navigator.userAgent));
  }, []);

  const permittedMenuGroups = useMemo(() => menuGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || user.role === "ADMIN")
  })).filter((group) => group.items.length > 0), [user.role]);

  const menuItems = useMemo(() => getNavigationItems(user).filter((item) => !primaryHrefs.has(item.href)), [user]);
  const menuActive = [...menuItems, ...permittedMenuGroups.flatMap((group) => group.items)].some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  function handleLogout() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) throw new Error("Falha ao encerrar a sessão.");
        router.replace("/login");
        router.refresh();
      } catch {
        error("Não foi possível sair agora. Tente novamente em instantes.");
      }
    });
  }

  return (
    <>
      <nav className="mobile-bottom-nav lg:hidden" aria-label="Navegação principal mobile">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.match);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("mobile-bottom-nav-item", active ? "is-active" : "")}> 
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className={cn("mobile-bottom-nav-item", menuActive || isOpen ? "is-active" : "")}
        >
          <MenuIcon className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </nav>

      {isOpen ? (
        <div className="mobile-menu-overlay lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do InfraOS">
          <button className="mobile-menu-backdrop" aria-label="Fechar menu" onClick={() => setIsOpen(false)} />
          <section className="mobile-menu-sheet">
            <div className="mobile-menu-handle" aria-hidden="true" />
            <header className="mobile-menu-header">
              <div className="min-w-0">
                <BrandLogo size="sm" subtitle="Menu operacional" />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <span className="badge-base badge-primary"><ShieldCheck className="h-3.5 w-3.5" />{user.role === "ADMIN" ? "Admin" : "Operador"}</span>
                  <span>{deviceName}</span>
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="btn-base btn-secondary btn-md h-10 w-10 rounded-[var(--radius-control)] p-0" aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="mobile-menu-user-card">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Sessão ativa</p>
              <p className="mt-1 truncate text-base font-semibold text-[var(--text-primary)]">{user.name}</p>
              <p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">Acesso nominal auditado</p>
            </div>

            <div className="mobile-menu-sections" aria-label="Mais opções">
              {permittedMenuGroups.map((group) => (
                <section key={group.title} className="mobile-menu-section">
                  <div className="mobile-menu-section-header">
                    <p className="mobile-menu-section-title">{group.title}</p>
                    <p className="mobile-menu-section-description">{group.description}</p>
                  </div>
                  <nav className="mobile-menu-grid" aria-label={group.title}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link key={`${group.title}-${item.href}`} href={item.href} className={cn("mobile-menu-link", active ? "is-active" : "")} aria-current={active ? "page" : undefined}>
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    {group.title === "Sistema" ? (
                      <button type="button" onClick={handleLogout} disabled={pending} className="mobile-menu-link mobile-menu-logout-inline">
                        <LogOut className="h-5 w-5" />
                        <span>{pending ? "Saindo..." : "Sair do InfraOS"}</span>
                      </button>
                    ) : null}
                  </nav>
                </section>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
