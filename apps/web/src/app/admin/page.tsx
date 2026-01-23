"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format_date, format_odometer } from "@tireoff/shared";
import { Users, Car, FileText, GitBranch } from "lucide-react";

/**
 * Admin dashboard page
 * Shows overview stats and recent activity with i18n support
 */
export default function AdminDashboardPage() {
  console.log("[AdminDashboardPage] Rendering");

  const t = useTranslations("admin");
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("stats.total_users")}
          value={stats?.total_users || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.total_cars")}
          value={stats?.total_cars || 0}
          icon={<Car className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.service_visits")}
          value={stats?.total_visits || 0}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title={t("stats.branches_count")}
          value={stats?.total_branches || 0}
          icon={<GitBranch className="h-5 w-5" />}
        />
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recent_visits.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_visits && stats.recent_visits.length > 0 ? (
            <div className="space-y-4">
              {stats.recent_visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{visit.car_plate}</p>
                    <p className="text-sm text-muted-foreground">
                      {visit.branch} • {format_odometer(visit.odometer)}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format_date(visit.date)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t("recent_visits.no_visits")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
