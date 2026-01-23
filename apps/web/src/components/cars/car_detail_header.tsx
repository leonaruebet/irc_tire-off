"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Gauge, Calendar, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format_date, format_odometer, APP_ROUTES } from "@tireoff/shared";

interface CarDetailHeaderProps {
  car: {
    id: string;
    license_plate: string;
    car_model: string | null;
    stats: {
      total_visits: number;
      tire_change_count: number;
      tire_switch_count: number;
      oil_change_count: number;
      last_tire_change: Date | null;
      last_oil_change: Date | null;
      last_odometer: number | null;
    };
  };
}

/**
 * Car detail header component
 * Shows car info and stats summary
 */
export function CarDetailHeader({ car }: CarDetailHeaderProps) {
  const t = useTranslations("car");
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(APP_ROUTES.CARS)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{car.license_plate}</h1>
            {car.car_model && (
              <p className="text-sm text-muted-foreground">{car.car_model}</p>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 pt-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem
                icon={<Wrench className="h-4 w-4" />}
                label="Total Visits"
                value={car.stats.total_visits.toString()}
              />
              <StatItem
                icon={<Gauge className="h-4 w-4" />}
                label="Last Odometer"
                value={
                  car.stats.last_odometer
                    ? format_odometer(car.stats.last_odometer)
                    : "-"
                }
              />
              <StatItem
                icon={<Calendar className="h-4 w-4" />}
                label={t("last_tire_change")}
                value={
                  car.stats.last_tire_change
                    ? format_date(car.stats.last_tire_change)
                    : "-"
                }
              />
              <StatItem
                icon={<Calendar className="h-4 w-4" />}
                label={t("last_oil_change")}
                value={
                  car.stats.last_oil_change
                    ? format_date(car.stats.last_oil_change)
                    : "-"
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
