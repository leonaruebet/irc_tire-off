"use client";

import { CarsContent } from "@/components/cars/cars_content";
import { useCars } from "@/components/cars/cars_provider";
import { OilChangeHistory } from "@/components/service/oil_change_history";

/**
 * Oil page
 * Shows car list overview, or oil change history when car is selected
 * @returns Oil page
 */
export default function OilPage() {
  console.log("[Page] Oil - rendering");

  return <OilPageContent />;
}

/**
 * Inner component to access cars context
 * @returns Oil page content
 */
function OilPageContent() {
  const { selected_car } = useCars();
  console.log("[OilPageContent] Rendering", { selected_car_id: selected_car?.id });

  return (
    <CarsContent
      title="Oil"
      description="View oil change history"
      service_content={
        selected_car ? <OilChangeHistory car_id={selected_car.id} /> : undefined
      }
    />
  );
}
