"use client";

import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  format_date,
  format_odometer,
  format_currency,
  TIRE_POSITION_LABELS,
} from "@tireoff/shared";

/**
 * Helper to get position label based on locale
 * @param position - Tire position code (FL, FR, RL, RR, SP)
 * @param locale - Current locale (th or en)
 * @returns Localized position label or fallback to position code
 */
function get_position_label(position: string, locale: string): string {
  const labels = TIRE_POSITION_LABELS[position as keyof typeof TIRE_POSITION_LABELS];
  if (!labels) return position;
  return locale === "th" ? labels.th : labels.en;
}
import {
  Car,
  MapPin,
  Calendar,
  Gauge,
  CircleDollarSign,
  Phone,
  User,
  Disc3,
  ArrowLeftRight,
  Droplet,
} from "lucide-react";

interface ServiceDetailDialogProps {
  visit_id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for viewing service visit details
 * Displays car info, visit info, tire changes, tire switches, and oil changes
 * Uses i18n for all text content
 */
export function ServiceDetailDialog({
  visit_id,
  open,
  onOpenChange,
}: ServiceDetailDialogProps) {
  console.log("[ServiceDetailDialog] Rendering", { visit_id, open });

  const t = useTranslations("admin.service_detail");
  const locale = useLocale();

  const { data: visit, isLoading } = trpc.admin.get_visit.useQuery(
    { id: visit_id! },
    { enabled: !!visit_id && open }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : visit ? (
          <div className="space-y-6">
            {/* Car Info Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                {t("car_info")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("license_plate")}:</span>
                  <span className="font-medium">{visit.car.license_plate}</span>
                </div>
                {visit.car.car_model && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("car_model")}:</span>
                    <span>{visit.car.car_model}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{visit.car.owner.phone}</span>
                </div>
                {visit.car.owner.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{visit.car.owner.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visit Info Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("visit_info")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("date")}:</span>
                  <span>{format_date(visit.visit_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("branch")}:</span>
                  <span>{visit.branch.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("odometer")}:</span>
                  <span>{format_odometer(visit.odometer_km)}</span>
                </div>
                {visit.total_price && (
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("total_price")}:</span>
                    <span>{format_currency(visit.total_price)}</span>
                  </div>
                )}
              </div>
              {visit.services_note && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("notes")}:</span>
                  <p className="mt-1">{visit.services_note}</p>
                </div>
              )}
            </div>

            {/* Tire Changes Section */}
            {visit.tire_changes && visit.tire_changes.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Disc3 className="h-4 w-4" />
                  {t("tire_changes")}
                  <Badge variant="secondary" className="ml-auto">
                    {visit.tire_changes.length}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {visit.tire_changes.map((tire, index) => (
                    <div
                      key={tire.id || index}
                      className="bg-muted/50 rounded-md p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {get_position_label(tire.position, locale)}
                        </Badge>
                        {tire.brand && (
                          <span className="font-medium">{tire.brand}</span>
                        )}
                        {tire.tire_model && (
                          <span className="text-muted-foreground">{tire.tire_model}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        {tire.tire_size && (
                          <div>
                            <span>{t("tire_size")}: </span>
                            <span className="text-foreground">{tire.tire_size}</span>
                          </div>
                        )}
                        {tire.production_week && (
                          <div>
                            <span>{t("production_week")}: </span>
                            <span className="text-foreground">{tire.production_week}</span>
                          </div>
                        )}
                        {tire.price_per_tire && (
                          <div>
                            <span>{t("price_per_tire")}: </span>
                            <span className="text-foreground">
                              {format_currency(tire.price_per_tire)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tire Switches Section */}
            {visit.tire_switches && visit.tire_switches.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  {t("tire_switches")}
                  <Badge variant="secondary" className="ml-auto">
                    {visit.tire_switches.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {visit.tire_switches.map((sw, index) => (
                    <div
                      key={sw.id || index}
                      className="bg-muted/50 rounded-md p-3 text-sm flex items-center gap-2"
                    >
                      <Badge variant="outline">
                        {get_position_label(sw.from_position, locale)}
                      </Badge>
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {get_position_label(sw.to_position, locale)}
                      </Badge>
                      {sw.notes && (
                        <span className="ml-2 text-muted-foreground">{sw.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oil Changes Section */}
            {visit.oil_changes && visit.oil_changes.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  {t("oil_changes")}
                  <Badge variant="secondary" className="ml-auto">
                    {visit.oil_changes.length}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {visit.oil_changes.map((oil, index) => (
                    <div
                      key={oil.id || index}
                      className="bg-muted/50 rounded-md p-3 text-sm"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {oil.oil_model && (
                          <div>
                            <span className="text-muted-foreground">{t("oil_model")}: </span>
                            <span className="font-medium">{oil.oil_model}</span>
                          </div>
                        )}
                        {oil.viscosity && (
                          <div>
                            <span className="text-muted-foreground">{t("viscosity")}: </span>
                            <span>{oil.viscosity}</span>
                          </div>
                        )}
                        {oil.oil_type && (
                          <div>
                            <span className="text-muted-foreground">{t("oil_type")}: </span>
                            <span>{oil.oil_type}</span>
                          </div>
                        )}
                        {oil.engine_type && (
                          <div>
                            <span className="text-muted-foreground">{t("engine_type")}: </span>
                            <span>{oil.engine_type}</span>
                          </div>
                        )}
                        {oil.interval_km && (
                          <div>
                            <span className="text-muted-foreground">{t("interval_km")}: </span>
                            <span>{format_odometer(oil.interval_km)}</span>
                          </div>
                        )}
                        {oil.price && (
                          <div>
                            <span className="text-muted-foreground">{t("oil_price")}: </span>
                            <span>{format_currency(oil.price)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no services */}
            {(!visit.tire_changes || visit.tire_changes.length === 0) &&
              (!visit.tire_switches || visit.tire_switches.length === 0) &&
              (!visit.oil_changes || visit.oil_changes.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  {t("no_services")}
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("not_found")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
