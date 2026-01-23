"use client";

import { ReactNode } from "react";
import { ServiceTabs } from "@/components/layout/service_tabs";
import { BottomNavigation } from "@/components/layout/bottom_navigation";
import { CarsProvider, useCars } from "./cars_provider";
import { SelectedCarHeader } from "./selected_car_header";

interface CarsLayoutClientProps {
  children: ReactNode;
}

/**
 * Client-side cars layout with clean design
 * Provides shared state via CarsProvider
 * @param props - Children pages
 * @returns Layout with provider
 */
export function CarsLayoutClient({ children }: CarsLayoutClientProps) {
  console.log("[CarsLayoutClient] Rendering");

  return (
    <CarsProvider>
      <CarsLayoutInner>{children}</CarsLayoutInner>
    </CarsProvider>
  );
}

/**
 * Inner layout component that uses CarsProvider context
 * Shows ServiceTabs only when a car is selected
 * @param props - Children pages
 * @returns Layout content
 */
function CarsLayoutInner({ children }: { children: ReactNode }) {
  const { selected_car } = useCars();
  console.log("[CarsLayoutInner] Rendering", { has_selected_car: !!selected_car });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Selected Car Header (only when car is selected) */}
      {selected_car && <SelectedCarHeader car={selected_car} />}

      {/* Service Tabs (only when car is selected) */}
      {selected_car && <ServiceTabs />}

      {/* Main Content - padding-top for fixed headers, padding-bottom for bottom nav */}
      {/* When car selected: SelectedCarHeader (~4rem) + ServiceTabs (~4rem) = 8rem top offset */}
      <main className={`flex-1 px-4 pb-24 ${selected_car ? "pt-[8.5rem]" : "py-4"}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
