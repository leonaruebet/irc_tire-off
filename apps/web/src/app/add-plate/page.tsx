import { redirect } from "next/navigation";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";
import { UserLayout } from "@/components/layout/user_layout";
import { AddPlateForm } from "@/components/cars/add_plate_form";

/**
 * Add plate page
 * Allows users to register a new license plate
 * @returns Add plate page component
 */
export default async function AddPlatePage() {
  console.log("[Page] AddPlate - checking session");

  const session = await get_session();

  if (!session) {
    console.log("[Page] AddPlate - no session, redirecting to login");
    redirect(APP_ROUTES.LOGIN);
  }

  return (
    <UserLayout show_service_tabs={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add License Plate</h1>
          <p className="text-muted-foreground mt-1">
            Register your vehicle license plate
          </p>
        </div>

        <AddPlateForm />
      </div>
    </UserLayout>
  );
}
