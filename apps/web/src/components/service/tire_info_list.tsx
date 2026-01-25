"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Gauge } from "lucide-react";
import { format_days_as_duration } from "@tireoff/shared";

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
 * Get English position name for clear display
 *
 * @param position - Position code (FL, FR, RL, RR)
 * @returns English position string e.g. "FRONT LEFT"
 */
function get_english_position(position: string): string {
  const position_map: Record<string, string> = {
    FL: "FRONT LEFT",
    FR: "FRONT RIGHT",
    RL: "REAR LEFT",
    RR: "REAR RIGHT",
    SP: "SPARE",
  };
  return position_map[position] || position;
}

/**
 * Get Thai position name
 *
 * @param position - Position code (FL, FR, RL, RR)
 * @param t - Translation function
 * @returns Thai position string e.g. "หน้าซ้าย"
 */
function get_thai_position(position: string, t: (key: string) => string): string {
  console.log("[get_thai_position] Formatting position", { position });
  const position_map: Record<string, string> = {
    FL: "position_fl",
    FR: "position_fr",
    RL: "position_rl",
    RR: "position_rr",
    SP: "position_sp",
  };
  const key = position_map[position] || position;
  return t(key);
}

/**
 * Individual tire info card component
 * Shows position header, tire size, last changed date, odometer, and view details button
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
  const locale = useLocale();
  console.log("[TireInfoCard] Rendering", { position: tire.position, has_data: tire.has_data });

  const english_position = get_english_position(tire.position);
  const thai_position = get_thai_position(tire.position, t);

  /**
   * Format date in Thai Buddhist calendar format
   * @param date - Date to format
   * @returns Formatted date string (e.g., "25 มกราคม 2567")
   */
  function format_thai_date(date: Date): string {
    const d = new Date(date);
    const thai_locale = locale === "th" ? "th-TH-u-ca-buddhist" : "en-US";
    return d.toLocaleDateString(thai_locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /**
   * Calculate days since tire change
   * @param date - Tire change date
   * @returns Number of days since tire change
   */
  function get_days_since(date: Date): number {
    const now = new Date();
    const change_date = new Date(date);
    const diff_ms = now.getTime() - change_date.getTime();
    return Math.floor(diff_ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Format odometer with thousands separator
   * @param km - Odometer value
   * @returns Formatted odometer string (e.g., "22,773")
   */
  function format_odometer(km: number): string {
    return km.toLocaleString();
  }

  // No data state
  if (!tire.has_data || !tire.tire) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          {/* Position header with English and Thai */}
          <div className="mb-2">
            <h3 className="font-bold text-base text-primary">{english_position}</h3>
            <p className="text-xs text-muted-foreground">{thai_position}</p>
          </div>
          <p className="text-sm text-muted-foreground">{t("no_tire_data")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        {/* Position header with English and Thai */}
        <div className="mb-3">
          <h3 className="font-bold text-base text-primary">{english_position}</h3>
          <p className="text-xs text-muted-foreground">{thai_position}</p>
        </div>

        {/* Tire size */}
        {tire.tire.tire_size && (
          <p className="text-sm text-muted-foreground mb-1">
            ขนาดยาง : {tire.tire.tire_size}
          </p>
        )}

        {/* Last changed date with duration */}
        {tire.install_date && (
          <p className="text-sm text-muted-foreground mb-1">
            {t("last_changed")} : {format_thai_date(tire.install_date)}{" "}
            <span className="text-muted-foreground/70">
              ({locale === "th"
                ? `${t("time_ago")} ${format_days_as_duration(get_days_since(tire.install_date), "th")}`
                : `${format_days_as_duration(get_days_since(tire.install_date), "en")} ${t("time_ago")}`
              })
            </span>
          </p>
        )}

        {/* Odometer */}
        {tire.install_odometer_km && (
          <p className="text-sm text-muted-foreground mb-3">
            {t("installed_km")} : {format_odometer(tire.install_odometer_km)} {locale === "th" ? "กม." : "km"}
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
