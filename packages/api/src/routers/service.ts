/**
 * Service history router
 * Handles tire change, tire switch, and oil change history queries
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { create_router, protected_procedure } from "../trpc";
import {
  pagination_schema,
  calculate_skip,
  paginate,
  calculate_tire_usage,
  calculate_next_tire_switch,
  calculate_next_oil_change,
  get_oil_interval_km,
  get_next_service_data,
  type TireUsageInfo,
  type NextServiceRecommendation,
} from "@tireoff/shared";

export const service_router = create_router({
  /**
   * Get tire change history for a car
   */
  tire_changes: protected_procedure
    .input(
      z.object({
        car_id: z.string(),
        ...pagination_schema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get tire changes", { car_id: input.car_id });

      // Verify car ownership
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

      // Get tire changes with pagination
      const [records, total] = await Promise.all([
        ctx.db.tireChange.findMany({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
          include: {
            service_visit: {
              include: {
                branch: true,
              },
            },
          },
          orderBy: {
            service_visit: {
              visit_date: "desc",
            },
          },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.tireChange.count({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
        }),
      ]);

      const data = records.map((r) => ({
        id: r.id,
        visit_date: r.service_visit.visit_date,
        branch_name: r.service_visit.branch.name,
        odometer_km: r.service_visit.odometer_km,
        position: r.position,
        tire_size: r.tire_size,
        brand: r.brand,
        tire_model: r.tire_model,
        production_week: r.production_week,
        price_per_tire: r.price_per_tire,
      }));

      console.log("[Service] Get tire changes completed", {
        car_id: input.car_id,
        count: data.length,
      });

      return paginate(data, total, input);
    }),

  /**
   * Get tire switch/rotation history for a car
   */
  tire_switches: protected_procedure
    .input(
      z.object({
        car_id: z.string(),
        ...pagination_schema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get tire switches", { car_id: input.car_id });

      // Verify car ownership
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

      // Get tire switches with pagination
      const [records, total] = await Promise.all([
        ctx.db.tireSwitch.findMany({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
          include: {
            service_visit: {
              include: {
                branch: true,
              },
            },
          },
          orderBy: {
            service_visit: {
              visit_date: "desc",
            },
          },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.tireSwitch.count({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
        }),
      ]);

      const data = records.map((r) => ({
        id: r.id,
        visit_date: r.service_visit.visit_date,
        branch_name: r.service_visit.branch.name,
        odometer_km: r.service_visit.odometer_km,
        from_position: r.from_position,
        to_position: r.to_position,
        notes: r.notes,
      }));

      console.log("[Service] Get tire switches completed", {
        car_id: input.car_id,
        count: data.length,
      });

      return paginate(data, total, input);
    }),

  /**
   * Get oil change history for a car
   */
  oil_changes: protected_procedure
    .input(
      z.object({
        car_id: z.string(),
        ...pagination_schema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get oil changes", { car_id: input.car_id });

      // Verify car ownership
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

      // Get oil changes with pagination
      const [records, total] = await Promise.all([
        ctx.db.oilChange.findMany({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
          include: {
            service_visit: {
              include: {
                branch: true,
              },
            },
          },
          orderBy: {
            service_visit: {
              visit_date: "desc",
            },
          },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.oilChange.count({
          where: {
            service_visit: {
              car_id: input.car_id,
            },
          },
        }),
      ]);

      const data = records.map((r) => ({
        id: r.id,
        visit_date: r.service_visit.visit_date,
        branch_name: r.service_visit.branch.name,
        odometer_km: r.service_visit.odometer_km,
        oil_model: r.oil_model,
        viscosity: r.viscosity,
        engine_type: r.engine_type,
        oil_type: r.oil_type,
        interval_km: r.interval_km,
        price: r.price,
      }));

      console.log("[Service] Get oil changes completed", {
        car_id: input.car_id,
        count: data.length,
      });

      return paginate(data, total, input);
    }),

  /**
   * Get service visit details
   */
  visit_detail: protected_procedure
    .input(z.object({ visit_id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get visit detail", { visit_id: input.visit_id });

      const visit = await ctx.db.serviceVisit.findFirst({
        where: {
          id: input.visit_id,
          car: {
            owner_id: ctx.user.id,
            is_deleted: false,
          },
        },
        include: {
          car: true,
          branch: true,
          tire_changes: true,
          tire_switches: true,
          oil_changes: true,
        },
      });

      if (!visit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service visit not found",
        });
      }

      console.log("[Service] Get visit detail completed", {
        visit_id: input.visit_id,
      });

      return {
        id: visit.id,
        visit_date: visit.visit_date,
        branch: {
          id: visit.branch.id,
          name: visit.branch.name,
          address: visit.branch.address,
        },
        car: {
          id: visit.car.id,
          license_plate: visit.car.license_plate,
          car_model: visit.car.car_model,
        },
        odometer_km: visit.odometer_km,
        total_price: visit.total_price,
        services_note: visit.services_note,
        tire_changes: visit.tire_changes.map((t) => ({
          position: t.position,
          tire_size: t.tire_size,
          brand: t.brand,
          tire_model: t.tire_model,
          production_week: t.production_week,
          price_per_tire: t.price_per_tire,
        })),
        tire_switches: visit.tire_switches.map((t) => ({
          from_position: t.from_position,
          to_position: t.to_position,
          notes: t.notes,
        })),
        oil_changes: visit.oil_changes.map((o) => ({
          oil_model: o.oil_model,
          viscosity: o.viscosity,
          engine_type: o.engine_type,
          oil_type: o.oil_type,
          interval_km: o.interval_km,
          price: o.price,
        })),
      };
    }),

  /**
   * Get tire status overview for a car
   * Returns current tire status per position with usage % and next service recommendations
   */
  tire_status: protected_procedure
    .input(
      z.object({
        car_id: z.string(),
        current_odometer_km: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get tire status", { car_id: input.car_id });

      // Verify car ownership
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

      // Get latest tire changes per position
      const tire_positions = ["FL", "FR", "RL", "RR"] as const;
      const tire_status_promises = tire_positions.map(async (position) => {
        const latest_tire = await ctx.db.tireChange.findFirst({
          where: {
            position,
            service_visit: {
              car_id: input.car_id,
            },
          },
          include: {
            service_visit: {
              include: {
                branch: true,
              },
            },
          },
          orderBy: {
            service_visit: {
              visit_date: "desc",
            },
          },
        });

        if (!latest_tire) {
          return {
            position,
            has_data: false as const,
          };
        }

        // Get latest service visit for current odometer (if not provided)
        const current_km =
          input.current_odometer_km ??
          (
            await ctx.db.serviceVisit.findFirst({
              where: { car_id: input.car_id },
              orderBy: { visit_date: "desc" },
              select: { odometer_km: true },
            })
          )?.odometer_km ??
          latest_tire.service_visit.odometer_km;

        const usage = calculate_tire_usage(
          latest_tire.service_visit.odometer_km,
          current_km,
          latest_tire.service_visit.visit_date
        );

        return {
          position,
          has_data: true as const,
          tire: {
            brand: latest_tire.brand,
            tire_model: latest_tire.tire_model,
            tire_size: latest_tire.tire_size,
            production_week: latest_tire.production_week,
            price_per_tire: latest_tire.price_per_tire,
          },
          install_date: latest_tire.service_visit.visit_date,
          install_odometer_km: latest_tire.service_visit.odometer_km,
          branch_name: latest_tire.service_visit.branch.name,
          usage,
        };
      });

      const tire_status = await Promise.all(tire_status_promises);

      // Get latest tire switch for next service recommendation
      const latest_switch = await ctx.db.tireSwitch.findFirst({
        where: {
          service_visit: {
            car_id: input.car_id,
          },
        },
        include: {
          service_visit: true,
        },
        orderBy: {
          service_visit: {
            visit_date: "desc",
          },
        },
      });

      // Get latest oil change for next service recommendation
      const latest_oil = await ctx.db.oilChange.findFirst({
        where: {
          service_visit: {
            car_id: input.car_id,
          },
        },
        include: {
          service_visit: true,
        },
        orderBy: {
          service_visit: {
            visit_date: "desc",
          },
        },
      });

      // Calculate current odometer (use latest from any service)
      const latest_visit = await ctx.db.serviceVisit.findFirst({
        where: { car_id: input.car_id },
        orderBy: { visit_date: "desc" },
        select: { odometer_km: true },
      });
      const current_km = input.current_odometer_km ?? latest_visit?.odometer_km ?? 0;

      // Calculate next tire switch recommendation
      let next_tire_switch = null;
      if (latest_switch) {
        const recommendation = calculate_next_tire_switch(
          latest_switch.service_visit.odometer_km,
          latest_switch.service_visit.visit_date,
          current_km
        );
        next_tire_switch = {
          last_service_date: latest_switch.service_visit.visit_date,
          last_service_km: latest_switch.service_visit.odometer_km,
          ...recommendation,
          ...get_next_service_data(recommendation.km_until, recommendation.days_until),
        };
      }

      // Calculate next oil change recommendation
      let next_oil_change = null;
      if (latest_oil) {
        const interval_km = latest_oil.interval_km ?? get_oil_interval_km(latest_oil.oil_type);
        const recommendation = calculate_next_oil_change(
          latest_oil.service_visit.odometer_km,
          latest_oil.service_visit.visit_date,
          current_km,
          interval_km
        );
        next_oil_change = {
          last_service_date: latest_oil.service_visit.visit_date,
          last_service_km: latest_oil.service_visit.odometer_km,
          oil_model: latest_oil.oil_model,
          oil_type: latest_oil.oil_type,
          viscosity: latest_oil.viscosity,
          interval_km,
          ...recommendation,
          ...get_next_service_data(recommendation.km_until, recommendation.days_until),
        };
      }

      console.log("[Service] Get tire status completed", {
        car_id: input.car_id,
        positions_with_data: tire_status.filter((t) => t.has_data).length,
      });

      return {
        car_id: input.car_id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        current_odometer_km: current_km,
        tires: tire_status,
        next_tire_switch,
        next_oil_change,
      };
    }),

  /**
   * Get all service history for all cars owned by the user
   * Returns a unified timeline of all services across all registered cars
   */
  all_history: protected_procedure
    .input(
      z.object({
        ...pagination_schema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Service] Get all history for user", { user_id: ctx.user.id });

      // Get all cars owned by the user
      const user_cars = await ctx.db.car.findMany({
        where: {
          owner_id: ctx.user.id,
          is_deleted: false,
        },
        select: {
          id: true,
          license_plate: true,
          car_model: true,
        },
      });

      if (user_cars.length === 0) {
        console.log("[Service] No cars found for user");
        return paginate([], 0, input);
      }

      const car_ids = user_cars.map((c) => c.id);
      const car_map = new Map(user_cars.map((c) => [c.id, c]));

      // Get all service visits for all cars
      const [visits, total] = await Promise.all([
        ctx.db.serviceVisit.findMany({
          where: {
            car_id: { in: car_ids },
          },
          include: {
            branch: true,
            tire_changes: true,
            tire_switches: true,
            oil_changes: true,
          },
          orderBy: {
            visit_date: "desc",
          },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.serviceVisit.count({
          where: {
            car_id: { in: car_ids },
          },
        }),
      ]);

      // Build unified history entries
      const history_entries = visits.flatMap((visit) => {
        const car = car_map.get(visit.car_id);
        const entries: Array<{
          id: string;
          type: "tire_change" | "tire_switch" | "oil_change";
          visit_date: Date;
          license_plate: string;
          car_model: string | null;
          car_id: string;
          branch_name: string;
          odometer_km: number;
          details: Record<string, unknown>;
        }> = [];

        // Add tire changes
        for (const tc of visit.tire_changes) {
          entries.push({
            id: tc.id,
            type: "tire_change",
            visit_date: visit.visit_date,
            license_plate: car?.license_plate ?? "",
            car_model: car?.car_model ?? null,
            car_id: visit.car_id,
            branch_name: visit.branch.name,
            odometer_km: visit.odometer_km,
            details: {
              position: tc.position,
              brand: tc.brand,
              tire_model: tc.tire_model,
              tire_size: tc.tire_size,
              price_per_tire: tc.price_per_tire,
            },
          });
        }

        // Add tire switches
        for (const ts of visit.tire_switches) {
          entries.push({
            id: ts.id,
            type: "tire_switch",
            visit_date: visit.visit_date,
            license_plate: car?.license_plate ?? "",
            car_model: car?.car_model ?? null,
            car_id: visit.car_id,
            branch_name: visit.branch.name,
            odometer_km: visit.odometer_km,
            details: {
              from_position: ts.from_position,
              to_position: ts.to_position,
              notes: ts.notes,
            },
          });
        }

        // Add oil changes
        for (const oc of visit.oil_changes) {
          entries.push({
            id: oc.id,
            type: "oil_change",
            visit_date: visit.visit_date,
            license_plate: car?.license_plate ?? "",
            car_model: car?.car_model ?? null,
            car_id: visit.car_id,
            branch_name: visit.branch.name,
            odometer_km: visit.odometer_km,
            details: {
              oil_model: oc.oil_model,
              viscosity: oc.viscosity,
              oil_type: oc.oil_type,
              price: oc.price,
            },
          });
        }

        return entries;
      });

      // Sort by date descending
      history_entries.sort(
        (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      );

      console.log("[Service] Get all history completed", {
        user_id: ctx.user.id,
        cars_count: user_cars.length,
        entries_count: history_entries.length,
      });

      return paginate(history_entries, total, input);
    }),
});
