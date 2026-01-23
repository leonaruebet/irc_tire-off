import { redirect } from "next/navigation";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";
import { CarsLayoutClient } from "@/components/cars/cars_layout_client";

/**
 * Cars layout
 * Wraps all /cars/* pages with shared state and navigation
 * @param props - Children pages
 * @returns Layout component
 */
export default async function CarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[Layout] Cars - checking session");

  const session = await get_session();

  if (!session) {
    console.log("[Layout] Cars - no session, redirecting to login");
    redirect(APP_ROUTES.LOGIN);
  }

  return <CarsLayoutClient>{children}</CarsLayoutClient>;
}
