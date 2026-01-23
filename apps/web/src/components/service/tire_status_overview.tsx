"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TireInfoList } from "./tire_info_list";
import { TireStatusVisual } from "./tire_status_visual";
import { User, Phone } from "lucide-react";

interface TireStatusOverviewProps {
  car_id: string;
  /** Optional current odometer reading for more accurate calculations */
  current_odometer_km?: number;
  /** Optional customer name to display */
  customer_name?: string;
  /** Optional customer phone to display */
  customer_phone?: string;
}

/**
 * Tire status overview component
 * Shows tire status per position with usage % and next service recommendations
 * Matches the Excel mockup layout
 */
export function TireStatusOverview({
  car_id,
  current_odometer_km,
  customer_name,
  customer_phone,
}: TireStatusOverviewProps) {
  const { data, isLoading, error } = trpc.service.tire_status.useQuery({
    car_id,
    current_odometer_km,
  });

  console.log("[TireStatusOverview] Render", { car_id, isLoading, has_data: !!data });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Car visual skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-[280px] w-[160px] rounded-lg" />
        </div>
        {/* Tire list skeleton - 4 cards */}
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
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

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Customer info header (if provided) */}
      {(customer_name || customer_phone) && (
        <div className="space-y-1">
          {customer_name && (
            <div className="flex items-center gap-2 text-lg font-medium">
              <User className="h-5 w-5 text-muted-foreground" />
              {customer_name}
            </div>
          )}
          {customer_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {customer_phone}
            </div>
          )}
        </div>
      )}

      {/* Car visual with tire positions */}
      <TireStatusVisual
        tires={data.tires.map((tire) => ({
          position: tire.position,
          has_data: tire.has_data,
          tire: tire.has_data ? tire.tire : undefined,
          install_date: tire.has_data ? tire.install_date : undefined,
          install_odometer_km: tire.has_data ? tire.install_odometer_km : undefined,
          branch_name: tire.has_data ? tire.branch_name : undefined,
          usage: tire.has_data && tire.usage ? {
            usage_percent: tire.usage.usage_percent,
            status: tire.usage.status,
            distance_traveled_km: tire.usage.distance_traveled_km,
            remaining_km: tire.usage.remaining_km,
            days_since_install: tire.usage.days_since_install,
          } : undefined,
        }))}
      />

      {/* Tire info list - vertical cards for each position */}
      <TireInfoList
        tires={data.tires.map((tire) => ({
          position: tire.position,
          has_data: tire.has_data,
          tire: tire.has_data ? tire.tire : undefined,
          install_date: tire.has_data ? tire.install_date : undefined,
          install_odometer_km: tire.has_data ? tire.install_odometer_km : undefined,
          branch_name: tire.has_data ? tire.branch_name : undefined,
        }))}
        on_view_details={(position) => {
          console.log("[TireStatusOverview] View details clicked", { position });
          // TODO: Navigate to tire detail page or show modal
        }}
      />
    </div>
  );
}
