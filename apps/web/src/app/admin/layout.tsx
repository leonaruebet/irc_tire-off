"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  Upload,
  LogOut,
  Menu,
  X,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Navigation items configuration for admin sidebar
 * Uses i18n keys for labels
 */
const nav_items = [
  { href: "/admin", label_key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/cars", label_key: "cars", icon: Car },
  { href: "/admin/services", label_key: "services", icon: FileText },
  { href: "/admin/branches", label_key: "branches", icon: GitBranch },
  { href: "/admin/import", label_key: "import", icon: Upload },
];

/**
 * Admin layout with sidebar
 * Provides i18n-supported navigation and auth check
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[AdminLayout] Rendering");

  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [is_authenticated, set_is_authenticated] = useState(false);
  const [sidebar_open, set_sidebar_open] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    // Skip auth check for login page
    if (pathname === "/admin/login") {
      set_is_authenticated(true);
      return;
    }

    if (!token) {
      router.push("/admin/login");
    } else {
      set_is_authenticated(true);
    }
  }, [pathname, router]);

  function handle_logout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (!is_authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => set_sidebar_open(!sidebar_open)}
      >
        {sidebar_open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar overlay for mobile */}
      {sidebar_open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => set_sidebar_open(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out",
          sidebar_open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b">
            <h1 className="text-xl font-bold">{t("tiretrack_admin")}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {nav_items.map((item) => {
              const is_active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => set_sidebar_open(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    is_active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.label_key)}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handle_logout}
            >
              <LogOut className="h-5 w-5" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-muted/30">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
