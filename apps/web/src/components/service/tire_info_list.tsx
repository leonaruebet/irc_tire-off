"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

/**
 * Tire data interface for display
 */
interface TireData {
  brand: string | null;
  tire_model: string | null;
  tire_size: string | null;
  production_week: string | null;
  price_per_tire: number | null;
}

/**
 * Single tire info for the list display
 */
interface TireInfo {
  position: string;
  has_data: boolean;
  tire?: TireData;
  install_date?: Date;
  install_odometer_km?: number;
  branch_name?: string;
}

interface TireInfoListProps {
  /** Array of 4 tire infos (FL, FR, RL, RR) */
  tires: TireInfo[];
  /** Callback when view details is clicked */
  on_view_details?: (position: string) => void;
}

/**
 * Get full position name with code
 *
 * @param position - Position code (FL, FR, RL, RR)
 * @param t - Translation function
 * @returns Formatted position string e.g. "หน้าซ้าย (FL)"
 */
function get_position_label(position: string, t: (key: string) => string): string {
  console.log("[get_position_label] Formatting position", { position });
  const position_map: Record<string, string> = {
    FL: "position_fl",
    FR: "position_fr",
    RL: "position_rl",
    RR: "position_rr",
    SP: "position_sp",
  };
  const key = position_map[position] || position;
  return `${t(key)} (${position})`;
}

/**
 * Individual tire info card component
 * Shows position header, tire size, and view details button
 * All other details (brand, price, install date, odometer, branch) are shown in the detail dialog
 *
 * @param props - Tire info data
 * @returns Styled tire info card
 */
function TireInfoCard({
  tire,
  on_view_details
}: {
  tire: TireInfo;
  on_view_details?: (position: string) => void;
}) {
  const t = useTranslations("tire");
  console.log("[TireInfoCard] Rendering", { position: tire.position, has_data: tire.has_data });

  const position_label = get_position_label(tire.position, t);

  // No data state
  if (!tire.has_data || !tire.tire) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-base uppercase mb-2">{position_label}</h3>
          <p className="text-sm text-muted-foreground">{t("no_tire_data")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        {/* Position header */}
        <h3 className="font-semibold text-base uppercase mb-3">{position_label}</h3>

        {/* Tire size - only show this on the card */}
        {tire.tire.tire_size && (
          <p className="text-sm text-muted-foreground mb-3">
            ขนาดยาง : {tire.tire.tire_size}
          </p>
        )}

        {/* View details button */}
        <Button
          variant="ghost"
          size="sm"
          className="px-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent"
          onClick={() => on_view_details?.(tire.position)}
        >
          [ {t("show_details")} ]
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Tire info list component
 * Shows all 4 tire positions in a vertical list format
 * Each card displays: position, tire size
 * All other details are shown in the detail dialog when clicking "ดูรายละเอียด"
 *
 * @param props - Array of tire infos and callback handlers
 * @returns Vertical list of tire info cards
 */
export function TireInfoList({ tires, on_view_details }: TireInfoListProps) {
  console.log("[TireInfoList] Rendering with tires", { count: tires.length });

  // Order: FL, FR, RL, RR
  const position_order = ["FL", "FR", "RL", "RR"];

  // Sort tires by position order
  const sorted_tires = position_order.map((pos) => {
    const found = tires.find((t) => t.position === pos);
    return found || { position: pos, has_data: false };
  });

  return (
    <div className="space-y-3">
      {sorted_tires.map((tire) => (
        <TireInfoCard
          key={tire.position}
          tire={tire}
          on_view_details={on_view_details}
        />
      ))}
    </div>
  );
}
