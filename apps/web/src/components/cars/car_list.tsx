"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Car, Calendar, Gauge } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format_date, format_odometer, APP_ROUTES } from "@tireoff/shared";

interface CarData {
  id: string;
  license_plate: string;
  car_model: string | null;
  created_at: Date;
  last_service: {
    date: Date;
    branch: string;
    odometer_km: number;
  } | null;
  has_tire_changes: boolean;
  has_oil_changes: boolean;
}

interface CarListProps {
  cars: CarData[];
}

/**
 * Car list component
 * Displays all user's cars with service summary
 */
export function CarList({ cars }: CarListProps) {
  const t = useTranslations("car");

  if (cars.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Car className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t("no_cars")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("add_first_car")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {cars.map((car) => (
        <Link key={car.id} href={APP_ROUTES.CAR_DETAIL(car.id)}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{car.license_plate}</CardTitle>
                  {car.car_model && (
                    <CardDescription>{car.car_model}</CardDescription>
                  )}
                </div>
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {car.last_service ? (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{format_date(car.last_service.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-4 w-4" />
                    <span>{format_odometer(car.last_service.odometer_km)}</span>
                  </div>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                    {car.last_service.branch}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("no_records")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
