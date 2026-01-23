"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Car, User, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface NavItem {
  href: string;
  label_key: string;
  icon: React.ComponentType<{ className?: string }>;
}

const nav_items: NavItem[] = [
  { href: "/cars", label_key: "cars", icon: Car },
  { href: "/history", label_key: "history", icon: History },
  { href: "/user", label_key: "user", icon: User },
];

/**
 * Bottom navigation bar with clean design and i18n support
 * Fixed at bottom of screen
 * Memoized for performance
 * @returns Bottom navigation component
 */
export const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  console.log("[BottomNavigation] Rendering");

  /**
   * Check if current path matches nav item
   * @param href - Nav item href
   * @returns True if active
   */
  function is_active(href: string): boolean {
    if (href === "/cars") {
      return pathname === "/cars" || pathname.startsWith("/cars");
    }
    if (href === "/history") {
      return pathname === "/history" || pathname.startsWith("/history");
    }
    if (href === "/user") {
      return pathname === "/user" || pathname.startsWith("/user");
    }
    return pathname === href;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-bottom">
      <div className="flex">
        {nav_items.map((item) => {
          const active = is_active(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-xs font-medium",
                active && "text-primary"
              )}>
                {t(item.label_key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
