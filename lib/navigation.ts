import { BarChart3, BellRing, CalendarClock, ClipboardList, History, LayoutDashboard, PlusSquare, Settings, UserCog, Users } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const allNavigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/orders/new", label: "Nova O.S.", icon: PlusSquare },
  { href: "/intervencoes", label: "Intervenções", icon: CalendarClock },
  { href: "/notifications", label: "Notificações", icon: BellRing },
  { href: "/technicians", label: "Técnicos", icon: Users, adminOnly: true },
  { href: "/users", label: "Usuários", icon: UserCog, adminOnly: true },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/audit", label: "Auditoria", icon: History, adminOnly: true },
  { href: "/settings", label: "Configurações", icon: Settings, adminOnly: true }
];

export function getNavigationItems(user: SessionUser) {
  return allNavigationItems.filter((item) => !item.adminOnly || user.role === "ADMIN");
}
