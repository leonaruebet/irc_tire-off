/**
 * Shared TypeScript types for TireOff application
 */

import type { TirePosition } from "../constants";

// ============================================
// TIRE POSITION TYPES
// Note: TIRE_POSITION_LABELS and TirePosition are defined in constants/index.ts
// ============================================

export const TIRE_POSITIONS = ["FL", "FR", "RL", "RR", "SP"] as const;

// ============================================
// SERVICE TYPES
// ============================================

export type ServiceType = "tire_change" | "tire_switch" | "oil_change" | "other";

// ============================================
// USER & AUTH TYPES
// ============================================

export interface UserSession {
  user_id: string;
  phone: string;
  phone_masked: string;
  expires_at: Date;
}

export interface OTPRequestResult {
  success: boolean;
  cooldown_seconds?: number;
  error?: string;
}

export interface OTPVerifyResult {
  success: boolean;
  session_token?: string;
  error?: string;
  attempts_remaining?: number;
}

// ============================================
// CAR TYPES
// ============================================

export interface CarSummary {
  id: string;
  license_plate: string;
  car_model?: string;
  last_service_date?: Date;
  last_tire_change_date?: Date;
  last_oil_change_date?: Date;
  last_odometer_km?: number;
}

// ============================================
// SERVICE HISTORY TYPES
// ============================================

export interface TireChangeRecord {
  id: string;
  visit_date: Date;
  branch_name: string;
  odometer_km: number;
  position: TirePosition;
  tire_size?: string;
  brand?: string;
  tire_model?: string;
  production_week?: string;
  price_per_tire?: number;
}

export interface TireSwitchRecord {
  id: string;
  visit_date: Date;
  branch_name: string;
  odometer_km: number;
  from_position: TirePosition;
  to_position: TirePosition;
  notes?: string;
}

export interface OilChangeRecord {
  id: string;
  visit_date: Date;
  branch_name: string;
  odometer_km: number;
  oil_model?: string;
  viscosity?: string;
  engine_type?: string;
  oil_type?: string;
  interval_km?: number;
  price?: number;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
