"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Loader2, Pencil, Trash2, Calendar, Palette, Hash } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCars } from "./cars_provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

/**
 * Form schema for editing car details
 */
const edit_car_schema = z.object({
  car_model: z.string().max(100).optional(),
  car_year: z.string().max(10).optional(),
  car_color: z.string().max(50).optional(),
  car_vin: z.string().max(50).optional(),
});

type EditCarFormData = z.infer<typeof edit_car_schema>;

interface CarInfoSheetProps {
  is_open: boolean;
  on_close: () => void;
  car: {
    id: string;
    license_plate: string;
    car_model: string | null;
    car_year: string | null;
    car_color: string | null;
    car_vin: string | null;
  };
}

/**
 * Car info sheet component for viewing and editing car details
 * Opens as a dialog/modal with form for CRUD operations
 * @param props - Sheet open state, close handler, and car data
 * @returns Car info sheet dialog
 */
export function CarInfoSheet({ is_open, on_close, car }: CarInfoSheetProps) {
  console.log("[CarInfoSheet] Rendering", { is_open, car_id: car.id });

  const t = useTranslations("car");
  const t_common = useTranslations("common");
  const { refetch, update_selected_car, clear_selection } = useCars();

  const [is_editing, set_is_editing] = useState(false);
  const [show_delete_dialog, set_show_delete_dialog] = useState(false);

  const form = useForm<EditCarFormData>({
    resolver: zodResolver(edit_car_schema),
    defaultValues: {
      car_model: car.car_model || "",
      car_year: car.car_year || "",
      car_color: car.car_color || "",
      car_vin: car.car_vin || "",
    },
  });

  // Reset form when car changes
  useEffect(() => {
    form.reset({
      car_model: car.car_model || "",
      car_year: car.car_year || "",
      car_color: car.car_color || "",
      car_vin: car.car_vin || "",
    });
  }, [car, form]);

  const update_car = trpc.car.update.useMutation({
    onSuccess: (data) => {
      console.log("[CarInfoSheet] Car updated successfully", data);
      toast({
        title: t("update_success"),
      });
      // Update the selected car in context
      update_selected_car({
        ...car,
        car_model: data.car_model,
        car_year: data.car_year,
        car_color: data.car_color,
        car_vin: data.car_vin,
      } as any);
      set_is_editing(false);
      refetch();
    },
    onError: (error) => {
      console.error("[CarInfoSheet] Error updating car", error);
      toast({
        title: t("update_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const remove_car = trpc.car.remove.useMutation({
    onSuccess: () => {
      console.log("[CarInfoSheet] Car removed successfully");
      toast({
        title: t("remove_success"),
      });
      clear_selection();
      on_close();
      refetch();
    },
    onError: (error) => {
      console.error("[CarInfoSheet] Error removing car", error);
      toast({
        title: t("remove_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle form submission for updating car
   * @param data - Form data
   */
  async function on_submit(data: EditCarFormData) {
    console.log("[CarInfoSheet] Submitting update", data);
    update_car.mutate({
      car_id: car.id,
      car_model: data.car_model || null,
      car_year: data.car_year || null,
      car_color: data.car_color || null,
      car_vin: data.car_vin || null,
    });
  }

  /**
   * Handle car deletion
   */
  function handle_delete() {
    console.log("[CarInfoSheet] Deleting car", car.id);
    remove_car.mutate({ car_id: car.id });
    set_show_delete_dialog(false);
  }

  /**
   * Cancel editing and reset form
   */
  function cancel_edit() {
    console.log("[CarInfoSheet] Cancelling edit");
    set_is_editing(false);
    form.reset({
      car_model: car.car_model || "",
      car_year: car.car_year || "",
      car_color: car.car_color || "",
      car_vin: car.car_vin || "",
    });
  }

  /**
   * Format info item with icon for display
   */
  function InfoItem({
    icon: Icon,
    label,
    value
  }: {
    icon: React.ElementType;
    label: string;
    value: string | null;
  }) {
    return (
      <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium truncate">{value || "-"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={is_open} onOpenChange={(open) => !open && on_close()}>
        <DialogContent className="max-w-md mx-auto rounded-t-2xl sm:rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary text-white shrink-0">
                <Car className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold tracking-wide truncate">
                  {car.license_plate}
                </DialogTitle>
                <DialogDescription>
                  {t("vehicle_info")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {is_editing ? (
            /* Edit Form */
            <form onSubmit={form.handleSubmit(on_submit)} className="space-y-4 py-2">
              {/* Car model input */}
              <div className="space-y-2">
                <Label htmlFor="car_model" className="text-sm font-medium">
                  {t("car_model")}
                </Label>
                <Input
                  id="car_model"
                  placeholder={t("car_model_placeholder")}
                  {...form.register("car_model")}
                />
              </div>

              {/* Car year input */}
              <div className="space-y-2">
                <Label htmlFor="car_year" className="text-sm font-medium">
                  {t("car_year")}
                </Label>
                <Input
                  id="car_year"
                  placeholder={t("car_year_placeholder")}
                  {...form.register("car_year")}
                />
              </div>

              {/* Car color input */}
              <div className="space-y-2">
                <Label htmlFor="car_color" className="text-sm font-medium">
                  {t("car_color")}
                </Label>
                <Input
                  id="car_color"
                  placeholder={t("car_color_placeholder")}
                  {...form.register("car_color")}
                />
              </div>

              {/* VIN input */}
              <div className="space-y-2">
                <Label htmlFor="car_vin" className="text-sm font-medium">
                  {t("car_vin")}
                </Label>
                <Input
                  id="car_vin"
                  placeholder={t("car_vin_placeholder")}
                  className="uppercase"
                  {...form.register("car_vin")}
                />
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancel_edit}
                  disabled={update_car.isPending}
                >
                  {t_common("cancel")}
                </Button>
                <Button type="submit" disabled={update_car.isPending}>
                  {update_car.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t_common("save")}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* View Mode */
            <div className="py-2">
              <div className="rounded-xl bg-muted/30 divide-y divide-border">
                <InfoItem icon={Car} label={t("car_model")} value={car.car_model} />
                <InfoItem icon={Calendar} label={t("car_year")} value={car.car_year} />
                <InfoItem icon={Palette} label={t("car_color")} value={car.car_color} />
                <InfoItem icon={Hash} label={t("car_vin")} value={car.car_vin} />
              </div>

              <DialogFooter className="gap-2 pt-6">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => set_show_delete_dialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("remove_car")}
                </Button>
                <Button onClick={() => set_is_editing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {t_common("edit")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={show_delete_dialog} onOpenChange={set_show_delete_dialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_car")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_car_confirm", { plate: car.license_plate })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t_common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handle_delete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove_car.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t_common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
