/**
 * Shared utility functions for TireOff application
 */

import type { PaginatedResult, PaginationParams } from "../types";
import {
  SERVICE_INTERVALS,
  TIRE_USAGE_THRESHOLDS,
  type TireUsageStatus,
} from "../constants";

// ============================================
// OTP UTILITIES
// ============================================

/**
 * Generate a random 6-digit OTP code
 *
 * @returns 6-digit string OTP
 */
export function generate_otp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if OTP has expired
 *
 * @param expires_at - Expiration timestamp
 * @returns true if expired
 */
export function is_otp_expired(expires_at: Date): boolean {
  return new Date() > new Date(expires_at);
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format date for Thai display
 *
 * @param date - Date to format
 * @param locale - 'th' or 'en'
 * @returns Formatted date string
 */
export function format_date(date: Date, locale: "th" | "en" = "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format date with time
 *
 * @param date - Date to format
 * @param locale - 'th' or 'en'
 * @returns Formatted datetime string
 */
export function format_datetime(date: Date, locale: "th" | "en" = "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================
// NUMBER UTILITIES
// ============================================

/**
 * Format number with Thai/English locale
 *
 * @param num - Number to format
 * @param locale - 'th' or 'en'
 * @returns Formatted number string
 */
export function format_number(num: number, locale: "th" | "en" = "th"): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US").format(num);
}

/**
 * Format currency (Thai Baht)
 *
 * @param amount - Amount to format
 * @param locale - 'th' or 'en'
 * @returns Formatted currency string
 */
export function format_currency(amount: number, locale: "th" | "en" = "th"): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format odometer reading
 *
 * @param km - Kilometers
 * @returns Formatted string with km suffix
 */
export function format_odometer(km: number): string {
  return `${format_number(km)} km`;
}

// ============================================
// PAGINATION UTILITIES
// ============================================

/**
 * Calculate pagination metadata
 *
 * @param total - Total number of items
 * @param params - Pagination parameters
 * @returns Pagination result object
 */
export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const total_pages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}

/**
 * Calculate skip value for database queries
 *
 * @param page - Current page (1-indexed)
 * @param limit - Items per page
 * @returns Number of items to skip
 */
export function calculate_skip(page: number, limit: number): number {
  return (page - 1) * limit;
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Normalize license plate for storage
 * Removes dashes, trims, and uppercases
 *
 * @param plate - Raw license plate input
 * @returns Normalized plate
 */
export function normalize_license_plate(plate: string): string {
  return plate.replace(/[-]/g, " ").trim().toUpperCase();
}

/**
 * Generate a session token
 *
 * @returns Random session token
 */
export function generate_session_token(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// SMS UTILITIES
// ============================================

export {
  normalize_phone_for_sms,
  request_otp_via_sms,
  verify_otp_via_sms,
  send_sms,
  get_sms_config,
  send_otp,
  type SmsOtpRequestParams,
  type SmsOtpRequestResult,
  type SmsOtpVerifyParams,
  type SmsOtpVerifyResult,
} from "./sms";

// ============================================
// PRODUCTION WEEK UTILITIES
// ============================================

/**
 * Parse tire production week string (WWYY format)
 *
 * @param production_week - e.g., "2523" for week 25 of 2023
 * @returns Object with week and year, or null if invalid
 */
export function parse_production_week(
  production_week: string
): { week: number; year: number } | null {
  if (!/^\d{4}$/.test(production_week)) return null;

  const week = parseInt(production_week.slice(0, 2), 10);
  const year_suffix = parseInt(production_week.slice(2), 10);

  if (week < 1 || week > 53) return null;

  // Assume 2000s century
  const year = 2000 + year_suffix;

  return { week, year };
}

/**
 * Format production week for display
 *
 * @param production_week - e.g., "2523"
 * @param locale - 'th' or 'en'
 * @returns Formatted string like "Week 25, 2023"
 */
export function format_production_week(
  production_week: string,
  locale: "th" | "en" = "th"
): string {
  const parsed = parse_production_week(production_week);
  if (!parsed) return production_week;

  if (locale === "th") {
    return `สัปดาห์ที่ ${parsed.week}, ${parsed.year + 543}`; // Buddhist year
  }
  return `Week ${parsed.week}, ${parsed.year}`;
}

// ============================================
// TIRE USAGE CALCULATION UTILITIES
// ============================================

export interface TireUsageInfo {
  /** Usage percentage (0-100+, can exceed 100 if overdue) */
  usage_percent: number;
  /** Status based on thresholds */
  status: TireUsageStatus;
  /** Distance traveled since tire installation */
  distance_traveled_km: number;
  /** Remaining distance before recommended replacement */
  remaining_km: number;
  /** Days since tire installation */
  days_since_install: number;
}

/**
 * Calculate tire usage percentage and status
 *
 * @param install_odometer_km - Odometer reading when tire was installed
 * @param current_odometer_km - Current odometer reading
 * @param install_date - Date when tire was installed
 * @param tire_lifespan_km - Expected tire lifespan (default from config)
 * @returns Tire usage information
 */
export function calculate_tire_usage(
  install_odometer_km: number,
  current_odometer_km: number,
  install_date: Date,
  tire_lifespan_km: number = SERVICE_INTERVALS.TIRE_LIFESPAN_KM
): TireUsageInfo {
  const distance_traveled_km = current_odometer_km - install_odometer_km;
  const remaining_km = tire_lifespan_km - distance_traveled_km;
  const usage_percent = Math.round((distance_traveled_km / tire_lifespan_km) * 100);

  const now = new Date();
  const install = new Date(install_date);
  const days_since_install = Math.floor(
    (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24)
  );

  let status: TireUsageStatus;
  if (usage_percent > TIRE_USAGE_THRESHOLDS.CRITICAL) {
    status = "overdue";
  } else if (usage_percent > TIRE_USAGE_THRESHOLDS.WARNING) {
    status = "critical";
  } else if (usage_percent > TIRE_USAGE_THRESHOLDS.GOOD) {
    status = "warning";
  } else {
    status = "good";
  }

  return {
    usage_percent: Math.max(0, usage_percent),
    status,
    distance_traveled_km: Math.max(0, distance_traveled_km),
    remaining_km: Math.max(0, remaining_km),
    days_since_install,
  };
}

// ============================================
// NEXT SERVICE RECOMMENDATION UTILITIES
// ============================================

export interface NextServiceRecommendation {
  /** Recommended next service odometer reading */
  next_odometer_km: number;
  /** Recommended next service date */
  next_date: Date;
  /** Is the service overdue? */
  is_overdue: boolean;
  /** Days until next service (negative if overdue) */
  days_until: number;
  /** Km until next service (negative if overdue) */
  km_until: number;
}

/**
 * Calculate next tire switch/rotation recommendation
 *
 * @param last_service_odometer_km - Odometer at last tire switch
 * @param last_service_date - Date of last tire switch
 * @param current_odometer_km - Current odometer reading
 * @returns Next service recommendation
 */
export function calculate_next_tire_switch(
  last_service_odometer_km: number,
  last_service_date: Date,
  current_odometer_km: number
): NextServiceRecommendation {
  const interval_km = SERVICE_INTERVALS.TIRE_SWITCH_INTERVAL_KM;
  const interval_months = SERVICE_INTERVALS.TIRE_SWITCH_INTERVAL_MONTHS;

  const next_odometer_km = last_service_odometer_km + interval_km;

  const last_date = new Date(last_service_date);
  const next_date = new Date(last_date);
  next_date.setMonth(next_date.getMonth() + interval_months);

  const now = new Date();
  const days_until = Math.floor(
    (next_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const km_until = next_odometer_km - current_odometer_km;

  const is_overdue = days_until < 0 || km_until < 0;

  return {
    next_odometer_km,
    next_date,
    is_overdue,
    days_until,
    km_until,
  };
}

/**
 * Calculate next oil change recommendation
 *
 * @param last_service_odometer_km - Odometer at last oil change
 * @param last_service_date - Date of last oil change
 * @param current_odometer_km - Current odometer reading
 * @param interval_km - Custom interval (or use default from oil type)
 * @param interval_months - Custom interval in months (default 6)
 * @returns Next service recommendation
 */
export function calculate_next_oil_change(
  last_service_odometer_km: number,
  last_service_date: Date,
  current_odometer_km: number,
  interval_km: number = SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.SYNTHETIC.km,
  interval_months: number = 6
): NextServiceRecommendation {
  const next_odometer_km = last_service_odometer_km + interval_km;

  const last_date = new Date(last_service_date);
  const next_date = new Date(last_date);
  next_date.setMonth(next_date.getMonth() + interval_months);

  const now = new Date();
  const days_until = Math.floor(
    (next_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const km_until = next_odometer_km - current_odometer_km;

  const is_overdue = days_until < 0 || km_until < 0;

  return {
    next_odometer_km,
    next_date,
    is_overdue,
    days_until,
    km_until,
  };
}

/**
 * Get oil change interval based on oil type
 *
 * @param oil_type - Oil type string from database
 * @returns Interval in km
 */
export function get_oil_interval_km(oil_type: string | null | undefined): number {
  if (!oil_type) return SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.SYNTHETIC.km;

  const normalized = oil_type.toLowerCase();

  if (normalized.includes("สังเคราะห์แท้") || normalized.includes("synthetic")) {
    return SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.SYNTHETIC.km;
  }
  if (normalized.includes("กึ่งสังเคราะห์") || normalized.includes("semi")) {
    return SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.SEMI_SYNTHETIC.km;
  }
  if (normalized.includes("ธรรมดา") || normalized.includes("conventional") || normalized.includes("mineral")) {
    return SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.CONVENTIONAL.km;
  }

  return SERVICE_INTERVALS.OIL_CHANGE_INTERVALS.SYNTHETIC.km;
}

/**
 * Get formatted next service data (for i18n translation in frontend)
 *
 * @param km_until - Km until next service
 * @param days_until - Days until next service
 * @returns Data object for frontend translation
 */
export function get_next_service_data(
  km_until: number,
  days_until: number
): {
  is_overdue: boolean;
  km_until: number;
  days_until: number;
  months_until: number;
  use_months: boolean;
} {
  const is_overdue = km_until < 0 || days_until < 0;
  const months_until = Math.max(0, Math.round(days_until / 30));
  const use_months = days_until > 30;

  return {
    is_overdue,
    km_until: Math.max(0, km_until),
    days_until: Math.max(0, days_until),
    months_until,
    use_months,
  };
}
