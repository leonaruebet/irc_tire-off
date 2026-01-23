import { z } from "zod";
import { TIRE_POSITIONS } from "../types";

/**
 * Zod validators for TireOff application
 */

// ============================================
// PHONE VALIDATORS
// ============================================

/**
 * Thai phone number validator
 * Accepts formats: 0812345678, 08-1234-5678, 081-234-5678
 */
export const phone_schema = z
  .string()
  .transform((val) => val.replace(/[-\s]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^0[689]\d{8}$/, "Invalid Thai phone number format")
  );

/**
 * Mask phone number for display (e.g., 08x-xxx-x789)
 */
export function mask_phone(phone: string): string {
  const clean = phone.replace(/[-\s]/g, "");
  if (clean.length !== 10) return phone;
  return `${clean.slice(0, 2)}x-xxx-x${clean.slice(7)}`;
}

// ============================================
// LICENSE PLATE VALIDATORS
// ============================================

/**
 * Thai license plate validator
 * Accepts formats:
 * - กข 1234 (standard)
 * - 1กข 1234 (with prefix number)
 * - กข-1234 (with dash)
 */
export const license_plate_schema = z
  .string()
  .transform((val) => val.replace(/[-\s]/g, " ").trim().toUpperCase())
  .pipe(
    z
      .string()
      .min(1, "License plate is required")
      .regex(
        /^(\d)?[ก-ฮ]{1,3}\s?\d{1,4}$/u,
        "Invalid Thai license plate format"
      )
  );

// ============================================
// OTP VALIDATORS
// ============================================

export const otp_schema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only digits");

// ============================================
// AUTH VALIDATORS
// ============================================

export const request_otp_schema = z.object({
  phone: phone_schema,
});

export const verify_otp_schema = z.object({
  phone: phone_schema,
  code: otp_schema,
});

// ============================================
// CAR VALIDATORS
// ============================================

export const add_car_schema = z.object({
  license_plate: license_plate_schema,
  car_model: z.string().max(100).optional(),
  car_year: z.string().max(10).optional(),
  car_color: z.string().max(50).optional(),
  car_vin: z.string().max(50).optional(),
});

/**
 * Update car schema - allows updating optional car fields
 * License plate cannot be changed (use remove and add instead)
 */
export const update_car_schema = z.object({
  car_id: z.string().min(1, "Car ID is required"),
  car_model: z.string().max(100).optional().nullable(),
  car_year: z.string().max(10).optional().nullable(),
  car_color: z.string().max(50).optional().nullable(),
  car_vin: z.string().max(50).optional().nullable(),
});

export const remove_car_schema = z.object({
  car_id: z.string().min(1, "Car ID is required"),
});

// ============================================
// TIRE VALIDATORS
// ============================================

export const tire_position_schema = z.enum(TIRE_POSITIONS);

export const tire_change_schema = z.object({
  position: tire_position_schema,
  tire_size: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  tire_model: z.string().max(100).optional(),
  production_week: z
    .string()
    .regex(/^\d{4}$/, "Production week must be 4 digits (WWYY)")
    .optional(),
  price_per_tire: z.number().positive().optional(),
});

export const tire_switch_schema = z.object({
  from_position: tire_position_schema,
  to_position: tire_position_schema,
  notes: z.string().max(500).optional(),
});

// ============================================
// OIL VALIDATORS
// ============================================

export const oil_change_schema = z.object({
  oil_model: z.string().max(100).optional(),
  viscosity: z.string().max(20).optional(),
  engine_type: z.string().max(50).optional(),
  oil_type: z.string().max(50).optional(),
  interval_km: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
});

// ============================================
// SERVICE VISIT VALIDATORS
// ============================================

export const service_visit_schema = z.object({
  car_id: z.string().min(1, "Car ID is required"),
  branch_id: z.string().min(1, "Branch ID is required"),
  visit_date: z.coerce.date(),
  odometer_km: z.number().int().positive("Odometer must be positive"),
  total_price: z.number().positive().optional(),
  services_note: z.string().max(1000).optional(),
  tire_changes: z.array(tire_change_schema).optional(),
  tire_switches: z.array(tire_switch_schema).optional(),
  oil_change: oil_change_schema.optional(),
});

// ============================================
// PAGINATION VALIDATORS
// ============================================

export const pagination_schema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// SEARCH VALIDATORS
// ============================================

export const search_schema = z.object({
  query: z.string().max(100).optional(),
  license_plate: z.string().max(20).optional(),
  phone: z.string().max(15).optional(),
  branch_id: z.string().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  ...pagination_schema.shape,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RequestOTPInput = z.infer<typeof request_otp_schema>;
export type VerifyOTPInput = z.infer<typeof verify_otp_schema>;
export type AddCarInput = z.infer<typeof add_car_schema>;
export type UpdateCarInput = z.infer<typeof update_car_schema>;
export type TireChangeInput = z.infer<typeof tire_change_schema>;
export type TireSwitchInput = z.infer<typeof tire_switch_schema>;
export type OilChangeInput = z.infer<typeof oil_change_schema>;
export type ServiceVisitInput = z.infer<typeof service_visit_schema>;
export type PaginationInput = z.infer<typeof pagination_schema>;
export type SearchInput = z.infer<typeof search_schema>;
