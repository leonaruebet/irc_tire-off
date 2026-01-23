"use client";

import { ServiceTabs } from "./service_tabs";
import { BottomNavigation } from "./bottom_navigation";

interface UserLayoutProps {
  children: React.ReactNode;
  show_service_tabs?: boolean;
}

/**
 * User layout component with clean design
 * Provides mobile-first layout
 * @param props - Children content and options
 * @returns Layout wrapper component
 */
export function UserLayout({ children, show_service_tabs = false }: UserLayoutProps) {
  console.log("[UserLayout] Rendering layout", { show_service_tabs });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Service Tabs (only on Cars section) */}
      {show_service_tabs && <ServiceTabs />}

      {/* Main Content - add padding for bottom nav */}
      <main className="flex-1 px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
