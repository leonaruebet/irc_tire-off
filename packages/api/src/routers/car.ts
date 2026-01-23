/**
 * Car management router
 * Handles car registration and management for users
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { create_router, protected_procedure } from "../trpc";
import {
  add_car_schema,
  update_car_schema,
  normalize_license_plate,
  normalize_plate_for_search,
} from "@tireoff/shared";

export const car_router = create_router({
  /**
   * List all cars for current user
   * Supports optional search by license plate (handles dash/space variations)
   *
   * @param search - Optional license plate search (e.g., "กข-1234" or "กข 1234")
   */
  list: protected_procedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      console.log("[Car] List cars", { user_id: ctx.user.id, search: input?.search });

      // Build where clause with optional search
      const where: any = {
        owner_id: ctx.user.id,
        is_deleted: false,
      };

      // If search provided, normalize and filter by license plate
      if (input?.search) {
        const { normalized } = normalize_plate_for_search(input.search);
        console.log("[Car] Search normalized", { original: input.search, normalized });

        // Search with normalized plate (handles กข-1234 vs กข 1234)
        where.OR = [
          { license_plate: { contains: normalized, mode: "insensitive" } },
          { license_plate: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const cars = await ctx.db.car.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
          service_visits: {
            orderBy: { visit_date: "desc" },
            take: 1,
            include: {
              branch: true,
              tire_changes: true,
              oil_changes: true,
            },
          },
        },
      });

    // Transform to include summary data
    const result = cars.map((car) => {
      const last_visit = car.service_visits[0];

      return {
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        car_year: car.car_year,
        car_color: car.car_color,
        car_vin: car.car_vin,
        created_at: car.created_at,
        last_service: last_visit
          ? {
              date: last_visit.visit_date,
              branch: last_visit.branch.name,
              odometer_km: last_visit.odometer_km,
            }
          : null,
        has_tire_changes: last_visit?.tire_changes.length > 0,
        has_oil_changes: last_visit?.oil_changes.length > 0,
      };
    });

    console.log("[Car] List cars completed", {
      user_id: ctx.user.id,
      count: result.length,
    });

    return result;
  }),

  /**
   * Get single car with summary
   */
  get: protected_procedure
    .input(z.object({ car_id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[Car] Get car", { car_id: input.car_id });

      const car = await ctx.db.car.findFirst({
        where: {
          id: input.car_id,
          owner_id: ctx.user.id,
          is_deleted: false,
        },
        include: {
          service_visits: {
            orderBy: { visit_date: "desc" },
            take: 5,
            include: {
              branch: true,
              tire_changes: true,
              tire_switches: true,
              oil_changes: true,
            },
          },
        },
      });

      if (!car) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Car not found",
        });
      }

      // Calculate summary stats
      const all_visits = await ctx.db.serviceVisit.findMany({
        where: { car_id: car.id },
        include: {
          tire_changes: true,
          tire_switches: true,
          oil_changes: true,
        },
        orderBy: { visit_date: "desc" },
      });

      const tire_change_count = all_visits.reduce(
        (sum, v) => sum + v.tire_changes.length,
        0
      );
      const tire_switch_count = all_visits.reduce(
        (sum, v) => sum + v.tire_switches.length,
        0
      );
      const oil_change_count = all_visits.reduce(
        (sum, v) => sum + v.oil_changes.length,
        0
      );

      // Find last tire change date
      const last_tire_visit = all_visits.find((v) => v.tire_changes.length > 0);
      const last_oil_visit = all_visits.find((v) => v.oil_changes.length > 0);

      console.log("[Car] Get car completed", { car_id: input.car_id });

      return {
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        car_year: car.car_year,
        car_color: car.car_color,
        car_vin: car.car_vin,
        created_at: car.created_at,
        stats: {
          total_visits: all_visits.length,
          tire_change_count,
          tire_switch_count,
          oil_change_count,
          last_tire_change: last_tire_visit?.visit_date || null,
          last_oil_change: last_oil_visit?.visit_date || null,
          last_odometer: all_visits[0]?.odometer_km || null,
        },
        recent_visits: car.service_visits.map((v) => ({
          id: v.id,
          date: v.visit_date,
          branch: v.branch.name,
          odometer_km: v.odometer_km,
          total_price: v.total_price,
          services: {
            tire_changes: v.tire_changes.length,
            tire_switches: v.tire_switches.length,
            oil_changes: v.oil_changes.length,
          },
        })),
      };
    }),

  /**
   * Get car by license plate
   * Handles plate format variations (กข-1234 vs กข 1234 vs กข1234)
   *
   * @param license_plate - License plate to search (any format)
   */
  get_by_plate: protected_procedure
    .input(z.object({ license_plate: z.string() }))
    .query(async ({ ctx, input }) => {
      // Normalize the input plate to handle dash/space variations
      const normalized_plate = normalize_license_plate(input.license_plate);
      console.log("[Car] Get car by plate", {
        input: input.license_plate,
        normalized: normalized_plate,
      });

      const car = await ctx.db.car.findFirst({
        where: {
          license_plate: normalized_plate,
          owner_id: ctx.user.id,
          is_deleted: false,
        },
        include: {
          service_visits: {
            orderBy: { visit_date: "desc" },
            take: 1,
            include: {
              branch: true,
            },
          },
        },
      });

      if (!car) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Car not found",
        });
      }

      const last_visit = car.service_visits[0];

      console.log("[Car] Get car by plate completed", { car_id: car.id });

      return {
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        car_year: car.car_year,
        car_color: car.car_color,
        car_vin: car.car_vin,
        created_at: car.created_at,
        last_service: last_visit
          ? {
              date: last_visit.visit_date,
              branch: last_visit.branch.name,
              odometer_km: last_visit.odometer_km,
            }
          : null,
      };
    }),

  /**
   * Add a new car
   */
  add: protected_procedure
    .input(add_car_schema)
    .mutation(async ({ ctx, input }) => {
      console.log("[Car] Add car started", {
        user_id: ctx.user.id,
        plate: input.license_plate,
      });

      const normalized_plate = normalize_license_plate(input.license_plate);

      // Check if plate already exists
      const existing = await ctx.db.car.findUnique({
        where: { license_plate: normalized_plate },
        include: { owner: true },
      });

      if (existing) {
        // Check if it belongs to same user (soft-deleted)
        if (existing.owner_id === ctx.user.id && existing.is_deleted) {
          // Restore the car
          const restored = await ctx.db.car.update({
            where: { id: existing.id },
            data: {
              is_deleted: false,
              car_model: input.car_model || existing.car_model,
              car_year: input.car_year || existing.car_year,
              car_color: input.car_color || existing.car_color,
              car_vin: input.car_vin || existing.car_vin,
              updated_at: new Date(),
            },
          });

          console.log("[Car] Restored soft-deleted car", { car_id: restored.id });

          return {
            id: restored.id,
            license_plate: restored.license_plate,
            car_model: restored.car_model,
            restored: true,
          };
        }

        // Plate belongs to another user
        if (existing.owner_id !== ctx.user.id) {
          console.log("[Car] Plate already registered to another user", {
            plate: normalized_plate,
          });

          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This license plate is already registered to another account. Please contact support if you believe this is an error.",
          });
        }

        // Plate already exists for this user
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have this car registered.",
        });
      }

      // Create new car
      const car = await ctx.db.car.create({
        data: {
          license_plate: normalized_plate,
          car_model: input.car_model,
          car_year: input.car_year,
          car_color: input.car_color,
          car_vin: input.car_vin,
          owner_id: ctx.user.id,
        },
      });

      console.log("[Car] Add car completed", { car_id: car.id });

      return {
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        restored: false,
      };
    }),

  /**
   * Update car details
   * Allows updating optional fields like model, year, color, VIN
   * License plate cannot be changed
   */
  update: protected_procedure
    .input(update_car_schema)
    .mutation(async ({ ctx, input }) => {
      console.log("[Car] Update car started", {
        user_id: ctx.user.id,
        car_id: input.car_id,
      });

      // Verify ownership
      const car = await ctx.db.car.findFirst({
        where: {
          id: input.car_id,
          owner_id: ctx.user.id,
          is_deleted: false,
        },
      });

      if (!car) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Car not found",
        });
      }

      // Update car with provided fields
      const updated = await ctx.db.car.update({
        where: { id: car.id },
        data: {
          car_model: input.car_model !== undefined ? input.car_model : car.car_model,
          car_year: input.car_year !== undefined ? input.car_year : car.car_year,
          car_color: input.car_color !== undefined ? input.car_color : car.car_color,
          car_vin: input.car_vin !== undefined ? input.car_vin : car.car_vin,
          updated_at: new Date(),
        },
      });

      console.log("[Car] Update car completed", { car_id: updated.id });

      return {
        id: updated.id,
        license_plate: updated.license_plate,
        car_model: updated.car_model,
        car_year: updated.car_year,
        car_color: updated.car_color,
        car_vin: updated.car_vin,
      };
    }),

  /**
   * Remove a car (soft delete)
   */
  remove: protected_procedure
    .input(z.object({ car_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[Car] Remove car started", { car_id: input.car_id });

      // Verify ownership
      const car = await ctx.db.car.findFirst({
        where: {
          id: input.car_id,
          owner_id: ctx.user.id,
          is_deleted: false,
        },
      });

      if (!car) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Car not found",
        });
      }

      // Soft delete
      await ctx.db.car.update({
        where: { id: car.id },
        data: {
          is_deleted: true,
          updated_at: new Date(),
        },
      });

      console.log("[Car] Remove car completed", { car_id: input.car_id });

      return { success: true };
    }),
});
