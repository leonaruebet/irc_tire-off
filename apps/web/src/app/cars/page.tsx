"use client";

import { CarsContent } from "@/components/cars/cars_content";
import { useCars } from "@/components/cars/cars_provider";
import { TireChangeHistory } from "@/components/service/tire_change_history";

/**
 * Tire page - main cars view
 * Shows car list overview, or tire change history when car is selected
 * @returns Tire page
 */
export default function TirePage() {
  console.log("[Page] Tire - rendering");

  return <TirePageContent />;
}

/**
 * Inner component to access cars context
 * @returns Tire page content
 */
function TirePageContent() {
  const { selected_car } = useCars();
  console.log("[TirePageContent] Rendering", { selected_car_id: selected_car?.id });

  return (
    <CarsContent
      title="Tire"
      description="View tire change history"
      service_content={
        selected_car ? <TireChangeHistory car_id={selected_car.id} /> : undefined
      }
    />
  );
}
