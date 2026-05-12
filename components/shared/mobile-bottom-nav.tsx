"use client";

import Link from "next/link";
import { BellRing, CalendarClock, ClipboardList, LayoutDashboard, Menu as MenuIcon, Settings, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/components/shared/utils";

const primaryItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard, match: ["/dashboard"] },
  { href: "/orders", label: "Ordens", icon: ClipboardList, match: ["/orders"] },
  { href: "/intervencoes", label: "Intervenções", icon: CalendarClock, match: ["/intervencoes"] },
  { href: "/notifications", label: "Alertas", icon: BellRing, match: ["/notifications"] }
];

function isActive(pathname: string, matchers: string[]) {
  return matchers.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`));
}

export function MobileBottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const menuHref = user.role === "ADMIN" ? "/settings" : "/profile";
  const menuActive = pathname.startsWith("/settings") || pathname.startsWith("/profile") || pathname.startsWith("/users") || pathname.startsWith("/reports") || pathname.startsWith("/audit") || pathname.startsWith("/technicians");
  const MenuIconComponent = user.role === "ADMIN" ? Settings : UserCircle;

  return (
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
      <Link href={menuHref} aria-current={menuActive ? "page" : undefined} className={cn("mobile-bottom-nav-item", menuActive ? "is-active" : "")}>
        <MenuIconComponent className="h-5 w-5" />
        <span>Menu</span>
      </Link>
    </nav>
  );
}
