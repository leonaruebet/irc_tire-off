"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Circle, RefreshCw, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface TabItem {
  href: string;
  label_key: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { href: "/cars", label_key: "tire", icon: Circle },
  { href: "/cars/switch", label_key: "switch", icon: RefreshCw },
  { href: "/cars/oil", label_key: "oil", icon: Droplet },
];

/**
 * Service type tabs with clean design and i18n support
 * Shows tabs for Tire, Tire Switch, and Oil sections
 * Uses fixed positioning instead of sticky for consistent behavior
 * Memoized for performance - only re-renders on pathname change
 * @returns Service tabs component
 */
export const ServiceTabs = memo(function ServiceTabs() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  console.log("[ServiceTabs] Rendering");

  /**
   * Check if current path matches tab href
   * @param href - Tab href
   * @returns True if active
   */
  function is_active(href: string): boolean {
    if (href === "/cars") {
      return pathname === "/cars" || pathname === "/cars/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="fixed top-[4rem] left-0 right-0 z-40 bg-white border-b border-border px-4 py-3">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active = is_active(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(tab.label_key)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
