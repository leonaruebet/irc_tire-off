"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert_dialog";
import { toast } from "@/hooks/use_toast";
import { format_date } from "@tireoff/shared";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

/**
 * Admin users management page
 * Lists users with their car and service counts
 * Provides reset (hard delete) functionality
 */
export default function AdminUsersPage() {
  console.log("[AdminUsersPage] Rendering");

  const utils = trpc.useUtils();
  const t = useTranslations("admin.users_page");
  const [search, set_search] = useState("");
  const [page, set_page] = useState(1);
  const [reset_user, set_reset_user] = useState<{
    id: string;
    phone: string;
    car_count: number;
    service_count: number;
  } | null>(null);

  const { data, isLoading, refetch } = trpc.admin.list_users.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const reset_mutation = trpc.admin.reset_user.useMutation({
    onSuccess: (result) => {
      console.log("[AdminUsersPage] Reset success", result);
      toast({
        title: t("toast.reset_success"),
        description: t("toast.reset_details", {
          cars: result.deleted.cars,
          visits: result.deleted.visits,
        }),
      });
      set_reset_user(null);
      utils.admin.list_users.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      console.error("[AdminUsersPage] Reset error", error);
      toast({
        title: t("toast.reset_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle search form submission
   */
  function handle_search(e: React.FormEvent) {
    console.log("[AdminUsersPage] Handling search");
    e.preventDefault();
    set_page(1);
    refetch();
  }

  /**
   * Handle reset confirmation
   * Hard deletes all user data
   * @param id - User ID to reset
   */
  function handle_reset(id: string) {
    console.log("[AdminUsersPage] Resetting user", { id });
    reset_mutation.mutate({ id });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handle_search} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search_placeholder")}
                value={search}
                onChange={(e) => set_search(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">{t("search")}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.phone")}</TableHead>
                      <TableHead>{t("table.name")}</TableHead>
                      <TableHead className="text-center">
                        {t("table.car_count")}
                      </TableHead>
                      <TableHead className="text-center">
                        {t("table.service_count")}
                      </TableHead>
                      <TableHead>{t("table.created_at")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.phone}
                        </TableCell>
                        <TableCell>{user.name || "-"}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                            {user.car_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                            {user.service_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format_date(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              set_reset_user({
                                id: user.id,
                                phone: user.phone,
                                car_count: user.car_count,
                                service_count: user.service_count,
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  {t("showing", {
                    from: (page - 1) * 20 + 1,
                    to: Math.min(page * 20, data.total),
                    total: data.total,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => set_page(page - 1)}
                    disabled={!data.has_prev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm whitespace-nowrap">
                    {t("page_of", { page, total: data.total_pages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => set_page(page + 1)}
                    disabled={!data.has_next}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t("no_users")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <AlertDialog
        open={!!reset_user}
        onOpenChange={() => set_reset_user(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("reset_dialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("reset_dialog.description")}</p>
                {reset_user && (
                  <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                    <p className="font-medium">
                      {t("reset_dialog.user_info", { phone: reset_user.phone })}
                    </p>
                    <p className="text-muted-foreground">
                      {t("reset_dialog.data_to_delete")}
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>
                        {t("reset_dialog.cars", { count: reset_user.car_count })}
                      </li>
                      <li>
                        {t("reset_dialog.services", {
                          count: reset_user.service_count,
                        })}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reset_mutation.isPending}>
              {t("reset_dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => reset_user && handle_reset(reset_user.id)}
              disabled={reset_mutation.isPending}
            >
              {reset_mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("reset_dialog.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
