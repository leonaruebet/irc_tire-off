"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TireChangeHistory } from "./tire_change_history";
import { TireSwitchHistory } from "./tire_switch_history";
import { OilChangeHistory } from "./oil_change_history";

interface ServiceTabsProps {
  car_id: string;
  stats: {
    tire_change_count: number;
    tire_switch_count: number;
    oil_change_count: number;
  };
}

/**
 * Service tabs component
 * Tabs for different service history types
 */
export function ServiceTabs({ car_id, stats }: ServiceTabsProps) {
  const t = useTranslations("service");

  return (
    <Tabs defaultValue="tires" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tires" className="text-xs sm:text-sm">
          {t("tire_change")}
          {stats.tire_change_count > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({stats.tire_change_count})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="switches" className="text-xs sm:text-sm">
          {t("tire_switch")}
          {stats.tire_switch_count > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({stats.tire_switch_count})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="oil" className="text-xs sm:text-sm">
          {t("oil_change")}
          {stats.oil_change_count > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({stats.oil_change_count})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tires" className="mt-4">
        <TireChangeHistory car_id={car_id} />
      </TabsContent>

      <TabsContent value="switches" className="mt-4">
        <TireSwitchHistory car_id={car_id} />
      </TabsContent>

      <TabsContent value="oil" className="mt-4">
        <OilChangeHistory car_id={car_id} />
      </TabsContent>
    </Tabs>
  );
}
