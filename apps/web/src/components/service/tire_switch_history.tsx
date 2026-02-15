"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format_date, format_number } from "@tireoff/shared";
import {
  RefreshCw,
  Calendar,
  Car,
  ArrowRight,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TireSwitchHistoryProps {
  car_id: string;
}

/**
 * Map position code (FL/FR/RL/RR) to i18n key under the "tire" namespace.
 *
 * @param position - Position code
 * @returns Translation key string
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
 * Tire switch/rotation history component.
 *
 * Per-tire tracking: each position is tracked independently and displayed
 * separately with its own base date, next service recommendation, and
 * overdue status.
 *
 * Layout:
 *   1. Latest switch info card (actual switch date/km, or "-" if none)
 *   2. Per-tire cards — each position shows base, next service, remaining
 *   3. Overall next switch recommendation (based on oldest/most-overdue tire)
 *   4. Empty state when no tire data
 *
 * @param car_id - The car ID to show tire switch history for
 */
export function TireSwitchHistory({ car_id }: TireSwitchHistoryProps) {
  const t = useTranslations("service");
  const t_next = useTranslations("next_service");
  const t_tire = useTranslations("tire");

  console.log("[TireSwitchHistory] Rendering for car_id:", car_id);

  const { data, isLoading, error } = trpc.service.tire_status.useQuery({
    car_id,
  });

  if (isLoading) {
    console.log("[TireSwitchHistory] Loading state");
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.log("[TireSwitchHistory] Error state:", error.message);
    return (
      <Card>
        <CardContent className="p-4 text-center text-destructive">
          {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const per_tire = data.per_tire_switch ?? [];
  const next_tire_switch = data.next_tire_switch;
  const has_switch_history = !!data.latest_switch_date;

  console.log("[TireSwitchHistory] Display state", {
    has_next_tire_switch: !!next_tire_switch,
    has_switch_history,
    per_tire_count: per_tire.length,
  });

  // No tire data at all → empty state
  if (per_tire.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("no_records")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Latest tire switch info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <RefreshCw className="h-5 w-5 text-primary" />
            {t("last_tire_switch")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {t("date")}:{" "}
                {has_switch_history
                  ? format_date(data.latest_switch_date!)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>
                {t("odometer")}:{" "}
                {has_switch_history
                  ? `${format_number(data.latest_switch_km!)} ${t("km")}`
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-tire switch status cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CircleDot className="h-5 w-5 text-primary" />
            {t_next("per_tire_status")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {per_tire.map((tire) => {
            const is_overdue = tire.is_overdue;
            const source_label =
              tire.source === "tire_switch"
                ? t_next("base_tire_switch")
                : t_next("base_tire_change");

            return (
              <div
                key={tire.position}
                className={cn(
                  "rounded-lg border p-3 space-y-2",
                  is_overdue
                    ? "border-red-200 bg-red-50"
                    : "border-border bg-background"
                )}
              >
                {/* Position + source label */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {t_tire(get_position_key(tire.position))}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      tire.source === "tire_switch"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {source_label}
                  </span>
                </div>

                {/* Base date/km */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format_date(tire.base_date)}</span>
                  <span className="text-muted-foreground/50">|</span>
                  <Car className="h-3 w-3" />
                  <span>{format_number(tire.base_km)} {t("km")}</span>
                </div>

                {/* Next service + remaining */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {t_next("next_switch_at", {
                        km: format_number(tire.next_odometer_km),
                        date: format_date(tire.next_date),
                      })}
                    </span>
                  </div>
                  {is_overdue ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t_next("overdue")}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-primary">
                      {tire.use_months
                        ? t_next("in_months", { months: tire.months_until })
                        : t_next("in_days", { days: tire.days_until })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Overall next switch recommendation (from oldest/most-overdue tire) */}
      {next_tire_switch && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ArrowRight className="h-5 w-5 text-primary" />
              {t_next("title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-primary" />
                <span>
                  {t_next("at_km", {
                    km: format_number(next_tire_switch.next_odometer_km),
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {t_next("by_date", {
                    date: format_date(next_tire_switch.next_date),
                  })}
                </span>
              </div>

              {!next_tire_switch.is_overdue && (
                <div className="text-sm font-medium text-primary pt-1">
                  {next_tire_switch.use_months
                    ? t_next("in_months", {
                        months: next_tire_switch.months_until,
                      })
                    : t_next("in_days", {
                        days: next_tire_switch.days_until,
                      })}{" "}
                  {t_next("or")}{" "}
                  {t_next("in_km", {
                    km: format_number(next_tire_switch.km_until),
                  })}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              * {t_next("recommendation_note", { km: "10,000", months: "6" })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
