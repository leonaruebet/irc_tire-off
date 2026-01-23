"use client";

import { Car, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plate {
  id: string;
  license_plate: string;
  car_model: string | null;
  car_year: string | null;
  car_color: string | null;
  car_vin: string | null;
  created_at: Date;
  last_service?: {
    date: Date;
    branch: string;
    odometer_km: number;
  } | null;
}

interface PlateListProps {
  plates: Plate[];
  selected_plate_id?: string | null;
  on_select?: (plate: Plate) => void;
}

/**
 * Plate list component with clean card design
 * Displays user's registered plates with optional selection
 * @param props - List of plates, selected plate ID, and selection handler
 * @returns Plate list component
 */
export function PlateList({ plates, selected_plate_id, on_select }: PlateListProps) {
  console.log("[PlateList] Rendering", { count: plates.length, selected_plate_id });

  if (plates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Car className="h-10 w-10 text-primary" />
          </div>
          <p className="text-foreground font-medium text-center">
            No plates registered yet
          </p>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Add your first license plate to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plates.map((plate) => (
        <PlateCard
          key={plate.id}
          plate={plate}
          is_selected={selected_plate_id === plate.id}
          on_click={on_select ? () => on_select(plate) : undefined}
        />
      ))}
    </div>
  );
}

interface PlateCardProps {
  plate: Plate;
  is_selected?: boolean;
  on_click?: () => void;
}

/**
 * Individual plate card with clean design
 * Clickable for selection, highlights when selected
 * @param props - Plate data, selection state, and click handler
 * @returns Plate card
 */
function PlateCard({ plate, is_selected, on_click }: PlateCardProps) {
  const is_clickable = !!on_click;

  /**
   * Build subtitle from available car details
   */
  function get_subtitle(): string | null {
    const parts: string[] = [];
    if (plate.car_model) parts.push(plate.car_model);
    if (plate.car_year) parts.push(plate.car_year);
    if (plate.car_color) parts.push(plate.car_color);
    return parts.length > 0 ? parts.join(" • ") : null;
  }

  const subtitle = get_subtitle();

  return (
    <div
      onClick={on_click}
      className={cn(
        "bg-white rounded-2xl border p-4 transition-all",
        is_clickable && "cursor-pointer hover:bg-muted/30 active:scale-[0.98]",
        is_selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors",
            is_selected ? "bg-primary text-white" : "bg-primary/10"
          )}
        >
          <Car className={cn("h-6 w-6", is_selected ? "text-white" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg tracking-wide">{plate.license_plate}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {is_clickable && (
          <ChevronRight
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              is_selected ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
      </div>
    </div>
  );
}
