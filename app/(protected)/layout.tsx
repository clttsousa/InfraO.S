import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { getNotificationSummary } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const notifications = await getNotificationSummary();

  return <AppShell user={session} notifications={notifications}>{children}</AppShell>;
}
