"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format_date, format_odometer, format_currency } from "@tireoff/shared";
import { Search, Plus, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { AddServiceDialog } from "@/components/admin/add_service_dialog";
import { ServiceDetailDialog } from "@/components/admin/service_detail_dialog";

/**
 * Admin service records page
 * Data table with search, pagination, and CRUD
 * Uses i18n for all text content
 */
export default function AdminServicesPage() {
  console.log("[AdminServicesPage] Rendering");

  const t = useTranslations("admin.services_page");
  const [search, set_search] = useState("");
  const [page, set_page] = useState(1);
  const [service_type, set_service_type] = useState<"tire_change" | "tire_switch" | "oil_change" | undefined>(undefined);
  const [delete_id, set_delete_id] = useState<string | null>(null);
  const [add_dialog_open, set_add_dialog_open] = useState(false);
  const [detail_visit_id, set_detail_visit_id] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.admin.list_visits.useQuery({
    search: search || undefined,
    service_type,
    page,
    limit: 20,
  });

  const delete_mutation = trpc.admin.delete_visit.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.deleted") });
      set_delete_id(null);
      utils.admin.list_visits.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      toast({
        title: t("toast.delete_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle search form submission
   * Resets page to 1 and refetches data
   */
  function handle_search(e: React.FormEvent) {
    console.log("[AdminServicesPage] Handling search");
    e.preventDefault();
    set_page(1);
    refetch();
  }

  /**
   * Handle delete confirmation
   * Triggers delete mutation
   * @param id - Service visit ID to delete
   */
  function handle_delete(id: string) {
    console.log("[AdminServicesPage] Deleting visit", { id });
    delete_mutation.mutate({ id });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => set_add_dialog_open(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("add_record")}
        </Button>
      </div>

      {/* Search + service type filter */}
      <Card>
        <CardContent className="p-4 space-y-3">
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
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={service_type === undefined ? "default" : "outline"}
              onClick={() => { set_service_type(undefined); set_page(1); }}
            >
              {t("filter.all")}
            </Button>
            <Button
              size="sm"
              variant={service_type === "tire_change" ? "default" : "outline"}
              className={service_type === "tire_change" ? "bg-blue-600 hover:bg-blue-700" : ""}
              onClick={() => { set_service_type("tire_change"); set_page(1); }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
              {t("filter.tire_change")}
            </Button>
            <Button
              size="sm"
              variant={service_type === "tire_switch" ? "default" : "outline"}
              className={service_type === "tire_switch" ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={() => { set_service_type("tire_switch"); set_page(1); }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              {t("filter.tire_switch")}
            </Button>
            <Button
              size="sm"
              variant={service_type === "oil_change" ? "default" : "outline"}
              className={service_type === "oil_change" ? "bg-amber-600 hover:bg-amber-700" : ""}
              onClick={() => { set_service_type("oil_change"); set_page(1); }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
              {t("filter.oil_change")}
            </Button>
          </div>
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
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.license_plate")}</TableHead>
                      <TableHead>{t("table.phone")}</TableHead>
                      <TableHead>{t("table.branch")}</TableHead>
                      <TableHead className="text-right">{t("table.odometer")}</TableHead>
                      <TableHead className="text-right">{t("table.total")}</TableHead>
                      <TableHead className="text-center">{t("table.services")}</TableHead>
                      <TableHead className="text-right">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>{format_date(visit.visit_date)}</TableCell>
                        <TableCell className="font-medium">
                          {visit.car.license_plate}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {visit.car.owner_phone}
                        </TableCell>
                        <TableCell>{visit.branch.name}</TableCell>
                        <TableCell className="text-right">
                          {format_odometer(visit.odometer_km)}
                        </TableCell>
                        <TableCell className="text-right">
                          {visit.total_price
                            ? format_currency(visit.total_price)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            {visit.tire_change_count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                T:{visit.tire_change_count}
                              </span>
                            )}
                            {visit.tire_switch_count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                S:{visit.tire_switch_count}
                              </span>
                            )}
                            {visit.oil_change_count > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                O:{visit.oil_change_count}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => set_detail_visit_id(visit.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => set_delete_id(visit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              {t("no_records")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!delete_id} onOpenChange={() => set_delete_id(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete_dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => delete_id && handle_delete(delete_id)}
            >
              {t("delete_dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add service dialog */}
      <AddServiceDialog
        open={add_dialog_open}
        onOpenChange={set_add_dialog_open}
      />

      {/* Service detail dialog */}
      <ServiceDetailDialog
        visit_id={detail_visit_id}
        open={!!detail_visit_id}
        onOpenChange={(open) => !open && set_detail_visit_id(null)}
      />
    </div>
  );
}
