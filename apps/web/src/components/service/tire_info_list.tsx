"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { format_date, format_number } from "@tireoff/shared";

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

  // Format tire brand and model with production week
  const tire_name_parts = [tire.tire.brand, tire.tire.tire_model].filter(Boolean);
  const tire_name = tire_name_parts.join(" ") || "-";
  const production_info = tire.tire.production_week
    ? ` (${t("production_week")}: ${tire.tire.production_week})`
    : "";

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        {/* Position header */}
        <h3 className="font-semibold text-base uppercase mb-3">{position_label}</h3>

        {/* Tire brand/model with production week */}
        <p className="text-sm font-medium text-foreground mb-2">
          {tire_name}{production_info}
        </p>

        {/* Tire size */}
        {tire.tire.tire_size && (
          <p className="text-sm text-muted-foreground mb-1">
            ขนาดยาง : {tire.tire.tire_size}
          </p>
        )}

        {/* Price per tire */}
        {tire.tire.price_per_tire && (
          <p className="text-sm text-muted-foreground mb-1">
            {t("price_per_tire")}: {format_number(tire.tire.price_per_tire)} บาท
          </p>
        )}

        {/* Install date */}
        {tire.install_date && (
          <p className="text-sm text-muted-foreground mb-1">
            {t("installed_date")}: {format_date(tire.install_date)}
          </p>
        )}

        {/* Install odometer */}
        {tire.install_odometer_km !== undefined && (
          <p className="text-sm text-muted-foreground mb-1">
            {t("installed_km")}: {format_number(tire.install_odometer_km)}
          </p>
        )}

        {/* Branch */}
        {tire.branch_name && (
          <p className="text-sm text-muted-foreground mb-3">
            {t("branch")}: {tire.branch_name}
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
 * Each card displays: position, brand/model, size, install date, odometer
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
