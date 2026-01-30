"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format_date, format_number } from "@tireoff/shared";
import { RefreshCw, Calendar, Car, ArrowRight, CheckCircle } from "lucide-react";

interface TireSwitchHistoryProps {
  car_id: string;
}

/**
 * Tire switch/rotation history component
 * Shows timeline of tire switches with next service recommendations
 * IF tires were changed after the last switch, recommendation is hidden
 */
export function TireSwitchHistory({ car_id }: TireSwitchHistoryProps) {
  const t = useTranslations("service");
  const t_next = useTranslations("next_service");

  console.log("[TireSwitchHistory] Rendering for car_id:", car_id);

  // Use tire_status query which has the reset logic
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
              <Skeleton className="h-32 w-full" />
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

  // Find the most recent tire change to display info
  const most_recent_tire_change = data.tires
    .filter((t) => t.has_data && t.install_date)
    .reduce((latest, current) => {
      if (!latest) return current;
      if (!latest.install_date) return current;
      if (!current.install_date) return latest;
      return current.install_date > latest.install_date ? current : latest;
    }, null as typeof data.tires[0] | null);

  // Extract next_tire_switch for type narrowing in JSX
  const next_tire_switch = data.next_tire_switch;

  return (
    <div className="space-y-4">
      {/* Tire switch recommendation card */}
      {next_tire_switch ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <RefreshCw className="h-5 w-5 text-primary" />
              {t_next("tire_switch")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Latest tire switch info */}
            {next_tire_switch && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  {t("last_tire_switch")}
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t("date")}: {format_date(next_tire_switch.last_service_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {t("odometer")}: {format_number(next_tire_switch.last_service_km)} {t("km")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next service recommendation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ArrowRight className="h-4 w-4 text-primary" />
                {t_next("title")}
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-primary" />
                  <span>
                    {t_next("at_km", { km: format_number(next_tire_switch.next_odometer_km) })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {t_next("by_date", { date: format_date(next_tire_switch.next_date) })}
                  </span>
                </div>

                {/* Remaining time/distance */}
                {!next_tire_switch.is_overdue && (
                  <div className="text-sm font-medium text-primary pt-1">
                    {next_tire_switch.use_months
                      ? t_next("in_months", { months: next_tire_switch.months_until })
                      : t_next("in_days", { days: next_tire_switch.days_until })}
                    {" "}
                    {t_next("or")}
                    {" "}
                    {t_next("in_km", { km: format_number(next_tire_switch.km_until) })}
                  </div>
                )}
              </div>

              {/* Recommendation note */}
              <p className="text-xs text-muted-foreground">
                * {t_next("recommendation_note", { km: "10,000", months: "6" })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : most_recent_tire_change ? (
        // Tire switch recommendation is reset due to recent tire change
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t_next("tire_switch")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    {t_next("new_tires_installed")}
                  </p>
                  <p className="text-xs text-green-700">
                    {t_next("tires_recently_changed", {
                      date: most_recent_tire_change.install_date
                        ? format_date(most_recent_tire_change.install_date)
                        : "-",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t_next("reset_after_install")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // No tire data at all
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("no_records")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
