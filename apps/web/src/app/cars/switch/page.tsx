"use client";

import { CarsContent } from "@/components/cars/cars_content";
import { useCars } from "@/components/cars/cars_provider";
import { TireSwitchHistory } from "@/components/service/tire_switch_history";

/**
 * Tire Switch page
 * Shows car list overview, or tire switch history when car is selected
 * @returns Tire switch page
 */
export default function TireSwitchPage() {
  console.log("[Page] TireSwitch - rendering");

  return <TireSwitchPageContent />;
}

/**
 * Inner component to access cars context
 * @returns Tire switch page content
 */
function TireSwitchPageContent() {
  const { selected_car } = useCars();
  console.log("[TireSwitchPageContent] Rendering", { selected_car_id: selected_car?.id });

  return (
    <CarsContent
      title="Tire Switch"
      description="View tire rotation history"
      service_content={
        selected_car ? <TireSwitchHistory car_id={selected_car.id} /> : undefined
      }
    />
  );
}
