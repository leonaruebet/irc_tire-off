/**
 * Shared constants for TireOff application
 */

// ============================================
// OTP CONFIGURATION
// ============================================

export const OTP_CONFIG = {
  /** OTP code length */
  CODE_LENGTH: 6,
  /** OTP expiry in minutes */
  EXPIRY_MINUTES: 5,
  /** Cooldown between OTP requests in seconds */
  COOLDOWN_SECONDS: 60,
  /** Max verification attempts before lockout */
  MAX_ATTEMPTS: 5,
  /** Development bypass code - only works when NODE_ENV !== 'production' */
  DEV_BYPASS_CODE: "000000",
} as const;

// ============================================
// SESSION CONFIGURATION
// ============================================

export const SESSION_CONFIG = {
  /** Session expiry in days */
  EXPIRY_DAYS: 30,
  /** Cookie name for session token */
  COOKIE_NAME: "tireoff_session",
} as const;

// ============================================
// PAGINATION DEFAULTS
// ============================================

export const PAGINATION_CONFIG = {
  /** Default page size */
  DEFAULT_LIMIT: 20,
  /** Maximum page size */
  MAX_LIMIT: 100,
} as const;

// ============================================
// ADMIN ROLES
// ============================================

export const ADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

// ============================================
// IMPORT STATUS
// ============================================

export const IMPORT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];

// ============================================
// SUPPORTED LOCALES
// ============================================

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";

// ============================================
// API ROUTES
// ============================================

export const API_ROUTES = {
  TRPC: "/api/trpc",
  AUTH: {
    REQUEST_OTP: "/api/auth/request-otp",
    VERIFY_OTP: "/api/auth/verify-otp",
    LOGOUT: "/api/auth/logout",
  },
} as const;

// ============================================
// APP ROUTES
// ============================================

export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CARS: "/cars",
  CAR_DETAIL: (id: string) => `/cars/${id}`,
  TIRE_HISTORY: (car_id: string) => `/cars/${car_id}/tires`,
  SWITCH_HISTORY: (car_id: string) => `/cars/${car_id}/switches`,
  OIL_HISTORY: (car_id: string) => `/cars/${car_id}/oil`,
  ADMIN: {
    DASHBOARD: "/admin",
    LOGIN: "/admin/login",
    SERVICES: "/admin/services",
    IMPORT: "/admin/import",
    BRANCHES: "/admin/branches",
  },
} as const;

// ============================================
// SERVICE INTERVAL CONFIGURATION
// ============================================

export const SERVICE_INTERVALS = {
  /** Default tire lifespan in km (ระยะทางที่ยางควรใช้ได้) */
  TIRE_LIFESPAN_KM: 50000,
  /** Tire switch/rotation interval in km */
  TIRE_SWITCH_INTERVAL_KM: 10000,
  /** Tire switch/rotation interval in months */
  TIRE_SWITCH_INTERVAL_MONTHS: 6,
  /** Oil change intervals by oil type */
  OIL_CHANGE_INTERVALS: {
    /** สังเคราะห์แท้ (Fully Synthetic) */
    SYNTHETIC: { km: 10000, months: 6 },
    /** กึ่งสังเคราะห์ (Semi-Synthetic) */
    SEMI_SYNTHETIC: { km: 7000, months: 6 },
    /** ธรรมดา (Conventional/Mineral) */
    CONVENTIONAL: { km: 5000, months: 6 },
  },
} as const;

// ============================================
// TIRE POSITION LABELS
// ============================================

export const TIRE_POSITION_LABELS = {
  FL: { th: "หน้าซ้าย", en: "Front Left" },
  FR: { th: "หน้าขวา", en: "Front Right" },
  RL: { th: "หลังซ้าย", en: "Rear Left" },
  RR: { th: "หลังขวา", en: "Rear Right" },
  SP: { th: "อะไหล่", en: "Spare" },
} as const;

export type TirePosition = keyof typeof TIRE_POSITION_LABELS;

// ============================================
// TIRE USAGE STATUS THRESHOLDS
// ============================================

export const TIRE_USAGE_THRESHOLDS = {
  /** Good condition (สภาพดี) - 0-50% */
  GOOD: 50,
  /** Warning condition (เริ่มสึก) - 50-80% */
  WARNING: 80,
  /** Critical condition (ควรเปลี่ยน) - 80-100% */
  CRITICAL: 100,
} as const;

export type TireUsageStatus = "good" | "warning" | "critical" | "overdue";

// ============================================
// OIL TYPE LABELS
// ============================================

export const OIL_TYPE_LABELS = {
  SYNTHETIC: { th: "สังเคราะห์แท้", en: "Fully Synthetic" },
  SEMI_SYNTHETIC: { th: "กึ่งสังเคราะห์", en: "Semi-Synthetic" },
  CONVENTIONAL: { th: "ธรรมดา", en: "Conventional" },
} as const;

export type OilType = keyof typeof OIL_TYPE_LABELS;
