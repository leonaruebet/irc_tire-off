"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use_toast";
import { add_car_schema, type AddCarInput } from "@tireoff/shared";

/**
 * Add car button with dialog
 * Opens a modal to add a new car by license plate
 */
export function AddCarButton() {
  const t = useTranslations("car");
  const router = useRouter();
  const [open, set_open] = useState(false);

  const form = useForm<AddCarInput>({
    resolver: zodResolver(add_car_schema),
    defaultValues: {
      license_plate: "",
      car_model: "",
    },
  });

  const add_car = trpc.car.add.useMutation({
    onSuccess: (data) => {
      console.log("[AddCarButton] Car added", data);

      toast({
        title: data.restored
          ? "Car restored successfully"
          : "Car added successfully",
      });

      set_open(false);
      form.reset();
      router.refresh();
    },
    onError: (error) => {
      console.error("[AddCarButton] Error adding car", error);
      toast({
        title: error.message,
        variant: "destructive",
      });
    },
  });

  function on_submit(data: AddCarInput) {
    console.log("[AddCarButton] Submitting", data);
    add_car.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={set_open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t("add_car")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("add_car")}</DialogTitle>
          <DialogDescription>
            Enter your license plate to add a new car
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(on_submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license_plate">{t("license_plate")}</Label>
            <Input
              id="license_plate"
              placeholder={t("license_plate_placeholder")}
              {...form.register("license_plate")}
              className="text-lg"
            />
            {form.formState.errors.license_plate && (
              <p className="text-sm text-destructive">
                {t("license_plate_invalid")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="car_model">
              {t("car_model")} <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car_model"
              placeholder={t("car_model_placeholder")}
              {...form.register("car_model")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => set_open(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={add_car.isPending}>
              {add_car.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("add_car")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
