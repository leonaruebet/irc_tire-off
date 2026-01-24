"use client";

import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Disc3,
  Calendar,
  Gauge,
  MapPin,
  CircleDollarSign,
} from "lucide-react";
import { format_date, format_number, TIRE_POSITION_LABELS } from "@tireoff/shared";

/**
 * Tire data interface for display
 */
interface TireData {
  brand: string | null;
  tire_model: string | null;
  tire_size: string | null;
  production_week: string | null;
  price_per_tire: number | null;
}

/**
 * Single tire info for the detail display
 */
interface TireInfo {
  position: string;
  has_data: boolean;
  tire?: TireData;
  install_date?: Date;
  install_odometer_km?: number;
  branch_name?: string;
}

interface TireDetailDialogProps {
  tire_info: TireInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

/**
 * Dialog for viewing tire detail information
 * Displays tire brand, model, size, production week, price, install date, odometer, and branch
 * Uses i18n for all text content
 */
export function TireDetailDialog({
  tire_info,
  open,
  onOpenChange,
}: TireDetailDialogProps) {
  console.log("[TireDetailDialog] Rendering", { tire_info, open });

  const t = useTranslations("tire");
  const locale = useLocale();

  // Get position label with fallback
  const position_label = tire_info
    ? get_position_label(tire_info.position, locale)
    : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc3 className="h-5 w-5" />
            {t("detail_title")}
          </DialogTitle>
        </DialogHeader>

        {!tire_info || !tire_info.has_data || !tire_info.tire ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("detail_no_data")}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Position Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("detail_position")}:</span>
              <Badge variant="outline" className="font-semibold">
                {position_label} ({tire_info.position})
              </Badge>
            </div>

            {/* Tire Brand and Model */}
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground min-w-fit">{t("detail_brand_model")}:</span>
              <span className="text-sm font-medium">
                {[tire_info.tire.brand, tire_info.tire.tire_model].filter(Boolean).join(" ") || "-"}
              </span>
            </div>

            {/* Tire Size */}
            {tire_info.tire.tire_size && (
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground min-w-fit">{t("detail_size")}:</span>
                <span className="text-sm">{tire_info.tire.tire_size}</span>
              </div>
            )}

            {/* Production Week */}
            {tire_info.tire.production_week && (
              <div className="flex items-start gap-2">
                <span className="text-sm text-muted-foreground min-w-fit">{t("detail_production_week")}:</span>
                <span className="text-sm">{tire_info.tire.production_week}</span>
              </div>
            )}

            {/* Price Per Tire */}
            {tire_info.tire.price_per_tire && (
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("detail_price_per_tire")}:</span>
                <span className="text-sm font-medium">
                  {format_number(tire_info.tire.price_per_tire)} บาท
                </span>
              </div>
            )}

            {/* Install Date with Days Ago */}
            {tire_info.install_date && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("detail_installed_date")}:</span>
                  <span className="text-sm">{format_date(tire_info.install_date)}</span>
                </div>
                {/* Days ago in year/month format */}
                {(() => {
                  const days_ago = Math.floor((Date.now() - tire_info.install_date.getTime()) / (1000 * 60 * 60 * 24));
                  const years = Math.floor(days_ago / 365);
                  const months = Math.floor((days_ago % 365) / 30);
                  const remaining_days = days_ago % 30;

                  let ago_text = "";
                  if (years > 0) {
                    ago_text += locale === "th"
                      ? `${years} ${years === 1 ? "ปี" : "ปี"}`
                      : `${years} ${years === 1 ? "year" : "years"}`;
                  }
                  if (months > 0) {
                    if (ago_text) ago_text += " ";
                    ago_text += locale === "th"
                      ? `${months} ${months === 1 ? "เดือน" : "เดือน"}`
                      : `${months} ${months === 1 ? "month" : "months"}`;
                  }
                  if (remaining_days > 0 && years === 0 && months === 0) {
                    if (ago_text) ago_text += " ";
                    ago_text += locale === "th"
                      ? `${remaining_days} ${remaining_days === 1 ? "วัน" : "วัน"}`
                      : `${remaining_days} ${remaining_days === 1 ? "day" : "days"}`;
                  }

                  return (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-xs text-muted-foreground">
                        ({locale === "th" ? "ผ่านมาแล้ว " : ""}{ago_text})
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Install Odometer */}
            {tire_info.install_odometer_km !== undefined && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("detail_installed_km")}:</span>
                <span className="text-sm">{format_number(tire_info.install_odometer_km)}</span>
              </div>
            )}

            {/* Branch */}
            {tire_info.branch_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("detail_branch")}:</span>
                <span className="text-sm">{tire_info.branch_name}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
