"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  Droplets,
  RefreshCw,
  MapPin,
  Gauge,
  Calendar,
} from "lucide-react";

/**
 * Format date to Thai locale
 * @param date - Date to format
 * @returns Formatted date string
 */
function format_date(date: Date | string): string {
  console.log("[HistoryList] Formatting date", { date });
  const d = new Date(date);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format number with comma separators
 * @param num - Number to format
 * @returns Formatted string
 */
function format_number(num: number): string {
  return num.toLocaleString("th-TH");
}

interface HistoryEntryDetails {
  position?: string;
  brand?: string;
  tire_model?: string;
  from_position?: string | null;
  to_position?: string | null;
  notes?: string | null;
  oil_model?: string;
  viscosity?: string;
}

interface HistoryEntry {
  id: string;
  type: "tire_change" | "tire_switch" | "oil_change";
  visit_date: Date;
  license_plate: string;
  car_model: string | null;
  car_id: string;
  branch_name: string;
  odometer_km: number;
  details: HistoryEntryDetails;
}

/**
 * Get icon and color for service type
 * @param type - Service type
 * @returns Icon component and color class
 */
function get_type_config(type: HistoryEntry["type"]): {
  icon: React.ReactNode;
  bg_class: string;
  text_class: string;
} {
  switch (type) {
    case "tire_change":
      return {
        icon: <Car className="h-4 w-4" />,
        bg_class: "bg-blue-100",
        text_class: "text-blue-700",
      };
    case "tire_switch":
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        bg_class: "bg-green-100",
        text_class: "text-green-700",
      };
    case "oil_change":
      return {
        icon: <Droplets className="h-4 w-4" />,
        bg_class: "bg-amber-100",
        text_class: "text-amber-700",
      };
  }
}

/**
 * History list component showing all service logs
 * @returns History list component
 */
export function HistoryList() {
  console.log("[HistoryList] Rendering");

  const t = useTranslations("history");
  const t_tire = useTranslations("tire");

  const { data, isLoading, error } = trpc.service.all_history.useQuery(
    { page: 1, limit: 50 },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );

  if (isLoading) {
    return <HistoryListSkeleton />;
  }

  if (error) {
    console.error("[HistoryList] Error loading history", error);
    return (
      <div className="text-center py-8 text-muted-foreground">
        {error.message}
      </div>
    );
  }

  const entries = (data?.data ?? []) as HistoryEntry[];

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t("no_records")}</p>
      </div>
    );
  }

  console.log("[HistoryList] Rendering entries", { count: entries.length });

  return (
    <div className="space-y-3">
      {entries.map((entry: HistoryEntry): React.ReactNode => {
        const config = get_type_config(entry.type);
        const type_label =
          entry.type === "tire_change"
            ? t("tire_change")
            : entry.type === "tire_switch"
              ? t("tire_switch")
              : t("oil_change");

        return (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header: Type badge + License Plate */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg_class} ${config.text_class}`}
                  >
                    {config.icon}
                    {type_label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {entry.license_plate}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format_date(entry.visit_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>
                    {format_number(entry.odometer_km)} {t("km")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{entry.branch_name}</span>
                </div>
              </div>

              {/* Service-specific details */}
              {entry.type === "tire_change" && entry.details.position && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">
                    {t("positions")}:{" "}
                  </span>
                  <span className="font-medium">
                    {t_tire(`position_${entry.details.position.toLowerCase()}`)}
                  </span>
                  {entry.details.brand && (
                    <span className="text-muted-foreground ml-2">
                      • {entry.details.brand} {entry.details.tire_model}
                    </span>
                  )}
                </div>
              )}

              {entry.type === "tire_switch" && (
                <div className="mt-3 pt-3 border-t text-sm">
                  {entry.details.from_position && entry.details.to_position ? (
                    <>
                      <span className="text-muted-foreground">
                        {t_tire(`position_${entry.details.from_position.toLowerCase()}`)}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">
                        {t_tire(`position_${entry.details.to_position.toLowerCase()}`)}
                      </span>
                    </>
                  ) : entry.details.notes ? (
                    <span className="text-muted-foreground">{entry.details.notes}</span>
                  ) : null}
                </div>
              )}

              {entry.type === "oil_change" && entry.details.oil_model && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="font-medium">
                    {entry.details.oil_model}
                  </span>
                  {entry.details.viscosity && (
                    <span className="text-muted-foreground ml-2">
                      • {entry.details.viscosity}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Skeleton loader for history list
 * @returns Skeleton component
 */
function HistoryListSkeleton() {
  console.log("[HistoryListSkeleton] Rendering");

  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 col-span-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
