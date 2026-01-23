import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";
import { UserLayout } from "@/components/layout/user_layout";
import { HistoryList } from "@/components/history/history_list";

/**
 * History page showing all service logs for all registered cars
 * Displays tire changes, tire switches, and oil changes in a unified timeline
 * @returns History page component
 */
export default async function HistoryPage() {
  console.log("[Page] History - checking session");

  const session = await get_session();
  const t = await getTranslations("history");

  if (!session) {
    console.log("[Page] History - no session, redirecting to login");
    redirect(APP_ROUTES.LOGIN);
  }

  console.log("[Page] History - session valid, rendering");

  return (
    <UserLayout show_service_tabs={false}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <HistoryList />
      </div>
    </UserLayout>
  );
}
