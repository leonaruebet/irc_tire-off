"use client";

import { TireStatusOverview } from "./tire_status_overview";

interface TireChangeHistoryProps {
  car_id: string;
}

/**
 * Tire tab content component
 * Shows tire status visual with car diagram and next service recommendations
 * History toggle removed - only shows current tire status
 */
export function TireChangeHistory({ car_id }: TireChangeHistoryProps) {
  console.log("[TireChangeHistory] Render", { car_id });

  return <TireStatusOverview car_id={car_id} />;
}
