"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format_date, format_number } from "@tireoff/shared";
import { RefreshCw, Droplets, AlertCircle, Calendar, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface NextServiceData {
  last_service_date: Date;
  last_service_km: number;
  next_odometer_km: number;
  next_date: Date;
  is_overdue: boolean;
  days_until: number;
  km_until: number;
  months_until: number;
  use_months: boolean;
}

interface NextTireSwitchData extends NextServiceData {}

interface NextOilChangeData extends NextServiceData {
  oil_model: string | null;
  oil_type: string | null;
  viscosity: string | null;
  interval_km: number;
}

interface NextServiceCardProps {
  type: "tire_switch" | "oil_change";
  data: NextTireSwitchData | NextOilChangeData | null;
}

/**
 * Next service recommendation card
 * Shows when the next tire switch or oil change is recommended
 */
export function NextServiceCard({ type, data }: NextServiceCardProps) {
  const t = useTranslations("next_service");

  console.log("[NextServiceCard] Render", { type, has_data: !!data });

  if (!data) {
    return null;
  }

  const Icon = type === "tire_switch" ? RefreshCw : Droplets;
  const title = type === "tire_switch" ? t("tire_switch") : t("oil_change");

  return (
    <Card className={cn(data.is_overdue ? "border-red-200 bg-red-50" : "")}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" />
          {title}
          {data.is_overdue && (
            <span className="ml-auto flex items-center gap-1 text-sm font-normal text-red-600">
              <AlertCircle className="h-4 w-4" />
              {t("overdue")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Last service info */}
        <div className="text-sm text-muted-foreground">
          <span>{t("last_service")}: </span>
          <span>{format_date(data.last_service_date)}</span>
          <span className="mx-1">•</span>
          <span>{format_number(data.last_service_km)} km</span>
        </div>

        {/* Oil details if oil change */}
        {type === "oil_change" && "oil_model" in data && data.oil_model && (
          <div className="text-sm">
            <span className="font-medium">{data.oil_model}</span>
            {data.viscosity && <span className="text-muted-foreground"> ({data.viscosity})</span>}
          </div>
        )}

        {/* Next service recommendation */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span>
              {t("at_km", { km: format_number(data.next_odometer_km) })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {t("by_date", { date: format_date(data.next_date) })}
            </span>
          </div>

          {/* Remaining time/distance */}
          {!data.is_overdue && (
            <div className="text-sm font-medium text-primary pt-1">
              {data.use_months
                ? t("in_months", { months: data.months_until })
                : t("in_days", { days: data.days_until })}
              {" "}
              {t("or")}
              {" "}
              {t("in_km", { km: format_number(data.km_until) })}
            </div>
          )}
        </div>

        {/* Recommendation note */}
        {type === "tire_switch" && (
          <p className="text-xs text-muted-foreground">
            * {t("recommendation_note", { km: "10,000", months: "6" })}
          </p>
        )}
        {type === "oil_change" && "interval_km" in data && (
          <p className="text-xs text-muted-foreground">
            * {t("recommendation_note", { km: format_number(data.interval_km), months: "6" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
