"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format_date,
  format_odometer,
  format_currency,
  format_production_week,
  type TireUsageStatus,
} from "@tireoff/shared";
import { ChevronDown, ChevronUp, CircleDot, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TireData {
  brand: string | null;
  tire_model: string | null;
  tire_size: string | null;
  production_week: string | null;
  price_per_tire: number | null;
}

interface TireUsageInfo {
  usage_percent: number;
  status: TireUsageStatus;
  distance_traveled_km: number;
  remaining_km: number;
  days_since_install: number;
}

interface TireStatusCardProps {
  position: string;
  has_data: boolean;
  tire?: TireData;
  install_date?: Date;
  install_odometer_km?: number;
  branch_name?: string;
  usage?: TireUsageInfo;
}

/**
 * Get position translation key from position code
 *
 * @param position - Position code (FL, FR, RL, RR, SP)
 * @returns Translation key
 */
function get_position_key(position: string): string {
  const map: Record<string, string> = {
    FL: "position_fl",
    FR: "position_fr",
    RL: "position_rl",
    RR: "position_rr",
    SP: "position_sp",
  };
  return map[position] || position;
}

/**
 * Get status color classes based on tire usage status
 *
 * @param status - Tire usage status
 * @returns Tailwind CSS classes
 */
function get_status_classes(status: TireUsageStatus): {
  bg: string;
  text: string;
  progress: string;
  icon: typeof CheckCircle;
} {
  switch (status) {
    case "good":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        progress: "bg-green-500",
        icon: CheckCircle,
      };
    case "warning":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        progress: "bg-yellow-500",
        icon: AlertTriangle,
      };
    case "critical":
      return {
        bg: "bg-orange-50",
        text: "text-orange-700",
        progress: "bg-orange-500",
        icon: AlertTriangle,
      };
    case "overdue":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        progress: "bg-red-500",
        icon: XCircle,
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        progress: "bg-gray-500",
        icon: CircleDot,
      };
  }
}

/**
 * Tire status card component with collapsible details
 * Shows tire position, usage %, and expandable details
 */
export function TireStatusCard({
  position,
  has_data,
  tire,
  install_date,
  install_odometer_km,
  branch_name,
  usage,
}: TireStatusCardProps) {
  const [is_expanded, set_is_expanded] = useState(false);
  const t = useTranslations("tire");

  console.log("[TireStatusCard] Render", { position, has_data });

  if (!has_data) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t(get_position_key(position))}</span>
            <span className="text-sm text-muted-foreground">{t("no_tire_data")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status_classes = usage ? get_status_classes(usage.status) : get_status_classes("good");
  const StatusIcon = status_classes.icon;

  return (
    <Card className={cn("transition-colors", status_classes.bg)}>
      <CardContent className="p-4">
        {/* Summary row - always visible */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", status_classes.text)} />
            <span className="font-medium">{t(get_position_key(position))}</span>
          </div>
          <div className="flex items-center gap-2">
            {usage && (
              <span className={cn("text-sm font-medium", status_classes.text)}>
                {t("usage_percent", { percent: usage.usage_percent })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => set_is_expanded(!is_expanded)}
              aria-label={is_expanded ? t("hide_details") : t("show_details")}
            >
              {is_expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tire model subtitle */}
        {tire?.brand && tire?.tire_model && (
          <p className="text-sm text-muted-foreground mt-1 ml-7">
            {tire.brand} {tire.tire_model}
          </p>
        )}

        {/* Usage progress bar */}
        {usage && (
          <div className="mt-3 ml-7">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", status_classes.progress)}
                style={{ width: `${Math.min(usage.usage_percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{t(`status_${usage.status}`)}</span>
              <span>{t("remaining_km", { km: usage.remaining_km.toLocaleString() })}</span>
            </div>
          </div>
        )}

        {/* Expanded details */}
        {is_expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 ml-7 space-y-2 text-sm">
            {tire?.tire_size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("size")}:</span>
                <span>{tire.tire_size}</span>
              </div>
            )}
            {tire?.production_week && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("production_week")}:</span>
                <span>{format_production_week(tire.production_week)}</span>
              </div>
            )}
            {install_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("installed_date")}:</span>
                <span>{format_date(install_date)}</span>
              </div>
            )}
            {install_odometer_km !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("installed_km")}:</span>
                <span>{format_odometer(install_odometer_km)}</span>
              </div>
            )}
            {tire?.price_per_tire && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("price_per_tire")}:</span>
                <span>{format_currency(tire.price_per_tire)}</span>
              </div>
            )}
            {branch_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("branch")}:</span>
                <span>{branch_name}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
