/**
 * Admin router
 * Handles admin authentication and data management
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { create_router, public_procedure } from "../trpc";
import {
  pagination_schema,
  calculate_skip,
  paginate,
  service_visit_schema,
  normalize_license_plate,
  normalize_plate_for_search,
} from "@tireoff/shared";

/**
 * Convert string to Title Case for consistent display
 * Handles common oil brand names like "Castrol GTX", "Mobil 1", etc.
 * @param str - Input string to format
 * @returns Title cased string
 */
function to_title_case(str: string): string {
  if (!str) return "";

  // Special cases for common oil brands/viscosities
  const special_cases: Record<string, string> = {
    "castrol": "Castrol",
    "mobil": "Mobil",
    "shell": "Shell",
    "valvoline": "Valvoline",
    "petronas": "Petronas",
    "motul": "Motul",
    "elf": "ELF",
    "total": "TOTAL",
    "bp": "BP",
    "caltex": "Caltex",
    "gtx": "GTX",
    "magnatec": "Magnatec",
    "edge": "EDGE",
    "helix": "Helix",
    "ultron": "Ultron",
    "fs": "FS",
    "gt": "GT",
    "w": "W", // For viscosity like 5W-40
  };

  return str
    .toLowerCase()
    .split(/[\s\-]+/)
    .map((word) => {
      // Check for special case
      const lower = word.toLowerCase();
      if (special_cases[lower]) {
        return special_cases[lower];
      }
      // Default title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Hardcoded admin credentials (in production, use proper auth)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "tireoff2026",
};

/**
 * Admin context middleware
 */
const admin_procedure = public_procedure.use(async ({ ctx, next }) => {
  // Check for admin session token in context
  const admin_token = ctx.session?.token;

  // For simplicity, we'll check if the session exists and is marked as admin
  // In a real app, you'd verify the admin session properly
  return next({ ctx });
});

export const admin_router = create_router({
  /**
   * Admin login with hardcoded credentials
   */
  login: public_procedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Admin] Login attempt", { username: input.username });

      if (
        input.username !== ADMIN_CREDENTIALS.username ||
        input.password !== ADMIN_CREDENTIALS.password
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Generate a simple admin token
      const admin_token = `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      console.log("[Admin] Login successful");

      return {
        success: true,
        token: admin_token,
      };
    }),

  /**
   * Dashboard stats
   */
  stats: public_procedure.query(async ({ ctx }) => {
    console.log("[Admin] Getting stats");

    const [
      total_users,
      total_cars,
      total_visits,
      total_branches,
      recent_visits,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.car.count({ where: { is_deleted: false } }),
      ctx.db.serviceVisit.count(),
      ctx.db.branch.count({ where: { is_active: true } }),
      ctx.db.serviceVisit.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          car: true,
          branch: true,
        },
      }),
    ]);

    return {
      total_users,
      total_cars,
      total_visits,
      total_branches,
      recent_visits: recent_visits.map((v) => ({
        id: v.id,
        car_plate: v.car.license_plate,
        branch: v.branch.name,
        date: v.visit_date,
        odometer: v.odometer_km,
      })),
    };
  }),

  /**
   * List all service visits with search/filter
   */
  list_visits: public_procedure
    .input(
      z.object({
        search: z.string().optional(),
        branch_id: z.string().optional(),
        date_from: z.coerce.date().optional(),
        date_to: z.coerce.date().optional(),
        ...pagination_schema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Admin] List visits", input);

      const where: any = {};

      if (input.search) {
        // Normalize search input for license plate matching
        // Handles both "กข-1234" and "กข 1234" finding the same car
        const { normalized: normalized_plate_search } = normalize_plate_for_search(input.search);

        console.log("[Admin] Search normalized", {
          original: input.search,
          normalized: normalized_plate_search,
        });

        where.OR = [
          // Search by normalized license plate (handles dash/space variations)
          { car: { license_plate: { contains: normalized_plate_search, mode: "insensitive" } } },
          // Also search original input for partial matches
          { car: { license_plate: { contains: input.search, mode: "insensitive" } } },
          // Search by phone number
          { car: { owner: { phone: { contains: input.search } } } },
        ];
      }

      if (input.branch_id) {
        where.branch_id = input.branch_id;
      }

      if (input.date_from || input.date_to) {
        where.visit_date = {};
        if (input.date_from) where.visit_date.gte = input.date_from;
        if (input.date_to) where.visit_date.lte = input.date_to;
      }

      const [records, total] = await Promise.all([
        ctx.db.serviceVisit.findMany({
          where,
          include: {
            car: { include: { owner: true } },
            branch: true,
            tire_changes: true,
            tire_switches: true,
            oil_changes: true,
          },
          orderBy: { visit_date: "desc" },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.serviceVisit.count({ where }),
      ]);

      const data = records.map((v) => ({
        id: v.id,
        visit_date: v.visit_date,
        car: {
          id: v.car.id,
          license_plate: v.car.license_plate,
          car_model: v.car.car_model,
          owner_phone: v.car.owner.phone,
        },
        branch: {
          id: v.branch.id,
          name: v.branch.name,
        },
        odometer_km: v.odometer_km,
        total_price: v.total_price,
        tire_change_count: v.tire_changes.length,
        tire_switch_count: v.tire_switches.length,
        oil_change_count: v.oil_changes.length,
        created_at: v.created_at,
      }));

      return paginate(data, total, input);
    }),

  /**
   * Get single visit details
   */
  get_visit: public_procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[Admin] Get visit", { id: input.id });

      const visit = await ctx.db.serviceVisit.findUnique({
        where: { id: input.id },
        include: {
          car: { include: { owner: true } },
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

      return visit;
    }),

  /**
   * Create service visit
   */
  create_visit: public_procedure
    .input(
      z.object({
        license_plate: z.string(),
        phone: z.string(),
        car_model: z.string().optional(),
        branch_id: z.string(),
        visit_date: z.coerce.date(),
        odometer_km: z.number().int().positive(),
        total_price: z.number().optional(),
        services_note: z.string().optional(),
        tire_changes: z
          .array(
            z.object({
              position: z.enum(["FL", "FR", "RL", "RR", "SP"]),
              tire_size: z.string().optional(),
              brand: z.string().optional(),
              tire_model: z.string().optional(),
              production_week: z.string().optional(),
              price_per_tire: z.number().optional(),
            })
          )
          .optional(),
        tire_switches: z
          .array(
            z.object({
              from_position: z.enum(["FL", "FR", "RL", "RR", "SP"]),
              to_position: z.enum(["FL", "FR", "RL", "RR", "SP"]),
              notes: z.string().optional(),
            })
          )
          .optional(),
        oil_change: z
          .object({
            oil_model: z.string().optional(),
            viscosity: z.string().optional(),
            engine_type: z.string().optional(),
            oil_type: z.string().optional(),
            interval_km: z.number().optional(),
            price: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Create visit", { plate: input.license_plate });

      const normalized_plate = normalize_license_plate(input.license_plate);

      // Find or create user
      let user = await ctx.db.user.findUnique({
        where: { phone: input.phone },
      });

      if (!user) {
        user = await ctx.db.user.create({
          data: {
            phone: input.phone,
            phone_masked: `${input.phone.slice(0, 3)}xxxx${input.phone.slice(-3)}`,
          },
        });
      }

      // Find or create car
      let car = await ctx.db.car.findUnique({
        where: { license_plate: normalized_plate },
      });

      if (!car) {
        car = await ctx.db.car.create({
          data: {
            license_plate: normalized_plate,
            car_model: input.car_model,
            owner_id: user.id,
          },
        });
      }

      // Create service visit with related records
      const visit = await ctx.db.serviceVisit.create({
        data: {
          car_id: car.id,
          branch_id: input.branch_id,
          visit_date: input.visit_date,
          odometer_km: input.odometer_km,
          total_price: input.total_price,
          services_note: input.services_note,
          tire_changes: input.tire_changes
            ? {
                create: input.tire_changes,
              }
            : undefined,
          tire_switches: input.tire_switches
            ? {
                create: input.tire_switches,
              }
            : undefined,
          oil_changes: input.oil_change
            ? {
                create: [input.oil_change],
              }
            : undefined,
        },
        include: {
          car: true,
          branch: true,
          tire_changes: true,
          tire_switches: true,
          oil_changes: true,
        },
      });

      console.log("[Admin] Visit created", { id: visit.id });

      return visit;
    }),

  /**
   * Update service visit
   */
  update_visit: public_procedure
    .input(
      z.object({
        id: z.string(),
        visit_date: z.coerce.date().optional(),
        odometer_km: z.number().int().positive().optional(),
        total_price: z.number().optional(),
        services_note: z.string().optional(),
        branch_id: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Update visit", { id: input.id });

      const { id, ...data } = input;

      const visit = await ctx.db.serviceVisit.update({
        where: { id },
        data,
        include: {
          car: true,
          branch: true,
        },
      });

      return visit;
    }),

  /**
   * Delete service visit
   */
  delete_visit: public_procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Delete visit", { id: input.id });

      // Delete related records first
      await ctx.db.tireChange.deleteMany({
        where: { service_visit_id: input.id },
      });
      await ctx.db.tireSwitch.deleteMany({
        where: { service_visit_id: input.id },
      });
      await ctx.db.oilChange.deleteMany({
        where: { service_visit_id: input.id },
      });

      // Delete the visit
      await ctx.db.serviceVisit.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * List branches
   */
  list_branches: public_procedure.query(async ({ ctx }) => {
    console.log("[Admin] List branches");

    const branches = await ctx.db.branch.findMany({
      orderBy: { name: "asc" },
    });

    return branches;
  }),

  /**
   * Create branch
   */
  create_branch: public_procedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Create branch", { name: input.name });

      const branch = await ctx.db.branch.create({
        data: input,
      });

      return branch;
    }),

  /**
   * Update branch
   */
  update_branch: public_procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        code: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Update branch", { id: input.id });

      const { id, ...data } = input;

      const branch = await ctx.db.branch.update({
        where: { id },
        data,
      });

      return branch;
    }),

  // ============================================
  // CAR MANAGEMENT (Admin)
  // ============================================

  /**
   * List all cars with owner info and service count
   * Supports search by license plate or phone
   */
  list_cars: public_procedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[Admin] List cars", input);

      const where: any = {
        is_deleted: false,
      };

      if (input.search) {
        const { normalized } = normalize_plate_for_search(input.search);
        where.OR = [
          { license_plate: { contains: normalized, mode: "insensitive" } },
          { license_plate: { contains: input.search, mode: "insensitive" } },
          { owner: { phone: { contains: input.search } } },
          { owner: { name: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      const [cars, total] = await Promise.all([
        ctx.db.car.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                phone: true,
                name: true,
              },
            },
            _count: {
              select: {
                service_visits: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          skip: calculate_skip(input.page, input.limit),
          take: input.limit,
        }),
        ctx.db.car.count({ where }),
      ]);

      const data = cars.map((car) => ({
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        car_year: car.car_year,
        car_color: car.car_color,
        car_vin: car.car_vin,
        owner: car.owner,
        service_count: car._count.service_visits,
        created_at: car.created_at,
      }));

      return paginate(data, total, input);
    }),

  /**
   * Get single car with full details
   */
  get_car: public_procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[Admin] Get car", { id: input.id });

      const car = await ctx.db.car.findUnique({
        where: { id: input.id },
        include: {
          owner: true,
          service_visits: {
            orderBy: { visit_date: "desc" },
            take: 10,
            include: {
              branch: true,
              tire_changes: true,
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

      return car;
    }),

  /**
   * Create a new car with owner
   */
  create_car: public_procedure
    .input(
      z.object({
        license_plate: z.string().min(1),
        phone: z.string().min(10),
        owner_name: z.string().optional(),
        car_model: z.string().optional(),
        car_year: z.string().optional(),
        car_color: z.string().optional(),
        car_vin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Create car", { plate: input.license_plate });

      const normalized_plate = normalize_license_plate(input.license_plate);

      // Check if plate already exists
      const existing = await ctx.db.car.findUnique({
        where: { license_plate: normalized_plate },
      });

      if (existing && !existing.is_deleted) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Car with this license plate already exists",
        });
      }

      // Find or create owner by phone
      let owner = await ctx.db.user.findUnique({
        where: { phone: input.phone },
      });

      if (!owner) {
        owner = await ctx.db.user.create({
          data: {
            phone: input.phone,
            name: input.owner_name,
            phone_masked: `${input.phone.slice(0, 3)}xxxx${input.phone.slice(-3)}`,
          },
        });
        console.log("[Admin] Created new owner", { phone: input.phone });
      } else if (input.owner_name && !owner.name) {
        // Update owner name if provided and not set
        await ctx.db.user.update({
          where: { id: owner.id },
          data: { name: input.owner_name },
        });
      }

      // If car was soft-deleted, restore it
      if (existing && existing.is_deleted) {
        const restored = await ctx.db.car.update({
          where: { id: existing.id },
          data: {
            is_deleted: false,
            owner_id: owner.id,
            car_model: input.car_model || existing.car_model,
            car_year: input.car_year || existing.car_year,
            car_color: input.car_color || existing.car_color,
            car_vin: input.car_vin || existing.car_vin,
          },
          include: { owner: true },
        });
        console.log("[Admin] Restored car", { id: restored.id });
        return { ...restored, restored: true };
      }

      // Create new car
      const car = await ctx.db.car.create({
        data: {
          license_plate: normalized_plate,
          car_model: input.car_model,
          car_year: input.car_year,
          car_color: input.car_color,
          car_vin: input.car_vin,
          owner_id: owner.id,
        },
        include: { owner: true },
      });

      console.log("[Admin] Created car", { id: car.id });
      return { ...car, restored: false };
    }),

  /**
   * Update car details
   */
  update_car: public_procedure
    .input(
      z.object({
        id: z.string(),
        car_model: z.string().optional(),
        car_year: z.string().optional(),
        car_color: z.string().optional(),
        car_vin: z.string().optional(),
        owner_name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Update car", { id: input.id });

      const { id, owner_name, ...car_data } = input;

      const car = await ctx.db.car.update({
        where: { id },
        data: car_data,
        include: { owner: true },
      });

      // Update owner name if provided
      if (owner_name) {
        await ctx.db.user.update({
          where: { id: car.owner_id },
          data: { name: owner_name },
        });
      }

      return car;
    }),

  /**
   * Delete car (soft delete)
   */
  delete_car: public_procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Delete car", { id: input.id });

      await ctx.db.car.update({
        where: { id: input.id },
        data: { is_deleted: true },
      });

      return { success: true };
    }),

  /**
   * Search cars for dropdown/autocomplete
   * Returns simplified list for selection
   */
  search_cars: public_procedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[Admin] Search cars", { query: input.query });

      if (!input.query || input.query.length < 2) {
        return [];
      }

      const { normalized } = normalize_plate_for_search(input.query);

      const cars = await ctx.db.car.findMany({
        where: {
          is_deleted: false,
          OR: [
            { license_plate: { contains: normalized, mode: "insensitive" } },
            { license_plate: { contains: input.query, mode: "insensitive" } },
            { owner: { phone: { contains: input.query } } },
          ],
        },
        include: {
          owner: {
            select: {
              phone: true,
              name: true,
            },
          },
        },
        take: 10,
        orderBy: { created_at: "desc" },
      });

      return cars.map((car) => ({
        id: car.id,
        license_plate: car.license_plate,
        car_model: car.car_model,
        owner_phone: car.owner.phone,
        owner_name: car.owner.name,
      }));
    }),

  /**
   * Get unique oil models from all oil changes
   * Returns sorted list with consistent casing
   */
  get_oil_models: public_procedure.query(async ({ ctx }) => {
    console.log("[Admin] Get oil models");

    const oil_changes = await ctx.db.oilChange.findMany({
      where: {
        AND: [
          { oil_model: { not: null } },
          { oil_model: { not: "" } },
        ],
      },
      select: {
        oil_model: true,
      },
      distinct: ["oil_model"],
      orderBy: {
        oil_model: "asc",
      },
    });

    // Format to Title Case and remove duplicates
    const models = oil_changes
      .map((oc) => to_title_case(oc.oil_model || ""))
      .filter((m) => m.length > 0);

    return Array.from(new Set(models)).sort();
  }),

  /**
   * Get unique oil viscosities from all oil changes
   * Returns sorted list with consistent casing
   */
  get_oil_viscosities: public_procedure.query(async ({ ctx }) => {
    console.log("[Admin] Get oil viscosities");

    const oil_changes = await ctx.db.oilChange.findMany({
      where: {
        AND: [
          { viscosity: { not: null } },
          { viscosity: { not: "" } },
        ],
      },
      select: {
        viscosity: true,
      },
      distinct: ["viscosity"],
      orderBy: {
        viscosity: "asc",
      },
    });

    // Format to Title Case and remove duplicates
    const viscosities = oil_changes
      .map((oc) => to_title_case(oc.viscosity || ""))
      .filter((v) => v.length > 0);

    return Array.from(new Set(viscosities)).sort();
  }),

  /**
   * Bulk import service records with enhanced deduplication
   * Handles cases where users export Excel with historical data that was already imported
   *
   * Deduplication logic:
   * 1. Service visits are matched by car_id + visit_date (date only, normalized)
   * 2. Tire changes are checked by position within the same visit
   * 3. Oil changes are checked for existing records within the same visit
   * 4. Existing visits are updated with new tire/oil data if not duplicate
   *
   * @param records - Array of parsed records from Excel/CSV
   * @returns Import result with success, duplicate, and error counts
   */
  import_records: public_procedure
    .input(
      z.object({
        records: z.array(
          z.object({
            license_plate: z.string(),
            phone: z.string(),
            car_model: z.string().optional(),
            branch_name: z.string(),
            visit_date: z.coerce.date(),
            odometer_km: z.number(),
            total_price: z.number().optional(),
            tire_size: z.string().optional(),
            tire_brand: z.string().optional(),
            tire_model: z.string().optional(),
            tire_position: z.string().optional(),
            tire_production_week: z.string().optional(),
            tire_price: z.number().optional(),
            oil_model: z.string().optional(),
            oil_viscosity: z.string().optional(),
            oil_type: z.string().optional(),
            oil_interval: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Admin] Import records start", { count: input.records.length });

      let success_count = 0;
      let duplicate_count = 0;
      let error_count = 0;
      const errors: string[] = [];

      /**
       * Normalize date to start of day (UTC) for consistent comparison
       * @param date - Date to normalize
       * @returns Date set to start of day (00:00:00.000)
       */
      function normalize_date(date: Date): Date {
        const normalized = new Date(date);
        normalized.setUTCHours(0, 0, 0, 0);
        return normalized;
      }

      /**
       * Create date range for same-day comparison
       * @param date - Base date
       * @returns Object with start and end of day for Prisma query
       */
      function get_day_range(date: Date): { gte: Date; lt: Date } {
        const start = normalize_date(date);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        return { gte: start, lt: end };
      }

      for (const record of input.records) {
        try {
          const normalized_plate = normalize_license_plate(record.license_plate);
          const visit_date_range = get_day_range(record.visit_date);

          console.log("[Admin] Processing record", {
            plate: normalized_plate,
            date: record.visit_date.toISOString().split("T")[0],
          });

          // Find or create branch
          let branch = await ctx.db.branch.findFirst({
            where: { name: record.branch_name },
          });

          if (!branch) {
            branch = await ctx.db.branch.create({
              data: { name: record.branch_name },
            });
            console.log("[Admin] Created new branch", { name: record.branch_name });
          }

          // Find or create user
          let user = await ctx.db.user.findUnique({
            where: { phone: record.phone },
          });

          if (!user) {
            user = await ctx.db.user.create({
              data: {
                phone: record.phone,
                phone_masked: `${record.phone.slice(0, 3)}xxxx${record.phone.slice(-3)}`,
              },
            });
            console.log("[Admin] Created new user", { phone: record.phone });
          }

          // Find or create car
          let car = await ctx.db.car.findUnique({
            where: { license_plate: normalized_plate },
          });

          if (!car) {
            car = await ctx.db.car.create({
              data: {
                license_plate: normalized_plate,
                car_model: record.car_model,
                owner_id: user.id,
              },
            });
            console.log("[Admin] Created new car", { plate: normalized_plate });
          }

          // Check for existing visit on same day for same car
          const existing_visit = await ctx.db.serviceVisit.findFirst({
            where: {
              car_id: car.id,
              visit_date: visit_date_range,
            },
            include: {
              tire_changes: true,
              oil_changes: true,
            },
          });

          let visit = existing_visit;
          let is_new_visit = false;

          if (!existing_visit) {
            // Create new service visit
            visit = await ctx.db.serviceVisit.create({
              data: {
                car_id: car.id,
                branch_id: branch.id,
                visit_date: normalize_date(record.visit_date),
                odometer_km: record.odometer_km,
                total_price: record.total_price,
              },
              include: {
                tire_changes: true,
                oil_changes: true,
              },
            });
            is_new_visit = true;
            console.log("[Admin] Created new visit", { id: visit.id });
          } else {
            console.log("[Admin] Found existing visit", { id: existing_visit.id });
          }

          // Track if anything was added to this record
          let added_tire = false;
          let added_oil = false;
          let was_duplicate = true;

          // Handle tire change with deduplication
          if (record.tire_position && record.tire_size) {
            const normalized_position = record.tire_position.toUpperCase().trim();

            // Check if tire change for this position already exists
            const existing_tire = visit!.tire_changes.find(
              (tc) =>
                tc.position === normalized_position &&
                tc.tire_size === record.tire_size &&
                tc.brand === record.tire_brand
            );

            if (!existing_tire) {
              await ctx.db.tireChange.create({
                data: {
                  service_visit_id: visit!.id,
                  position: normalized_position as any,
                  tire_size: record.tire_size,
                  brand: record.tire_brand,
                  tire_model: record.tire_model,
                  production_week: record.tire_production_week,
                  price_per_tire: record.tire_price,
                },
              });
              added_tire = true;
              was_duplicate = false;
              console.log("[Admin] Added tire change", {
                position: normalized_position,
                size: record.tire_size,
              });
            } else {
              console.log("[Admin] Skipped duplicate tire change", {
                position: normalized_position,
              });
            }
          }

          // Handle oil change with deduplication
          if (record.oil_model || record.oil_viscosity) {
            // Check if oil change with same details already exists
            const existing_oil = visit!.oil_changes.find(
              (oc) =>
                oc.viscosity === record.oil_viscosity &&
                oc.oil_model === record.oil_model
            );

            if (!existing_oil) {
              await ctx.db.oilChange.create({
                data: {
                  service_visit_id: visit!.id,
                  oil_model: record.oil_model,
                  viscosity: record.oil_viscosity,
                  oil_type: record.oil_type,
                  interval_km: record.oil_interval,
                },
              });
              added_oil = true;
              was_duplicate = false;
              console.log("[Admin] Added oil change", {
                viscosity: record.oil_viscosity,
              });
            } else {
              console.log("[Admin] Skipped duplicate oil change", {
                viscosity: record.oil_viscosity,
              });
            }
          }

          // Count results
          if (is_new_visit || added_tire || added_oil) {
            success_count++;
          } else if (was_duplicate) {
            duplicate_count++;
            console.log("[Admin] Record is complete duplicate", {
              plate: normalized_plate,
              date: record.visit_date.toISOString().split("T")[0],
            });
          }
        } catch (error: any) {
          console.error("[Admin] Error processing record", {
            plate: record.license_plate,
            error: error.message,
          });
          errors.push(`Error for ${record.license_plate}: ${error.message}`);
          error_count++;
        }
      }

      console.log("[Admin] Import completed", {
        success_count,
        duplicate_count,
        error_count,
      });

      return {
        success_count,
        duplicate_count,
        error_count,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    }),
});
