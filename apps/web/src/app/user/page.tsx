import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";
import { UserLayout } from "@/components/layout/user_layout";
import { UserProfile } from "@/components/user/user_profile";

/**
 * User profile page
 * Shows user info and settings
 * @returns User page component
 */
export default async function UserPage() {
  console.log("[Page] User - checking session");

  const session = await get_session();
  const t = await getTranslations("profile");

  if (!session) {
    console.log("[Page] User - no session, redirecting to login");
    redirect(APP_ROUTES.LOGIN);
  }

  return (
    <UserLayout show_service_tabs={false}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <UserProfile user={session.user} />
      </div>
    </UserLayout>
  );
}
