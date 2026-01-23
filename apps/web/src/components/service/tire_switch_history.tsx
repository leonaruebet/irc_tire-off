"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format_date,
  format_number,
  SERVICE_INTERVALS,
} from "@tireoff/shared";
import { RefreshCw, Calendar, Car, ArrowRight } from "lucide-react";

interface TireSwitchHistoryProps {
  car_id: string;
}

/**
 * Calculate next service date by adding months to a date
 * @param date - Base date
 * @param months - Months to add
 * @returns New date with months added
 */
function add_months(date: Date, months: number): Date {
  console.log("[add_months] Adding months", { date, months });
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Tire switch/rotation history component
 * Shows timeline of tire switches with next service recommendations
 */
export function TireSwitchHistory({ car_id }: TireSwitchHistoryProps) {
  const t = useTranslations("service");
  const t_next = useTranslations("next_service");

  console.log("[TireSwitchHistory] Rendering for car_id:", car_id);

  const { data, isLoading, error } = trpc.service.tire_switches.useQuery({
    car_id,
    page: 1,
    limit: 50,
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

  if (!data?.data.length) {
    console.log("[TireSwitchHistory] No records found");
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t("no_records")}</p>
        </CardContent>
      </Card>
    );
  }

  // Group by visit date
  const grouped = data.data.reduce(
    (acc, record) => {
      const date_key = record.visit_date.toISOString().split("T")[0];
      if (!acc[date_key]) {
        acc[date_key] = {
          date: record.visit_date,
          branch: record.branch_name,
          odometer: record.odometer_km,
          switches: [],
        };
      }
      acc[date_key].switches.push(record);
      return acc;
    },
    {} as Record<
      string,
      {
        date: Date;
        branch: string;
        odometer: number;
        switches: typeof data.data;
      }
    >
  );

  console.log("[TireSwitchHistory] Grouped records:", Object.keys(grouped).length);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date_key, visit]) => {
        // Calculate next service recommendation
        const next_odometer_km = visit.odometer + SERVICE_INTERVALS.TIRE_SWITCH_INTERVAL_KM;
        const next_date = add_months(new Date(visit.date), SERVICE_INTERVALS.TIRE_SWITCH_INTERVAL_MONTHS);

        return (
          <Card key={date_key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <RefreshCw className="h-5 w-5 text-primary" />
                การสลับยาง / ตรวจเช็คสภาพ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Latest tire switch info */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  สลับยางล่าสุด
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>วันที่: {format_date(visit.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>เลขไมล์: {format_number(visit.odometer)} กม.</span>
                  </div>
                </div>
              </div>

              {/* Next service recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  {t_next("title")}
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    <span>เลขไมล์: {format_number(next_odometer_km)} กม.</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>หรือ ภายใน 6 เดือน</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>วันที่: {format_date(next_date)}</span>
                  </div>
                </div>
              </div>

              {/* Recommendation note */}
              <p className="text-xs text-muted-foreground">
                * {t_next("recommendation_note", { km: "10,000", months: "6" })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
