"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format_date, format_number } from "@tireoff/shared";
import { Droplets, ChevronDown, ChevronUp } from "lucide-react";

interface OilChangeHistoryProps {
  car_id: string;
}

/**
 * Get oil type display key based on raw oil type value
 * @param oil_type - Raw oil type from database
 * @returns Translation key for oil type
 */
function get_oil_type_key(oil_type: string | null): string {
  console.log("[get_oil_type_key] Processing oil_type:", oil_type);
  if (!oil_type) return "type_conventional";

  const type_lower = oil_type.toLowerCase();
  if (
    type_lower.includes("สังเคราะห์แท้") ||
    type_lower.includes("synthetic") ||
    type_lower === "สังเคราะห์"
  ) {
    return "type_synthetic";
  }
  if (
    type_lower.includes("กึ่งสังเคราะห์") ||
    type_lower.includes("semi")
  ) {
    return "type_semi_synthetic";
  }
  return "type_conventional";
}

/**
 * Get default interval km based on oil type
 * @param oil_type - Raw oil type from database
 * @returns Interval in km
 */
function get_default_interval_km(oil_type: string | null): number {
  console.log("[get_default_interval_km] Processing oil_type:", oil_type);
  if (!oil_type) return 5000;

  const type_lower = oil_type.toLowerCase();
  if (
    type_lower.includes("สังเคราะห์แท้") ||
    type_lower.includes("synthetic") ||
    type_lower === "สังเคราะห์"
  ) {
    return 10000;
  }
  if (
    type_lower.includes("กึ่งสังเคราะห์") ||
    type_lower.includes("semi")
  ) {
    return 7000;
  }
  return 5000;
}

/**
 * Calculate next service date (6 months from last service)
 * @param last_date - Last service date
 * @returns Next recommended service date
 */
function calculate_next_date(last_date: Date): Date {
  console.log("[calculate_next_date] Processing last_date:", last_date);
  const next = new Date(last_date);
  next.setMonth(next.getMonth() + 6);
  return next;
}

/**
 * Oil change history component
 * Shows latest oil change status with next service recommendation
 * Displays in new layout format matching design spec
 */
export function OilChangeHistory({ car_id }: OilChangeHistoryProps) {
  const t = useTranslations("oil");
  const [show_details, set_show_details] = useState(false);

  const { data, isLoading, error } = trpc.service.oil_changes.useQuery({
    car_id,
    page: 1,
    limit: 1, // Only need the latest record
  });

  console.log("[OilChangeHistory] Render", { car_id, has_data: !!data });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-destructive">
          {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!data?.data.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Droplets className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t("no_data")}</p>
        </CardContent>
      </Card>
    );
  }

  const latest_oil = data.data[0];
  const oil_type_key = get_oil_type_key(latest_oil.oil_type);
  const interval_km = latest_oil.interval_km ?? get_default_interval_km(latest_oil.oil_type);
  const next_odometer_km = latest_oil.odometer_km + interval_km;
  const next_date = calculate_next_date(latest_oil.visit_date);

  // Build title: Brand + (Viscosity)
  const title_parts: string[] = [];
  if (latest_oil.oil_model) title_parts.push(latest_oil.oil_model);
  const title = title_parts.length > 0
    ? `${title_parts.join(" ")}${latest_oil.viscosity ? ` (${latest_oil.viscosity})` : ""}`
    : t("title");

  console.log("[OilChangeHistory] Rendering oil details", {
    title,
    oil_type_key,
    interval_km,
    next_odometer_km,
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main Content Section */}
        <div className="p-4 space-y-3">
          {/* Title: Brand + (Viscosity) */}
          <h2 className="text-xl font-bold text-foreground">
            {title}
          </h2>

          {/* Oil Type */}
          <p className="text-muted-foreground">
            {t("oil_type")}: {t(oil_type_key)}
          </p>

          {/* Last Changed Date */}
          <p className="text-foreground">
            {t("last_change")} : {format_date(latest_oil.visit_date)}
          </p>

          {/* Odometer at Change */}
          <p className="text-foreground">
            {t("odometer")}: {format_number(latest_oil.odometer_km)} {t("km")}
          </p>
        </div>

        {/* Next Service Recommendation Section (Orange) */}
        <div className="px-4 py-3 space-y-2">
          <h3 className="text-orange-500 font-semibold">
            {t("next_service")}
          </h3>
          <p className="text-foreground">
            {t("approx")} {format_number(next_odometer_km)} {t("km")} {t("or")} {format_date(next_date)}
          </p>
          <p className="text-sm text-muted-foreground">
            *{t("recommendation_note", { km: format_number(interval_km) })}
          </p>
        </div>

        {/* Collapsible Details Section */}
        <div className="border-t">
          <button
            onClick={() => set_show_details(!show_details)}
            className="w-full px-4 py-3 flex items-center justify-between text-orange-500 hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">[ {t("view_details")} ]</span>
            {show_details ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>

          {show_details && (
            <div className="px-4 pb-4 space-y-2 text-muted-foreground">
              {/* Brand/Model */}
              {latest_oil.oil_model && (
                <p>
                  {t("brand_model")} : {latest_oil.oil_model}
                </p>
              )}

              {/* Viscosity */}
              {latest_oil.viscosity && (
                <p>
                  {t("viscosity")} : {latest_oil.viscosity}
                </p>
              )}

              {/* Engine Type */}
              {latest_oil.engine_type && (
                <p>
                  {t("engine_type")}: {latest_oil.engine_type}
                </p>
              )}

              {/* Change Interval */}
              <p>
                {t("change_interval")}: {format_number(interval_km)} {t("km")}
              </p>

              {/* Price */}
              {latest_oil.price && (
                <p>
                  {t("price")}: {format_number(latest_oil.price)} บาท
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
