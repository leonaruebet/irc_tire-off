import { redirect } from "next/navigation";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";

/**
 * Home page
 * Redirects to cars page if logged in, otherwise to login
 */
export default async function HomePage() {
  console.log("[Page] Home - checking session");

  const session = await get_session();

  if (session) {
    console.log("[Page] Home - user logged in, redirecting to cars");
    redirect(APP_ROUTES.CARS);
  }

  console.log("[Page] Home - no session, redirecting to login");
  redirect(APP_ROUTES.LOGIN);
}
