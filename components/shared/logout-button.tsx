"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { useNotifications } from "@/components/providers/notification-provider";

export function LogoutButton({ userName }: { userName: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { error } = useNotifications();

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
    <div className="flex items-center gap-2">
      <Link href="/profile" className="btn-base btn-secondary btn-md hidden sm:inline-flex">{userName}</Link>
      <button onClick={handleLogout} disabled={pending} className="btn-base btn-secondary btn-md h-10 w-10 p-0" aria-label={pending ? "Saindo do sistema" : "Sair do sistema"}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </button>
      <span className="sr-only">{pending ? "Saindo..." : "Sair"}</span>
    </div>
  );
}
