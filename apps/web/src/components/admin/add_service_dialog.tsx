"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use_toast";
import { TIRE_POSITION_LABELS, type TirePosition } from "@tireoff/shared";

const form_schema = z.object({
  license_plate: z.string().min(1, "Required"),
  phone: z.string().min(10, "Invalid phone"),
  car_model: z.string().optional(),
  branch_id: z.string().min(1, "Required"),
  visit_date: z.string().min(1, "Required"),
  odometer_km: z.coerce.number().positive("Required"),
  total_price: z.coerce.number().optional(),
});

type FormData = z.infer<typeof form_schema>;

interface TireChangeData {
  position: TirePosition;
  tire_size: string;
  brand: string;
  tire_model: string;
  production_week: string;
  price_per_tire: number | undefined;
}

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for adding new service records
 */
export function AddServiceDialog({ open, onOpenChange }: AddServiceDialogProps) {
  const utils = trpc.useUtils();

  const [tire_changes, set_tire_changes] = useState<TireChangeData[]>([]);
  const [has_oil_change, set_has_oil_change] = useState(false);
  const [oil_data, set_oil_data] = useState({
    oil_model: "",
    viscosity: "",
    oil_type: "",
    interval_km: undefined as number | undefined,
  });

  const { data: branches } = trpc.admin.list_branches.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(form_schema),
    defaultValues: {
      license_plate: "",
      phone: "",
      car_model: "",
      branch_id: "",
      visit_date: new Date().toISOString().split("T")[0],
      odometer_km: 0,
      total_price: undefined,
    },
  });

  const create_mutation = trpc.admin.create_visit.useMutation({
    onSuccess: () => {
      toast({ title: "Service record created" });
      onOpenChange(false);
      form.reset();
      set_tire_changes([]);
      set_has_oil_change(false);
      utils.admin.list_visits.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error creating record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function add_tire_change() {
    set_tire_changes([
      ...tire_changes,
      {
        position: "FL",
        tire_size: "",
        brand: "",
        tire_model: "",
        production_week: "",
        price_per_tire: undefined,
      },
    ]);
  }

  function update_tire_change(index: number, data: Partial<TireChangeData>) {
    const updated = [...tire_changes];
    updated[index] = { ...updated[index], ...data };
    set_tire_changes(updated);
  }

  function remove_tire_change(index: number) {
    set_tire_changes(tire_changes.filter((_, i) => i !== index));
  }

  function on_submit(data: FormData) {
    console.log("[AddServiceDialog] Submitting", data);

    create_mutation.mutate({
      ...data,
      visit_date: new Date(data.visit_date),
      tire_changes:
        tire_changes.length > 0
          ? tire_changes.map((tc) => ({
              position: tc.position,
              tire_size: tc.tire_size || undefined,
              brand: tc.brand || undefined,
              tire_model: tc.tire_model || undefined,
              production_week: tc.production_week || undefined,
              price_per_tire: tc.price_per_tire,
            }))
          : undefined,
      oil_change: has_oil_change
        ? {
            oil_model: oil_data.oil_model || undefined,
            viscosity: oil_data.viscosity || undefined,
            oil_type: oil_data.oil_type || undefined,
            interval_km: oil_data.interval_km,
          }
        : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Record</DialogTitle>
          <DialogDescription>
            Create a new service visit record
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(on_submit)} className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>License Plate *</Label>
              <Input
                placeholder="กข 1234"
                {...form.register("license_plate")}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input placeholder="0812345678" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Car Model</Label>
              <Input
                placeholder="Toyota Camry"
                {...form.register("car_model")}
              />
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select
                value={form.watch("branch_id")}
                onValueChange={(v) => form.setValue("branch_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visit Date *</Label>
              <Input type="date" {...form.register("visit_date")} />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km) *</Label>
              <Input
                type="number"
                placeholder="50000"
                {...form.register("odometer_km")}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Total Price</Label>
              <Input
                type="number"
                placeholder="2500"
                {...form.register("total_price")}
              />
            </div>
          </div>

          {/* Tire changes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Tire Changes</Label>
              <Button type="button" variant="outline" size="sm" onClick={add_tire_change}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tire
              </Button>
            </div>
            {tire_changes.map((tc, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tire #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove_tire_change(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Position</Label>
                    <Select
                      value={tc.position}
                      onValueChange={(v) =>
                        update_tire_change(index, { position: v as TirePosition })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TIRE_POSITION_LABELS) as TirePosition[]).map(
                          (pos) => (
                            <SelectItem key={pos} value={pos}>
                              {TIRE_POSITION_LABELS[pos].en}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input
                      placeholder="205/55R16"
                      value={tc.tire_size}
                      onChange={(e) =>
                        update_tire_change(index, { tire_size: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Brand</Label>
                    <Input
                      placeholder="Michelin"
                      value={tc.brand}
                      onChange={(e) =>
                        update_tire_change(index, { brand: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Model</Label>
                    <Input
                      placeholder="Primacy 4"
                      value={tc.tire_model}
                      onChange={(e) =>
                        update_tire_change(index, { tire_model: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Production Week</Label>
                    <Input
                      placeholder="2524"
                      value={tc.production_week}
                      onChange={(e) =>
                        update_tire_change(index, {
                          production_week: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      placeholder="3500"
                      value={tc.price_per_tire || ""}
                      onChange={(e) =>
                        update_tire_change(index, {
                          price_per_tire: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Oil change */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="has_oil"
                checked={has_oil_change}
                onChange={(e) => set_has_oil_change(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="has_oil" className="text-base font-semibold">
                Oil Change
              </Label>
            </div>
            {has_oil_change && (
              <div className="p-4 border rounded-lg grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Oil Model</Label>
                  <Input
                    placeholder="Castrol Edge"
                    value={oil_data.oil_model}
                    onChange={(e) =>
                      set_oil_data({ ...oil_data, oil_model: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Viscosity</Label>
                  <Input
                    placeholder="5W-30"
                    value={oil_data.viscosity}
                    onChange={(e) =>
                      set_oil_data({ ...oil_data, viscosity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Oil Type</Label>
                  <Input
                    placeholder="Synthetic"
                    value={oil_data.oil_type}
                    onChange={(e) =>
                      set_oil_data({ ...oil_data, oil_type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Interval (km)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={oil_data.interval_km || ""}
                    onChange={(e) =>
                      set_oil_data({
                        ...oil_data,
                        interval_km: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create_mutation.isPending}>
              {create_mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
