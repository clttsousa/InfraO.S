import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { getSessionUser } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  return <AppShell user={session}>{children}</AppShell>;
}
