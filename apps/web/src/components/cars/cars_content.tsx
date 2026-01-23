"use client";

import { ReactNode } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PlateList } from "./plate_list";
import { PlateListSkeleton } from "./plate_list_skeleton";
import { useCars } from "./cars_provider";
import { Button } from "@/components/ui/button";

interface CarsContentProps {
  title: string;
  description: string;
  /** Content to show when a car is selected (service history component) */
  service_content?: ReactNode;
}

/**
 * Cars content component with clean design
 * Shows car list when no car selected, or service data when car is selected
 * @param props - Title, description, and optional service content
 * @returns Content with plate list or service data
 */
export function CarsContent({ title, description, service_content }: CarsContentProps) {
  const { cars, is_loading, selected_car, select_car } = useCars();
  console.log("[CarsContent] Rendering", { title, has_selected_car: !!selected_car });

  // When a car is selected, show the service content for that car
  if (selected_car && service_content) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {description}
          </p>
        </div>

        {/* Service content for selected car */}
        {service_content}
      </div>
    );
  }

  // When no car is selected, show the car list (overview)
  return (
    <div className="space-y-6">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Cars</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a car to view service history
          </p>
        </div>
        <Link href="/add-plate">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Plate list with selection support */}
      {is_loading ? (
        <PlateListSkeleton />
      ) : (
        <PlateList
          plates={cars}
          selected_plate_id={selected_car?.id}
          on_select={(plate) => select_car(plate as any)}
        />
      )}
    </div>
  );
}
