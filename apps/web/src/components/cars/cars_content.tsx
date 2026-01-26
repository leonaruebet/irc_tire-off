"use client";

import { ReactNode, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PlateList } from "./plate_list";
import { PlateListSkeleton } from "./plate_list_skeleton";
import { CarInfoSheet } from "./car_info_sheet";
import { useCars } from "./cars_provider";
import { Button } from "@/components/ui/button";
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
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use_toast";

interface CarsContentProps {
  title: string;
  description: string;
  /** Content to show when a car is selected (service history component) */
  service_content?: ReactNode;
}

/**
 * Car type used for edit/delete actions from the plate list
 * Matches the Plate interface from PlateList
 */
interface ActionCar {
  id: string;
  license_plate: string;
  car_model: string | null;
  car_year: string | null;
  car_color: string | null;
  car_vin: string | null;
}

/**
 * Cars content component with clean design
 * Shows car list when no car selected, or service data when car is selected
 * Includes edit/delete actions via 3-dot menu on each car card
 * @param props - Title, description, and optional service content
 * @returns Content with plate list or service data
 */
export function CarsContent({ title, description, service_content }: CarsContentProps) {
  const { cars, is_loading, selected_car, select_car, refetch } = useCars();
  const t = useTranslations();
  const t_car = useTranslations("car");
  const t_common = useTranslations("common");
  console.log("[CarsContent] Rendering", { title, has_selected_car: !!selected_car });

  /** Car currently being edited via CarInfoSheet */
  const [editing_car, set_editing_car] = useState<ActionCar | null>(null);
  /** Car currently pending delete confirmation */
  const [deleting_car, set_deleting_car] = useState<ActionCar | null>(null);

  const remove_car = trpc.car.remove.useMutation({
    onSuccess: () => {
      console.log("[CarsContent] Car removed successfully", deleting_car?.id);
      toast({ title: t_car("remove_success") });
      set_deleting_car(null);
      refetch();
    },
    onError: (error) => {
      console.error("[CarsContent] Error removing car", error);
      toast({
        title: t_car("remove_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle edit action from plate list dropdown
   * @param plate - Car to edit
   */
  function handle_edit(plate: ActionCar) {
    console.log("[CarsContent] Opening edit for car", plate.id);
    set_editing_car(plate);
  }

  /**
   * Handle delete action from plate list dropdown
   * @param plate - Car to delete
   */
  function handle_delete(plate: ActionCar) {
    console.log("[CarsContent] Opening delete confirmation for car", plate.id);
    set_deleting_car(plate);
  }

  /**
   * Confirm deletion of the car
   */
  function confirm_delete() {
    if (!deleting_car) return;
    console.log("[CarsContent] Confirming delete for car", deleting_car.id);
    remove_car.mutate({ car_id: deleting_car.id });
  }

  // When a car is selected, show the service content for that car
  if (selected_car && service_content) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {description}
          </p>
        </div>

        {/* Service content for selected car */}
        {service_content}
      </div>
    );
  }

  // When no car is selected, show the car list (overview)
  return (
    <>
      <div className="space-y-6">
        {/* Header with add button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("car.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("car.select_to_view")}
            </p>
          </div>
          <Link href="/add-plate">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("common.add")}
            </Button>
          </Link>
        </div>

        {/* Plate list with selection and action support */}
        {is_loading ? (
          <PlateListSkeleton />
        ) : (
          <PlateList
            plates={cars}
            selected_plate_id={selected_car?.id}
            on_select={(plate) => select_car(plate as any)}
            on_edit={(plate) => handle_edit(plate as ActionCar)}
            on_delete={(plate) => handle_delete(plate as ActionCar)}
          />
        )}
      </div>

      {/* Edit Car Dialog (reuses CarInfoSheet) */}
      {editing_car && (
        <CarInfoSheet
          is_open={!!editing_car}
          on_close={() => {
            console.log("[CarsContent] Closing edit dialog");
            set_editing_car(null);
          }}
          car={editing_car}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleting_car}
        onOpenChange={(open) => {
          if (!open) set_deleting_car(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t_car("remove_car")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting_car
                ? t_car("remove_car_confirm", { plate: deleting_car.license_plate })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t_common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm_delete}
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
