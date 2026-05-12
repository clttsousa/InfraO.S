import { NotificationsLivePage } from "@/components/notifications/notifications-live-page";
import { getNotificationSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const summary = await getNotificationSummary();
  return <NotificationsLivePage initialSummary={summary} />;
}
