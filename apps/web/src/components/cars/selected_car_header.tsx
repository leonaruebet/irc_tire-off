"use client";

import { useState } from "react";
import { Car, X, Info } from "lucide-react";
import { useCars } from "./cars_provider";
import { CarInfoSheet } from "./car_info_sheet";
import { Button } from "@/components/ui/button";

interface SelectedCarHeaderProps {
  car: {
    id: string;
    license_plate: string;
    car_model: string | null;
    car_year: string | null;
    car_color: string | null;
    car_vin: string | null;
  };
}

/**
 * Header showing the currently selected car with option to deselect
 * Displayed between MobileHeader and ServiceTabs when a car is selected
 * Includes info button to view/edit car details
 * @param props - Selected car data
 * @returns Selected car header component
 */
export function SelectedCarHeader({ car }: SelectedCarHeaderProps) {
  const { clear_selection } = useCars();
  const [show_info_sheet, set_show_info_sheet] = useState(false);

  console.log("[SelectedCarHeader] Rendering", { plate: car.license_plate });

  /**
   * Handle back button click to clear car selection
   */
  function handle_back() {
    console.log("[SelectedCarHeader] Back clicked, clearing selection");
    clear_selection();
  }

  /**
   * Handle info button click to open car info sheet
   */
  function handle_info_click() {
    console.log("[SelectedCarHeader] Info clicked, opening sheet");
    set_show_info_sheet(true);
  }

  /**
   * Build subtitle from available car details
   */
  function get_subtitle(): string | null {
    const parts: string[] = [];
    if (car.car_model) parts.push(car.car_model);
    if (car.car_year) parts.push(car.car_year);
    if (car.car_color) parts.push(car.car_color);
    return parts.length > 0 ? parts.join(" • ") : null;
  }

  const subtitle = get_subtitle();

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back/Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_back}
            className="shrink-0 h-9 w-9"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Back to car list</span>
          </Button>

          {/* Car icon */}
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Car className="h-5 w-5 text-primary" />
          </div>

          {/* Car info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg tracking-wide truncate">
              {car.license_plate}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Info button to view/edit car details */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_info_click}
            className="shrink-0 h-9 w-9"
          >
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">View car info</span>
          </Button>
        </div>
      </div>

      {/* Car Info Sheet */}
      <CarInfoSheet
        is_open={show_info_sheet}
        on_close={() => set_show_info_sheet(false)}
        car={car}
      />
    </>
  );
}
