"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Search, Car, ChevronDown, Check, Square } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { toast } from "@/hooks/use_toast";
import { TIRE_POSITION_LABELS, type TirePosition } from "@tireoff/shared";

// Type for 4 main wheel positions (excluding spare)
type MainWheelPosition = "FL" | "FR" | "RL" | "RR";
import { cn } from "@/lib/utils";

// All 4 wheel positions
const WHEEL_POSITIONS: MainWheelPosition[] = ["FL", "FR", "RL", "RR"];

interface TireChangeData {
  position: TirePosition;
  tire_size: string;
  brand: string;
  tire_model: string;
  production_week: string;
  price_per_tire: number | undefined;
  is_changed: boolean; // Whether this wheel was changed or not
}

interface SelectedCar {
  id: string;
  license_plate: string;
  car_model: string | null;
  owner_phone: string;
  owner_name: string | null;
}

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for adding new service records
 * Supports car search/selection and i18n for Thai/English
 */
export function AddServiceDialog({ open, onOpenChange }: AddServiceDialogProps) {
  console.log("[AddServiceDialog] Rendering");

  const utils = trpc.useUtils();
  const t = useTranslations("admin.add_service");

  // Fetch oil models and viscosities for suggestions
  const { data: oil_models = [] } = trpc.admin.get_oil_models.useQuery();
  const { data: oil_viscosities = [] } = trpc.admin.get_oil_viscosities.useQuery();

  const form_schema = z.object({
    car_id: z.string().optional(),
    license_plate: z.string().min(1, t("form.license_plate")),
    phone: z.string().min(10, t("form.phone")),
    car_model: z.string().optional(),
    branch_id: z.string().min(1, t("form.branch")),
    visit_date: z.string().min(1, t("form.visit_date")),
    odometer_km: z.coerce.number().positive(t("form.odometer")),
    total_price: z.coerce.number().optional(),
  });

  type FormData = z.infer<typeof form_schema>;

  // Tire changes state - now initialized with all 4 wheels
  const [has_tire_change, set_has_tire_change] = useState(false);
  const [tire_changes, set_tire_changes] = useState<TireChangeData[]>(
    WHEEL_POSITIONS.map((pos) => ({
      position: pos,
      tire_size: "",
      brand: "",
      tire_model: "",
      production_week: "",
      price_per_tire: undefined,
      is_changed: false,
    }))
  );

  // Oil change state
  const [has_oil_change, set_has_oil_change] = useState(false);
  const [oil_data, set_oil_data] = useState({
    oil_model: "",
    viscosity: "",
    oil_type: "",
    engine_type: "",
    interval_km: undefined as number | undefined,
    price: undefined as number | undefined,
  });

  // Tire switch state
  const [has_tire_switch, set_has_tire_switch] = useState(false);
  const [tire_switch_notes, set_tire_switch_notes] = useState("");
  const [tire_switch_wheels, set_tire_switch_wheels] = useState<Record<MainWheelPosition, boolean>>({
    FL: false,
    FR: false,
    RL: false,
    RR: false,
  });

  // Car search state
  const [car_search_query, set_car_search_query] = useState("");
  const [selected_car, set_selected_car] = useState<SelectedCar | null>(null);
  const [use_existing_car, set_use_existing_car] = useState(true);
  const [show_results, set_show_results] = useState(false);
  const search_ref = useRef<HTMLDivElement>(null);

  const { data: branches } = trpc.admin.list_branches.useQuery();
  const { data: search_results, isLoading: is_searching } = trpc.admin.search_cars.useQuery(
    { query: car_search_query },
    { enabled: car_search_query.length >= 2 }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(form_schema),
    defaultValues: {
      car_id: "",
      license_plate: "",
      phone: "",
      car_model: "",
      branch_id: "",
      visit_date: new Date().toISOString().split("T")[0],
      odometer_km: 0,
      total_price: undefined,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset();
      set_has_tire_change(false);
      set_tire_changes(
        WHEEL_POSITIONS.map((pos) => ({
          position: pos,
          tire_size: "",
          brand: "",
          tire_model: "",
          production_week: "",
          price_per_tire: undefined,
          is_changed: false,
        }))
      );
      set_has_oil_change(false);
      set_oil_data({
        oil_model: "",
        viscosity: "",
        oil_type: "",
        engine_type: "",
        interval_km: undefined,
        price: undefined,
      });
      set_has_tire_switch(false);
      set_tire_switch_notes("");
      set_tire_switch_wheels({
        FL: false,
        FR: false,
        RL: false,
        RR: false,
      });
      set_selected_car(null);
      set_car_search_query("");
      set_use_existing_car(true);
      set_show_results(false);
    }
  }, [open, form]);

  // Update form when car is selected
  useEffect(() => {
    if (selected_car) {
      form.setValue("car_id", selected_car.id);
      form.setValue("license_plate", selected_car.license_plate);
      form.setValue("phone", selected_car.owner_phone);
      form.setValue("car_model", selected_car.car_model || "");
    }
  }, [selected_car, form]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle_click_outside(event: MouseEvent) {
      if (search_ref.current && !search_ref.current.contains(event.target as Node)) {
        set_show_results(false);
      }
    }
    document.addEventListener("mousedown", handle_click_outside);
    return () => document.removeEventListener("mousedown", handle_click_outside);
  }, []);

  const create_mutation = trpc.admin.create_visit.useMutation({
    onSuccess: () => {
      console.log("[AddServiceDialog] Create success");
      toast({ title: t("toast.created") });
      onOpenChange(false);
      form.reset();
      set_has_tire_change(false);
      set_tire_changes(
        WHEEL_POSITIONS.map((pos) => ({
          position: pos,
          tire_size: "",
          brand: "",
          tire_model: "",
          production_week: "",
          price_per_tire: undefined,
          is_changed: false,
        }))
      );
      set_has_oil_change(false);
      set_selected_car(null);
      set_tire_switch_wheels({
        FL: false,
        FR: false,
        RL: false,
        RR: false,
      });
      set_tire_switch_wheels({
        FL: false,
        FR: false,
        RL: false,
        RR: false,
      });
      utils.admin.list_visits.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      console.error("[AddServiceDialog] Create error", error);
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Select a car from search results
   * @param car - Car to select
   */
  function handle_select_car(car: SelectedCar) {
    console.log("[AddServiceDialog] Car selected", { id: car.id });
    set_selected_car(car);
    set_car_search_query("");
    set_show_results(false);
  }

  /**
   * Clear selected car
   */
  function clear_selected_car() {
    console.log("[AddServiceDialog] Clearing selected car");
    set_selected_car(null);
    form.setValue("car_id", "");
    form.setValue("license_plate", "");
    form.setValue("phone", "");
    form.setValue("car_model", "");
  }

  /**
   * Update tire change data at specified index
   * @param index - Index of tire change to update
   * @param data - Partial data to merge
   */
  function update_tire_change(index: number, data: Partial<TireChangeData>) {
    const updated = [...tire_changes];
    updated[index] = { ...updated[index], ...data };
    set_tire_changes(updated);
  }

  /**
   * Toggle tire change status for a wheel
   * @param index - Index of tire change to toggle
   */
  function toggle_tire_change(index: number) {
    const updated = [...tire_changes];
    updated[index] = { ...updated[index], is_changed: !updated[index].is_changed };
    set_tire_changes(updated);
  }

  /**
   * Toggle tire switch wheel status
   * @param position - Wheel position to toggle
   */
  function toggle_tire_switch_wheel(position: MainWheelPosition) {
    set_tire_switch_wheels((prev) => ({
      ...prev,
      [position]: !prev[position],
    }));
  }

  /**
   * Handle form submission
   * @param data - Form data
   */
  function on_submit(data: FormData) {
    console.log("[AddServiceDialog] Submitting", data);

    // Filter tire changes to only include wheels that are marked as changed
    const changed_tires = tire_changes.filter((tc) => tc.is_changed);

    // Generate tire switches only for wheels that are checked
    const switch_positions = Object.entries(tire_switch_wheels)
      .filter(([_, is_checked]) => is_checked)
      .map(([pos]) => pos as TirePosition);

    // For each checked wheel, create a tire switch entry
    // Use a simple pattern: if wheel is checked, record it as changed
    const tire_switches =
      has_tire_switch && switch_positions.length > 0
        ? switch_positions.map((position) => ({
            from_position: position,
            to_position: position, // Same position = rotation at this position
            notes: tire_switch_notes || t("tire_switch.default_notes"),
          }))
        : undefined;

    create_mutation.mutate({
      ...data,
      visit_date: new Date(data.visit_date),
      tire_changes:
        has_tire_change && changed_tires.length > 0
          ? changed_tires.map((tc) => ({
              position: tc.position,
              tire_size: tc.tire_size || undefined,
              brand: tc.brand || undefined,
              tire_model: tc.tire_model || undefined,
              production_week: tc.production_week || undefined,
              price_per_tire: tc.price_per_tire,
              install_odometer_km: data.odometer_km,
            }))
          : undefined,
      oil_change: has_oil_change
        ? {
            oil_model: oil_data.oil_model || undefined,
            viscosity: oil_data.viscosity || undefined,
            oil_type: oil_data.oil_type || undefined,
            engine_type: oil_data.engine_type || undefined,
            interval_km: oil_data.interval_km,
            price: oil_data.price,
          }
        : undefined,
      tire_switches,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(on_submit)} className="space-y-6">
          {/* Car Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="text-base font-semibold">{t("form.car_selection")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={use_existing_car ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    set_use_existing_car(true);
                    clear_selected_car();
                  }}
                >
                  {t("form.select_existing")}
                </Button>
                <Button
                  type="button"
                  variant={!use_existing_car ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    set_use_existing_car(false);
                    clear_selected_car();
                  }}
                >
                  {t("form.enter_new")}
                </Button>
              </div>
            </div>

            {use_existing_car ? (
              <div className="space-y-3">
                {/* Car Search */}
                {!selected_car ? (
                  <div ref={search_ref} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("form.search_car_placeholder")}
                        value={car_search_query}
                        onChange={(e) => {
                          set_car_search_query(e.target.value);
                          set_show_results(true);
                        }}
                        onFocus={() => set_show_results(true)}
                        className="pl-9 pr-9"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Search Results Dropdown */}
                    {show_results && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {is_searching && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {!is_searching && car_search_query.length < 2 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {t("form.type_to_search")}
                          </div>
                        )}
                        {!is_searching && car_search_query.length >= 2 && search_results?.length === 0 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {t("form.no_cars_found")}
                          </div>
                        )}
                        {search_results && search_results.length > 0 && (
                          <div className="py-1">
                            {search_results.map((car) => (
                              <button
                                key={car.id}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                                onClick={() => handle_select_car(car)}
                              >
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{car.license_plate}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {car.owner_phone}
                                    {car.owner_name && ` - ${car.owner_name}`}
                                    {car.car_model && ` | ${car.car_model}`}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Selected Car Display */
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{selected_car.license_plate}</p>
                          <p className="text-sm text-muted-foreground">
                            {selected_car.owner_phone}
                            {selected_car.owner_name && ` - ${selected_car.owner_name}`}
                          </p>
                          {selected_car.car_model && (
                            <p className="text-sm text-muted-foreground">{selected_car.car_model}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clear_selected_car}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Entry */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.license_plate")}</Label>
                  <Input
                    placeholder={t("form.license_plate_placeholder")}
                    {...form.register("license_plate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.phone")}</Label>
                  <Input placeholder={t("form.phone_placeholder")} {...form.register("phone")} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("form.car_model")}</Label>
                  <Input
                    placeholder={t("form.car_model_placeholder")}
                    {...form.register("car_model")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("form.branch")}</Label>
              <Select
                value={form.watch("branch_id")}
                onValueChange={(v) => form.setValue("branch_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.branch_placeholder")} />
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
              <Label>{t("form.visit_date")}</Label>
              <Input type="date" {...form.register("visit_date")} />
            </div>
            <div className="space-y-2">
              <Label>{t("form.odometer")}</Label>
              <Input
                type="number"
                placeholder={t("form.odometer_placeholder")}
                {...form.register("odometer_km")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("form.total_price")}</Label>
              <Input
                type="number"
                placeholder={t("form.total_price_placeholder")}
                {...form.register("total_price")}
              />
            </div>
          </div>

          {/* Tire changes */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="has_tire_change"
                checked={has_tire_change}
                onChange={(e) => set_has_tire_change(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="has_tire_change" className="text-base font-semibold">
                {t("tire.title")}
              </Label>
            </div>
            {has_tire_change && (
              <div className="p-4 border rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground">{t("tire_switch.select_wheels")}</p>
                {tire_changes.map((tc, index) => (
                  <div key={tc.position} className="p-3 border rounded-md space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`tire_change_${tc.position}`}
                          checked={tc.is_changed}
                          onChange={() => toggle_tire_change(index)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`tire_change_${tc.position}`} className="font-medium">
                          {t(`tire.position_${tc.position.toLowerCase()}`)}
                        </Label>
                      </div>
                      {tc.is_changed && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {t("tire.change")}
                        </span>
                      )}
                    </div>
                    {tc.is_changed && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">{t("tire.size")}</Label>
                          <Input
                            placeholder={t("tire.size_placeholder")}
                            value={tc.tire_size}
                            onChange={(e) =>
                              update_tire_change(index, { tire_size: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t("tire.brand")}</Label>
                          <Input
                            placeholder={t("tire.brand_placeholder")}
                            value={tc.brand}
                            onChange={(e) =>
                              update_tire_change(index, { brand: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t("tire.model")}</Label>
                          <Input
                            placeholder={t("tire.model_placeholder")}
                            value={tc.tire_model}
                            onChange={(e) =>
                              update_tire_change(index, { tire_model: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t("tire.production_week")}</Label>
                          <Input
                            placeholder={t("tire.production_week_placeholder")}
                            value={tc.production_week}
                            onChange={(e) =>
                              update_tire_change(index, {
                                production_week: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t("tire.price")}</Label>
                          <Input
                            type="number"
                            placeholder={t("tire.price_placeholder")}
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
                    )}
                  </div>
                ))}
              </div>
            )}
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
                {t("oil.title")}
              </Label>
            </div>
            {has_oil_change && (
              <div className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t("oil.model")}</Label>
                  <Combobox
                    options={oil_models}
                    value={oil_data.oil_model}
                    onChange={(value) =>
                      set_oil_data({ ...oil_data, oil_model: value })
                    }
                    placeholder={t("oil.model_placeholder")}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("oil.viscosity")}</Label>
                  <Combobox
                    options={oil_viscosities}
                    value={oil_data.viscosity}
                    onChange={(value) =>
                      set_oil_data({ ...oil_data, viscosity: value })
                    }
                    placeholder={t("oil.viscosity_placeholder")}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("oil.type")}</Label>
                  <Select
                    value={oil_data.oil_type}
                    onValueChange={(v) =>
                      set_oil_data({ ...oil_data, oil_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("oil.type_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="สังเคราะห์แท้">{t("oil.type_synthetic")}</SelectItem>
                      <SelectItem value="กึ่งสังเคราะห์">{t("oil.type_semi_synthetic")}</SelectItem>
                      <SelectItem value="ธรรมดา">{t("oil.type_conventional")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("oil.engine_type")}</Label>
                  <Select
                    value={oil_data.engine_type}
                    onValueChange={(v) =>
                      set_oil_data({ ...oil_data, engine_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("oil.engine_type_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="เบนซิน">{t("oil.engine_gasoline")}</SelectItem>
                      <SelectItem value="ดีเซล">{t("oil.engine_diesel")}</SelectItem>
                      <SelectItem value="ไฮบริด">{t("oil.engine_hybrid")}</SelectItem>
                      <SelectItem value="ไฟฟ้า">{t("oil.engine_electric")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("oil.interval")}</Label>
                  <Input
                    type="number"
                    placeholder={t("oil.interval_placeholder")}
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
                <div>
                  <Label className="text-xs">{t("oil.price")}</Label>
                  <Input
                    type="number"
                    placeholder={t("oil.price_placeholder")}
                    value={oil_data.price || ""}
                    onChange={(e) =>
                      set_oil_data({
                        ...oil_data,
                        price: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tire switch */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="has_tire_switch"
                checked={has_tire_switch}
                onChange={(e) => set_has_tire_switch(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="has_tire_switch" className="text-base font-semibold">
                {t("tire_switch.title")}
              </Label>
            </div>
            {has_tire_switch && (
              <div className="p-4 border rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground">{t("tire_switch.select_wheels")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WHEEL_POSITIONS.map((position) => (
                    <button
                      key={position}
                      type="button"
                      onClick={() => toggle_tire_switch_wheel(position)}
                      className={cn(
                        "p-3 border rounded-md flex flex-col items-center gap-2 transition-colors",
                        tire_switch_wheels[position]
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      <span className="font-medium text-sm">
                        {t(`tire_switch.position_${position.toLowerCase()}`)}
                      </span>
                      {tire_switch_wheels[position] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">{t("tire_switch.notes")}</Label>
                  <Input
                    placeholder={t("tire_switch.notes_placeholder")}
                    value={tire_switch_notes}
                    onChange={(e) => set_tire_switch_notes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t("buttons.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={create_mutation.isPending || (use_existing_car && !selected_car)}
              className="w-full sm:w-auto"
            >
              {create_mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("buttons.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
