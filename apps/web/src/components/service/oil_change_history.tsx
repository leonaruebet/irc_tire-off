"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format_date, format_number } from "@tireoff/shared";
import { Droplets, Calendar, Gauge, ArrowRight } from "lucide-react";

interface OilChangeHistoryProps {
  car_id: string;
}

/**
 * Get oil type display key based on raw oil type value
 * @param oil_type - Raw oil type from database
 * @returns Translation key for oil type
 */
function get_oil_type_key(oil_type: string | null): string {
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
  const next = new Date(last_date);
  next.setMonth(next.getMonth() + 6);
  return next;
}

/**
 * Oil change history component
 * Shows latest oil change status with next service recommendation
 */
export function OilChangeHistory({ car_id }: OilChangeHistoryProps) {
  const t = useTranslations("oil");

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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-amber-50 px-4 py-3 flex items-center gap-3 border-b">
          <div className="p-2 bg-amber-100 rounded-full">
            <Droplets className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 uppercase">{t("title")}</h3>
            <p className="text-sm text-amber-700">{t(oil_type_key)}</p>
          </div>
        </div>

        {/* Last service info */}
        <div className="p-4 space-y-3">
          {/* Oil model & viscosity */}
          {(latest_oil.oil_model || latest_oil.viscosity) && (
            <div className="text-sm font-medium text-foreground">
              {latest_oil.oil_model}
              {latest_oil.viscosity && (
                <span className="text-muted-foreground ml-1">
                  ({latest_oil.viscosity})
                </span>
              )}
            </div>
          )}

          {/* Engine type */}
          {latest_oil.engine_type && (
            <div className="text-sm text-muted-foreground">
              {t("engine_type")}: {latest_oil.engine_type}
            </div>
          )}

          {/* Last change date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("last_change")}:</span>
            <span className="font-medium">{format_date(latest_oil.visit_date)}</span>
          </div>

          {/* Odometer at change */}
          <div className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("odometer")}:</span>
            <span className="font-medium">{format_number(latest_oil.odometer_km)} {t("km")}</span>
          </div>

          {/* Price */}
          {latest_oil.price && (
            <div className="text-sm text-muted-foreground">
              {t("price")}: {format_number(latest_oil.price)} บาท
            </div>
          )}
        </div>

        {/* Next service recommendation */}
        <div className="bg-muted/50 p-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
            <ArrowRight className="h-4 w-4" />
            {t("next_service")}
          </div>
          <div className="text-sm text-muted-foreground">
            <span>{t("approx")}: </span>
            <span className="font-medium text-foreground">
              {format_number(next_odometer_km)} {t("km")}
            </span>
            <span className="mx-1">{t("or")}</span>
            <span className="font-medium text-foreground">
              {format_date(next_date)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * แนะนำตรวจเช็คทุก {format_number(interval_km)} {t("km")} หรือ 6 เดือน
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
