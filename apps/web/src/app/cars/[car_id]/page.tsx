import { redirect, notFound } from "next/navigation";
import { get_session } from "@/lib/auth";
import { create_server_caller } from "@/lib/trpc_server";
import { APP_ROUTES } from "@tireoff/shared";
import { CarDetailHeader } from "@/components/cars/car_detail_header";
import { ServiceTabs } from "@/components/service/service_tabs";

interface CarDetailPageProps {
  params: Promise<{ car_id: string }>;
}

/**
 * Car detail page
 * Shows car info and service history tabs
 */
export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { car_id } = await params;
  console.log("[Page] Car detail", { car_id });

  const session = await get_session();

  if (!session) {
    redirect(APP_ROUTES.LOGIN);
  }

  // Fetch car details
  const api = await create_server_caller();

  try {
    const car = await api.car.get({ car_id });

    return (
      <div className="flex flex-col min-h-screen">
        <CarDetailHeader car={car} />

        <div className="flex-1 px-4 py-6">
          <ServiceTabs car_id={car_id} stats={car.stats} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[Page] Car detail error", error);
    notFound();
  }
}
