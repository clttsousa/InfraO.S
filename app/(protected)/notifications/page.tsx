import { NotificationsLivePage } from "@/components/notifications/notifications-live-page";
import { getNotificationSummary } from "@/lib/data";
import type { NotificationFeedFilter } from "@/types";

export const dynamic = "force-dynamic";

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function getPositiveInt(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(getStringParam(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function normalizeFilter(value: string | string[] | undefined): NotificationFeedFilter {
  const raw = getStringParam(value);
  if (["all", "interventions", "orders", "system", "read"].includes(raw)) return raw as NotificationFeedFilter;
  return "all";
}

export default async function NotificationsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {};
  const summary = await getNotificationSummary({
    filter: normalizeFilter(params.filter),
    page: getPositiveInt(params.page, 1),
    pageSize: getPositiveInt(params.pageSize, 20)
  });
  return <NotificationsLivePage initialSummary={summary} />;
}
