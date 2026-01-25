"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, CircleDot, Calendar, Clock } from "lucide-react";
import { format_date, format_days_as_duration, type TireUsageStatus } from "@tireoff/shared";

/**
 * Tire data interface for visual display
 */
interface TireData {
  brand: string | null;
  tire_model: string | null;
  tire_size: string | null;
  production_week: string | null;
  price_per_tire: number | null;
}

/**
 * Tire usage info interface
 */
interface TireUsageInfo {
  usage_percent: number;
  status: TireUsageStatus;
  distance_traveled_km: number;
  remaining_km: number;
  days_since_install: number;
}

/**
 * Single tire status for the visual display
 */
interface TireStatus {
  position: string;
  has_data: boolean;
  tire?: TireData;
  install_date?: Date;
  install_odometer_km?: number;
  branch_name?: string;
  usage?: TireUsageInfo;
}

interface TireStatusVisualProps {
  /** Array of 4 tire statuses (FL, FR, RL, RR) */
  tires: TireStatus[];
}

/**
 * Get position translation key from position code
 *
 * @param position - Position code (FL, FR, RL, RR, SP)
 * @returns Translation key
 */
function get_position_key(position: string): string {
  console.log("[get_position_key] Mapping position", { position });
  const map: Record<string, string> = {
    FL: "position_fl",
    FR: "position_fr",
    RL: "position_rl",
    RR: "position_rr",
    SP: "position_sp",
  };
  return map[position] || position;
}

/**
 * Get English position name for clear display
 *
 * @param position - Position code (FL, FR, RL, RR)
 * @returns English position string e.g. "FRONT LEFT"
 */
function get_english_position(position: string): string {
  const position_map: Record<string, string> = {
    FL: "FRONT LEFT",
    FR: "FRONT RIGHT",
    RL: "REAR LEFT",
    RR: "REAR RIGHT",
    SP: "SPARE",
  };
  return position_map[position] || position;
}

/**
 * Get status color classes based on tire usage status
 *
 * @param status - Tire usage status
 * @returns Tailwind CSS classes for styling
 */
function get_status_classes(status: TireUsageStatus): {
  bg: string;
  text: string;
  progress: string;
  border: string;
  icon: typeof CheckCircle;
} {
  console.log("[get_status_classes] Getting classes for status", { status });
  switch (status) {
    case "good":
      return {
        bg: "bg-white",
        text: "text-blue-600",
        progress: "bg-blue-500",
        border: "border-gray-200",
        icon: CheckCircle,
      };
    case "warning":
      return {
        bg: "bg-white",
        text: "text-orange-500",
        progress: "bg-orange-400",
        border: "border-orange-200",
        icon: AlertTriangle,
      };
    case "critical":
      return {
        bg: "bg-white",
        text: "text-orange-600",
        progress: "bg-orange-500",
        border: "border-orange-300",
        icon: AlertTriangle,
      };
    case "overdue":
      return {
        bg: "bg-white",
        text: "text-red-600",
        progress: "bg-red-500",
        border: "border-red-300",
        icon: XCircle,
      };
    default:
      return {
        bg: "bg-white",
        text: "text-gray-600",
        progress: "bg-gray-400",
        border: "border-gray-200",
        icon: CircleDot,
      };
  }
}

/**
 * Individual tire card component for the visual layout
 *
 * @param props - Tire status data and position
 * @returns Styled tire card with usage info
 */
function TireCard({ tire }: { tire: TireStatus }) {
  const t = useTranslations("tire");
  console.log("[TireCard] Rendering", { position: tire.position, has_data: tire.has_data });

  const status = tire.usage?.status || "good";
  const classes = get_status_classes(status);
  const StatusIcon = classes.icon;
  const usage_percent = tire.usage?.usage_percent || 0;
  const remaining_km = tire.usage?.remaining_km || 0;

  if (!tire.has_data) {
    return (
      <Card className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <CircleDot className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t(get_position_key(tire.position))}
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-400">--</div>
        <div className="text-xs text-gray-400 mt-1">%</div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "p-4 rounded-xl shadow-sm border transition-all",
      classes.bg,
      classes.border
    )}>
      {/* Header with icon and position */}
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={cn("h-4 w-4", classes.text)} />
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {t(get_position_key(tire.position))}
        </span>
      </div>

      {/* Usage percentage - large display */}
      <div className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-bold", classes.text)}>
          {Math.round(100 - usage_percent)}
        </span>
        <span className="text-sm text-gray-500">%</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", classes.progress)}
          style={{ width: `${Math.min(100 - usage_percent, 100)}%` }}
        />
      </div>

      {/* Remaining km */}
      <div className="mt-2 text-xs text-gray-500">
        {t("remaining_km", { km: remaining_km.toLocaleString() })}
      </div>
    </Card>
  );
}

/**
 * Car silhouette SVG component (top-down view)
 * Realistic sedan representation from above
 *
 * @returns SVG representation of a car from above
 */
function CarSilhouette() {
  console.log("[CarSilhouette] Rendering car SVG");
  return (
    <svg
      viewBox="0 0 180 360"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow under car */}
      <ellipse
        cx="90"
        cy="185"
        rx="75"
        ry="165"
        className="fill-sky-100/40"
      />

      {/* Main car body outline - sedan shape */}
      <path
        d="M40 70
           C40 45 55 25 90 25
           C125 25 140 45 140 70
           L145 100
           L150 120
           L150 260
           L145 280
           L140 300
           C140 325 125 345 90 345
           C55 345 40 325 40 300
           L35 280
           L30 260
           L30 120
           L35 100
           Z"
        className="fill-sky-100 stroke-sky-300"
        strokeWidth="2"
      />

      {/* Hood section */}
      <path
        d="M45 85
           C45 60 60 40 90 40
           C120 40 135 60 135 85
           L138 105
           L42 105
           Z"
        className="fill-sky-200/80 stroke-sky-300"
        strokeWidth="1"
      />

      {/* Front windshield */}
      <path
        d="M50 105
           L48 75
           C48 58 65 48 90 48
           C115 48 132 58 132 75
           L130 105
           Z"
        className="fill-white/80 stroke-sky-300"
        strokeWidth="1.5"
      />

      {/* Roof / cabin area */}
      <rect
        x="45"
        y="108"
        width="90"
        height="110"
        rx="8"
        className="fill-sky-200 stroke-sky-300"
        strokeWidth="1"
      />

      {/* Side windows left */}
      <path
        d="M48 115 L48 210 Q48 215 53 215 L53 115 Q53 112 50 112 Z"
        className="fill-white/70 stroke-sky-300"
        strokeWidth="0.5"
      />

      {/* Side windows right */}
      <path
        d="M132 115 L132 210 Q132 215 127 215 L127 115 Q127 112 130 112 Z"
        className="fill-white/70 stroke-sky-300"
        strokeWidth="0.5"
      />

      {/* Rear windshield */}
      <path
        d="M55 220
           L52 270
           C52 282 68 295 90 295
           C112 295 128 282 128 270
           L125 220
           Z"
        className="fill-white/80 stroke-sky-300"
        strokeWidth="1.5"
      />

      {/* Trunk section */}
      <path
        d="M50 275
           C50 305 65 330 90 330
           C115 330 130 305 130 275
           L128 260
           L52 260
           Z"
        className="fill-sky-200/80 stroke-sky-300"
        strokeWidth="1"
      />

      {/* Center line on roof */}
      <line
        x1="90"
        y1="115"
        x2="90"
        y2="210"
        className="stroke-sky-300/50"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Left side mirror */}
      <ellipse
        cx="28"
        cy="105"
        rx="8"
        ry="12"
        className="fill-sky-200 stroke-sky-300"
        strokeWidth="1.5"
      />
      <line
        x1="36"
        y1="105"
        x2="45"
        y2="108"
        className="stroke-sky-300"
        strokeWidth="2"
      />

      {/* Right side mirror */}
      <ellipse
        cx="152"
        cy="105"
        rx="8"
        ry="12"
        className="fill-sky-200 stroke-sky-300"
        strokeWidth="1.5"
      />
      <line
        x1="144"
        y1="105"
        x2="135"
        y2="108"
        className="stroke-sky-300"
        strokeWidth="2"
      />

      {/* Front headlights */}
      <ellipse
        cx="55"
        cy="45"
        rx="10"
        ry="6"
        className="fill-white stroke-sky-300"
        strokeWidth="1"
      />
      <ellipse
        cx="125"
        cy="45"
        rx="10"
        ry="6"
        className="fill-white stroke-sky-300"
        strokeWidth="1"
      />

      {/* Rear taillights */}
      <ellipse
        cx="55"
        cy="325"
        rx="10"
        ry="5"
        className="fill-red-300 stroke-sky-300"
        strokeWidth="1"
      />
      <ellipse
        cx="125"
        cy="325"
        rx="10"
        ry="5"
        className="fill-red-300 stroke-sky-300"
        strokeWidth="1"
      />

      {/* Front wheel arch left */}
      <path
        d="M30 65 L30 120 Q30 130 35 130 L35 55 Q35 50 30 55 Z"
        className="fill-sky-300/30 stroke-sky-400"
        strokeWidth="1"
      />

      {/* Front wheel arch right */}
      <path
        d="M150 65 L150 120 Q150 130 145 130 L145 55 Q145 50 150 55 Z"
        className="fill-sky-300/30 stroke-sky-400"
        strokeWidth="1"
      />

      {/* Rear wheel arch left */}
      <path
        d="M30 235 L30 295 Q30 305 35 305 L35 225 Q35 220 30 225 Z"
        className="fill-sky-300/30 stroke-sky-400"
        strokeWidth="1"
      />

      {/* Rear wheel arch right */}
      <path
        d="M150 235 L150 295 Q150 305 145 305 L145 225 Q145 220 150 225 Z"
        className="fill-sky-300/30 stroke-sky-400"
        strokeWidth="1"
      />

      {/* Front Left wheel (FL) */}
      <g>
        <rect
          x="8"
          y="65"
          width="22"
          height="55"
          rx="6"
          className="fill-sky-400 stroke-sky-500"
          strokeWidth="2"
        />
        <rect
          x="12"
          y="70"
          width="14"
          height="45"
          rx="4"
          className="fill-sky-300"
        />
        {/* Tire tread */}
        <line x1="12" y1="78" x2="26" y2="78" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="88" x2="26" y2="88" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="98" x2="26" y2="98" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="108" x2="26" y2="108" className="stroke-sky-400" strokeWidth="1" />
      </g>

      {/* Front Right wheel (FR) */}
      <g>
        <rect
          x="150"
          y="65"
          width="22"
          height="55"
          rx="6"
          className="fill-sky-400 stroke-sky-500"
          strokeWidth="2"
        />
        <rect
          x="154"
          y="70"
          width="14"
          height="45"
          rx="4"
          className="fill-sky-300"
        />
        {/* Tire tread */}
        <line x1="154" y1="78" x2="168" y2="78" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="88" x2="168" y2="88" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="98" x2="168" y2="98" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="108" x2="168" y2="108" className="stroke-sky-400" strokeWidth="1" />
      </g>

      {/* Rear Left wheel (RL) */}
      <g>
        <rect
          x="8"
          y="240"
          width="22"
          height="55"
          rx="6"
          className="fill-sky-400 stroke-sky-500"
          strokeWidth="2"
        />
        <rect
          x="12"
          y="245"
          width="14"
          height="45"
          rx="4"
          className="fill-sky-300"
        />
        {/* Tire tread */}
        <line x1="12" y1="253" x2="26" y2="253" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="263" x2="26" y2="263" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="273" x2="26" y2="273" className="stroke-sky-400" strokeWidth="1" />
        <line x1="12" y1="283" x2="26" y2="283" className="stroke-sky-400" strokeWidth="1" />
      </g>

      {/* Rear Right wheel (RR) */}
      <g>
        <rect
          x="150"
          y="240"
          width="22"
          height="55"
          rx="6"
          className="fill-sky-400 stroke-sky-500"
          strokeWidth="2"
        />
        <rect
          x="154"
          y="245"
          width="14"
          height="45"
          rx="4"
          className="fill-sky-300"
        />
        {/* Tire tread */}
        <line x1="154" y1="253" x2="168" y2="253" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="263" x2="168" y2="263" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="273" x2="168" y2="273" className="stroke-sky-400" strokeWidth="1" />
        <line x1="154" y1="283" x2="168" y2="283" className="stroke-sky-400" strokeWidth="1" />
      </g>

      {/* Door lines */}
      <line
        x1="45"
        y1="130"
        x2="45"
        y2="190"
        className="stroke-sky-300"
        strokeWidth="1"
      />
      <line
        x1="135"
        y1="130"
        x2="135"
        y2="190"
        className="stroke-sky-300"
        strokeWidth="1"
      />

      {/* Front grille */}
      <rect
        x="75"
        y="30"
        width="30"
        height="8"
        rx="2"
        className="fill-sky-300 stroke-sky-400"
        strokeWidth="1"
      />

      {/* Rear license plate area */}
      <rect
        x="70"
        y="335"
        width="40"
        height="8"
        rx="2"
        className="fill-white stroke-sky-300"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Calculate days between two dates
 *
 * @param from_date - Start date
 * @returns Number of days since the given date
 */
function calculate_days_since(from_date: Date): number {
  const now = new Date();
  const install = new Date(from_date);
  const diff_ms = now.getTime() - install.getTime();
  return Math.floor(diff_ms / (1000 * 60 * 60 * 24));
}

/**
 * Compact tire card for overlay display
 * Shows position, last change date, duration, and odometer
 *
 * @param props - Tire status data
 * @returns Compact styled tire card with date info
 */
function TireCardCompact({ tire }: { tire: TireStatus }) {
  const t = useTranslations("tire");
  const locale = useLocale() as "th" | "en";
  console.log("[TireCardCompact] Rendering", { position: tire.position, has_data: tire.has_data });

  const english_position = get_english_position(tire.position);

  if (!tire.has_data || !tire.install_date) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 p-2.5 rounded-lg shadow-lg">
        {/* Position header */}
        <div className="text-[10px] font-bold text-primary mb-1">{english_position}</div>
        <div className="text-[9px] text-muted-foreground mb-1.5">{t(get_position_key(tire.position))}</div>
        <div className="text-sm font-medium text-gray-400">--</div>
      </Card>
    );
  }

  // Calculate days directly from install_date to ensure consistency
  const days_since = calculate_days_since(tire.install_date);
  // Format days as human-readable duration (e.g., "1 ปี 3 เดือน" or "1 year 3 months")
  const duration_text = format_days_as_duration(days_since, locale);

  return (
    <Card className="p-2.5 rounded-lg shadow-lg border border-sky-200 bg-white/95 backdrop-blur-sm">
      {/* Position header */}
      <div className="text-[10px] font-bold text-primary mb-0.5">{english_position}</div>
      <div className="text-[9px] text-muted-foreground mb-1.5">{t(get_position_key(tire.position))}</div>

      {/* Last changed label with date */}
      <div className="flex items-center gap-1 text-gray-500 mb-0.5">
        <Calendar className="h-2.5 w-2.5 text-sky-500" />
        <span className="text-[9px]">{t("last_changed")}:</span>
      </div>

      {/* Date display */}
      <div className="text-[10px] font-medium text-gray-700 mb-1">
        {format_date(tire.install_date, locale)}
      </div>

      {/* Duration since changed (in year/month format) */}
      <div className="flex items-center gap-1 text-sky-600 mb-1">
        <Clock className="h-2.5 w-2.5" />
        <span className="text-[9px] font-medium">
          {duration_text}
        </span>
      </div>

      {/* Odometer */}
      {tire.install_odometer_km && (
        <div className="text-[9px] text-gray-500">
          {t("installed_km")}: {tire.install_odometer_km.toLocaleString()} {locale === "th" ? "กม." : "km"}
        </div>
      )}
    </Card>
  );
}

/**
 * Visual tire status component with car in center
 * Shows a top-down car view with 4 tire status cards overlapping on the car
 * - Front tires (FL, FR) positioned over front wheels
 * - Rear tires (RL, RR) positioned over rear wheels
 *
 * @param props - Array of 4 tire statuses
 * @returns Visual car tire status layout with overlay cards
 */
export function TireStatusVisual({ tires }: TireStatusVisualProps) {
  console.log("[TireStatusVisual] Rendering with tires", { count: tires.length });

  // Find tires by position
  const tire_fl = tires.find((t) => t.position === "FL");
  const tire_fr = tires.find((t) => t.position === "FR");
  const tire_rl = tires.find((t) => t.position === "RL");
  const tire_rr = tires.find((t) => t.position === "RR");

  // Default tire status for missing data
  const default_tire = (position: string): TireStatus => ({
    position,
    has_data: false,
  });

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Car silhouette - large and centered */}
      <div className="flex justify-center">
        <div className="w-[280px] h-[500px]">
          <CarSilhouette />
        </div>
      </div>

      {/* Tire cards overlaid on top of car */}
      {/* Front Left (FL) - top left */}
      <div className="absolute top-[60px] left-0 w-[110px]">
        <TireCardCompact tire={tire_fl || default_tire("FL")} />
      </div>

      {/* Front Right (FR) - top right */}
      <div className="absolute top-[60px] right-0 w-[110px]">
        <TireCardCompact tire={tire_fr || default_tire("FR")} />
      </div>

      {/* Rear Left (RL) - bottom left */}
      <div className="absolute bottom-[60px] left-0 w-[110px]">
        <TireCardCompact tire={tire_rl || default_tire("RL")} />
      </div>

      {/* Rear Right (RR) - bottom right */}
      <div className="absolute bottom-[60px] right-0 w-[110px]">
        <TireCardCompact tire={tire_rr || default_tire("RR")} />
      </div>
    </div>
  );
}
