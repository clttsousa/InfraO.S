import { NotificationsLivePage } from "@/components/notifications/notifications-live-page";
import { getNotificationSummary } from "@/lib/data";

export default async function NotificationsPage() {
  const summary = await getNotificationSummary();
  return <NotificationsLivePage initialSummary={summary} />;
}
