"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const car_schema = z.object({
  license_plate: z.string().min(1, "License plate is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  owner_name: z.string().optional(),
  car_model: z.string().optional(),
  car_year: z.string().optional(),
  car_color: z.string().optional(),
  car_vin: z.string().optional(),
});

type CarFormData = z.infer<typeof car_schema>;

/**
 * Admin cars management page
 * CRUD operations for cars with i18n support
 */
export default function AdminCarsPage() {
  console.log("[AdminCarsPage] Rendering");

  const utils = trpc.useUtils();
  const t = useTranslations("admin.cars_page");
  const [search, set_search] = useState("");
  const [page, set_page] = useState(1);
  const [edit_car, set_edit_car] = useState<any>(null);
  const [dialog_open, set_dialog_open] = useState(false);
  const [delete_id, set_delete_id] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.admin.list_cars.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  });

  const form = useForm<CarFormData>({
    resolver: zodResolver(car_schema),
    defaultValues: {
      license_plate: "",
      phone: "",
      owner_name: "",
      car_model: "",
      car_year: "",
      car_color: "",
      car_vin: "",
    },
  });

  const create_mutation = trpc.admin.create_car.useMutation({
    onSuccess: (result) => {
      toast({
        title: result.restored ? t("toast.restored") : t("toast.created"),
      });
      close_dialog();
      utils.admin.list_cars.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const update_mutation = trpc.admin.update_car.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.updated") });
      close_dialog();
      utils.admin.list_cars.invalidate();
    },
    onError: (error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const delete_mutation = trpc.admin.delete_car.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.deleted") });
      set_delete_id(null);
      utils.admin.list_cars.invalidate();
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
   */
  function handle_search(e: React.FormEvent) {
    console.log("[AdminCarsPage] Handling search");
    e.preventDefault();
    set_page(1);
    refetch();
  }

  /**
   * Open dialog for adding new car
   */
  function open_add_dialog() {
    console.log("[AdminCarsPage] Opening add dialog");
    set_edit_car(null);
    form.reset({
      license_plate: "",
      phone: "",
      owner_name: "",
      car_model: "",
      car_year: "",
      car_color: "",
      car_vin: "",
    });
    set_dialog_open(true);
  }

  /**
   * Open dialog for editing existing car
   * @param car - Car data to edit
   */
  function open_edit_dialog(car: any) {
    console.log("[AdminCarsPage] Opening edit dialog", { car_id: car.id });
    set_edit_car(car);
    form.reset({
      license_plate: car.license_plate,
      phone: car.owner?.phone || "",
      owner_name: car.owner?.name || "",
      car_model: car.car_model || "",
      car_year: car.car_year || "",
      car_color: car.car_color || "",
      car_vin: car.car_vin || "",
    });
    set_dialog_open(true);
  }

  /**
   * Close dialog and reset state
   */
  function close_dialog() {
    console.log("[AdminCarsPage] Closing dialog");
    set_dialog_open(false);
    set_edit_car(null);
    form.reset();
  }

  /**
   * Handle form submission
   * @param data - Form data
   */
  function on_submit(data: CarFormData) {
    console.log("[AdminCarsPage] Submitting form", { is_edit: !!edit_car });
    if (edit_car) {
      update_mutation.mutate({
        id: edit_car.id,
        car_model: data.car_model,
        car_year: data.car_year,
        car_color: data.car_color,
        car_vin: data.car_vin,
        owner_name: data.owner_name,
      });
    } else {
      create_mutation.mutate(data);
    }
  }

  /**
   * Handle delete confirmation
   * @param id - Car ID to delete
   */
  function handle_delete(id: string) {
    console.log("[AdminCarsPage] Deleting car", { id });
    delete_mutation.mutate({ id });
  }

  const is_saving = create_mutation.isPending || update_mutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={open_add_dialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t("add_car")}
        </Button>
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
                      <TableHead>{t("table.license_plate")}</TableHead>
                      <TableHead>{t("table.owner_phone")}</TableHead>
                      <TableHead>{t("table.owner_name")}</TableHead>
                      <TableHead>{t("table.car_model")}</TableHead>
                      <TableHead className="text-center">
                        {t("table.service_count")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell className="font-medium">
                          {car.license_plate}
                        </TableCell>
                        <TableCell>{car.owner?.phone || "-"}</TableCell>
                        <TableCell>{car.owner?.name || "-"}</TableCell>
                        <TableCell>{car.car_model || "-"}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                            {car.service_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => open_edit_dialog(car)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => set_delete_id(car.id)}
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
              {t("no_cars")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog_open} onOpenChange={set_dialog_open}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {edit_car ? t("dialog.edit_title") : t("dialog.add_title")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(on_submit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("dialog.license_plate")}</Label>
                <Input
                  placeholder={t("dialog.license_plate_placeholder")}
                  {...form.register("license_plate")}
                  disabled={!!edit_car}
                />
                {form.formState.errors.license_plate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.license_plate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("dialog.phone")}</Label>
                <Input
                  placeholder={t("dialog.phone_placeholder")}
                  {...form.register("phone")}
                  disabled={!!edit_car}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("dialog.owner_name")}</Label>
                <Input
                  placeholder={t("dialog.owner_name_placeholder")}
                  {...form.register("owner_name")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dialog.car_model")}</Label>
                <Input
                  placeholder={t("dialog.car_model_placeholder")}
                  {...form.register("car_model")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dialog.car_year")}</Label>
                <Input
                  placeholder={t("dialog.car_year_placeholder")}
                  {...form.register("car_year")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dialog.car_color")}</Label>
                <Input
                  placeholder={t("dialog.car_color_placeholder")}
                  {...form.register("car_color")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("dialog.car_vin")}</Label>
                <Input
                  placeholder={t("dialog.car_vin_placeholder")}
                  {...form.register("car_vin")}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={close_dialog}
                className="w-full sm:w-auto"
              >
                {t("dialog.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={is_saving}
                className="w-full sm:w-auto"
              >
                {is_saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {edit_car ? t("dialog.update") : t("dialog.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
