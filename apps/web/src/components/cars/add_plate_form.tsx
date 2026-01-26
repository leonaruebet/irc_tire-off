"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use_toast";
import { license_plate_schema } from "@tireoff/shared";
import { APP_ROUTES } from "@tireoff/shared";

/**
 * Form schema for adding a plate with optional fields
 */
const add_plate_schema = z.object({
  license_plate: license_plate_schema,
  car_model: z.string().optional(),
  car_year: z.string().optional(),
  car_color: z.string().optional(),
  car_vin: z.string().optional(),
});

type AddPlateFormData = z.infer<typeof add_plate_schema>;

/**
 * Add plate form component with i18n support
 * Allows users to register a new license plate with optional vehicle details
 * @returns Add plate form
 */
export function AddPlateForm() {
  console.log("[AddPlateForm] Rendering form");

  const t = useTranslations("car");
  const router = useRouter();
  const [submitted, set_submitted] = useState(false);
  const [not_registered_plate, set_not_registered_plate] = useState<string | null>(null);

  const form = useForm<AddPlateFormData>({
    resolver: zodResolver(add_plate_schema),
    defaultValues: {
      license_plate: "",
      car_model: "",
      car_year: "",
      car_color: "",
      car_vin: "",
    },
  });

  const add_car = trpc.car.add.useMutation({
    onSuccess: (data) => {
      console.log("[AddPlateForm] Plate added successfully", data);
      set_submitted(true);
      toast({
        title: t("register_success"),
      });
    },
    onError: (error) => {
      console.error("[AddPlateForm] Error adding plate", error);

      // Handle plate not registered in admin system
      if (error.message === "PLATE_NOT_REGISTERED") {
        console.log("[AddPlateForm] Plate not registered in admin system");
        set_not_registered_plate(form.getValues("license_plate"));
        return;
      }

      toast({
        title: t("register_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle form submission
   * @param data - Form data
   */
  async function on_submit(data: AddPlateFormData) {
    console.log("[AddPlateForm] Submitting", data);
    add_car.mutate({
      license_plate: data.license_plate,
      car_model: data.car_model || undefined,
      car_year: data.car_year || undefined,
      car_color: data.car_color || undefined,
      car_vin: data.car_vin || undefined,
    });
  }

  /**
   * Handle adding another plate
   */
  function handle_add_another() {
    console.log("[AddPlateForm] Adding another plate");
    set_submitted(false);
    form.reset();
  }

  /**
   * Navigate to plates list
   */
  function handle_view_plates() {
    console.log("[AddPlateForm] Navigating to plates list");
    router.push(APP_ROUTES.CARS);
  }

  /**
   * Reset not registered state and clear form for retry
   */
  function handle_retry_plate() {
    console.log("[AddPlateForm] Retrying with different plate");
    set_not_registered_plate(null);
    form.reset();
  }

  // Show "not registered" state when plate is not found in admin system
  if (not_registered_plate) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-amber-100 mb-4">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("plate_not_registered")}</h2>
          <p className="text-lg font-semibold text-foreground mb-1">
            {not_registered_plate}
          </p>
          <p className="text-muted-foreground text-center mb-6">
            {t("plate_not_registered_message")}
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handle_retry_plate}>
              {t("try_another_plate")}
            </Button>
            <Button className="flex-1" onClick={handle_view_plates}>
              {t("view_plates")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("plate_registered")}</h2>
          <p className="text-muted-foreground text-center mb-6">
            {t("plate_registered_message")}
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handle_add_another}>
              {t("add_another")}
            </Button>
            <Button className="flex-1" onClick={handle_view_plates}>
              {t("view_plates")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary text-white">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-lg uppercase">{t("vehicle_info")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("vehicle_info_subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-5">
        <form onSubmit={form.handleSubmit(on_submit)} className="space-y-5">
          {/* License plate input - Required */}
          <div className="space-y-2">
            <Label htmlFor="license_plate" className="text-sm font-medium">
              {t("license_plate")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="license_plate"
              placeholder={t("license_plate_placeholder")}
              className="text-lg uppercase"
              {...form.register("license_plate")}
            />
            {form.formState.errors.license_plate && (
              <p className="text-sm text-destructive">
                {t("license_plate_invalid")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("license_plate_format")}
            </p>
          </div>

          {/* Car model input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="car_model" className="text-sm font-medium">
              {t("car_model")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
            </Label>
            <Input
              id="car_model"
              placeholder={t("car_model_placeholder")}
              {...form.register("car_model")}
            />
          </div>

          {/* Car year input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="car_year" className="text-sm font-medium">
              {t("car_year")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
            </Label>
            <Input
              id="car_year"
              placeholder={t("car_year_placeholder")}
              {...form.register("car_year")}
            />
          </div>

          {/* Car color input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="car_color" className="text-sm font-medium">
              {t("car_color")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
            </Label>
            <Input
              id="car_color"
              placeholder={t("car_color_placeholder")}
              {...form.register("car_color")}
            />
          </div>

          {/* VIN input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="car_vin" className="text-sm font-medium">
              {t("car_vin")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
            </Label>
            <Input
              id="car_vin"
              placeholder={t("car_vin_placeholder")}
              className="uppercase"
              {...form.register("car_vin")}
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={add_car.isPending}
          >
            {add_car.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("register_plate")}
          </Button>
        </form>
      </div>
    </div>
  );
}
