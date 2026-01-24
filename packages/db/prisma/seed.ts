/**
 * Seed script for TireTrack database
 * Generates mockup car info data for specified account
 *
 * Usage: pnpm seed
 */

import { PrismaClient, TirePosition } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Logger utility for seed operations
 * @param message - Log message
 * @param level - Log level (info, success, error)
 */
function log(
  message: string,
  level: "info" | "success" | "error" = "info"
): void {
  const timestamp = new Date().toISOString();
  const prefix =
    level === "success" ? "✓" : level === "error" ? "✗" : "→";
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Thai tire brands commonly used in Thailand
 */
const TIRE_BRANDS = [
  "Bridgestone",
  "Michelin",
  "Goodyear",
  "Continental",
  "Dunlop",
  "Yokohama",
  "Maxxis",
  "Firestone",
];

/**
 * Common tire sizes for passenger vehicles
 */
const TIRE_SIZES = [
  "185/65R15",
  "195/60R15",
  "205/55R16",
  "215/55R17",
  "225/45R18",
  "235/50R18",
  "245/40R19",
];

/**
 * Common oil viscosity grades
 */
const OIL_VISCOSITIES = ["5W-30", "5W-40", "10W-30", "10W-40", "0W-20"];

/**
 * Oil brands available in Thailand
 */
const OIL_BRANDS = [
  "Castrol Edge",
  "Shell Helix Ultra",
  "Mobil 1",
  "PTT Performa",
  "Total Quartz",
  "Valvoline SynPower",
];

/**
 * Car models for mockup data
 */
const CAR_MODELS = [
  "Toyota Camry 2.5 HV",
  "Honda Civic RS",
  "Mazda CX-5 2.0 SP",
  "Toyota Corolla Cross HV",
  "Honda HR-V e:HEV",
];

/**
 * Generate random date within range
 * @param start_date - Start date
 * @param end_date - End date
 * @returns Random date between start and end
 */
function random_date(start_date: Date, end_date: Date): Date {
  const start_time = start_date.getTime();
  const end_time = end_date.getTime();
  return new Date(start_time + Math.random() * (end_time - start_time));
}

/**
 * Generate random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
function random_int(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random array element
 * @param arr - Array to pick from
 * @returns Random element from array
 */
function random_pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate production week string (WWYY format)
 * @param date - Date for production week
 * @returns Production week string (e.g., "2523" = week 25, year 2023)
 */
function generate_production_week(date: Date): string {
  const week = Math.ceil(
    (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );
  const year = date.getFullYear() % 100;
  return `${week.toString().padStart(2, "0")}${year}`;
}

/**
 * Main seed function
 * Creates mockup data for account 0917013331
 */
async function main(): Promise<void> {
  log("Starting seed process for TireTrack database", "info");

  const target_phone = "0917013331";

  // Create or find branch
  log("Creating/finding branch...", "info");
  let branch = await prisma.branch.findFirst({
    where: { is_active: true },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: "ทรัพย์ไพศาล สาขากรุงเทพ",
        code: "BKK001",
        address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
        phone: "02-123-4567",
        is_active: true,
      },
    });
    log(`Created branch: ${branch.name}`, "success");
  } else {
    log(`Using existing branch: ${branch.name}`, "info");
  }

  // Create or find user
  log(`Finding/creating user with phone: ${target_phone}...`, "info");
  let user = await prisma.user.findUnique({
    where: { phone: target_phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: target_phone,
        phone_masked: "091-xxx-3331",
        name: "สมชาย ทดสอบ",
      },
    });
    log(`Created user: ${user.name} (${user.phone})`, "success");
  } else {
    log(`Using existing user: ${user.name || user.phone}`, "info");
  }

  // Define cars to create
  const cars_data = [
    { license_plate: "กข 1234", car_model: random_pick(CAR_MODELS) },
    { license_plate: "1กก 5678", car_model: random_pick(CAR_MODELS) },
    { license_plate: "ขค 9012", car_model: random_pick(CAR_MODELS) },
  ];

  for (const car_data of cars_data) {
    log(`Processing car: ${car_data.license_plate}...`, "info");

    // Check if car exists
    let car = await prisma.car.findUnique({
      where: { license_plate: car_data.license_plate },
    });

    if (car) {
      log(`Car ${car_data.license_plate} already exists, skipping...`, "info");
      continue;
    }

    // Create car
    car = await prisma.car.create({
      data: {
        license_plate: car_data.license_plate,
        car_model: car_data.car_model,
        owner_id: user.id,
        is_deleted: false,
      },
    });
    log(`Created car: ${car.license_plate} (${car.car_model})`, "success");

    // Generate service history for last 2 years
    const now = new Date();
    const two_years_ago = new Date(now.getFullYear() - 2, now.getMonth(), 1);

    // Initial tire installation (2 years ago)
    const initial_odometer = random_int(10000, 30000);
    const initial_date = random_date(
      two_years_ago,
      new Date(two_years_ago.getTime() + 30 * 24 * 60 * 60 * 1000)
    );

    const tire_brand = random_pick(TIRE_BRANDS);
    const tire_size = random_pick(TIRE_SIZES);
    const tire_price = random_int(2500, 4500);

    const initial_visit = await prisma.serviceVisit.create({
      data: {
        car_id: car.id,
        branch_id: branch.id,
        visit_date: initial_date,
        odometer_km: initial_odometer,
        total_price: tire_price * 4,
        services_note: "เปลี่ยนยางใหม่ครบ 4 เส้น",
      },
    });
    log(`Created initial tire service visit at ${initial_odometer} km`, "info");

    // Create tire changes for all 4 positions
    const positions: TirePosition[] = ["FL", "FR", "RL", "RR"];
    for (const position of positions) {
      await prisma.tireChange.create({
        data: {
          service_visit_id: initial_visit.id,
          position,
          tire_size,
          brand: tire_brand,
          tire_model: `${tire_brand} Turanza T005`,
          production_week: generate_production_week(
            new Date(initial_date.getTime() - 60 * 24 * 60 * 60 * 1000)
          ),
          price_per_tire: tire_price,
        },
      });
    }
    log(`Created 4 tire change records for ${car.license_plate}`, "success");

    // First oil change (around same time)
    const first_oil_date = random_date(
      initial_date,
      new Date(initial_date.getTime() + 14 * 24 * 60 * 60 * 1000)
    );

    const first_oil_visit = await prisma.serviceVisit.create({
      data: {
        car_id: car.id,
        branch_id: branch.id,
        visit_date: first_oil_date,
        odometer_km: initial_odometer + random_int(100, 500),
        total_price: random_int(1200, 2500),
        services_note: "เปลี่ยนถ่ายน้ำมันเครื่อง",
      },
    });

    await prisma.oilChange.create({
      data: {
        service_visit_id: first_oil_visit.id,
        oil_model: random_pick(OIL_BRANDS),
        viscosity: random_pick(OIL_VISCOSITIES),
        engine_type: "เบนซิน",
        oil_type: "สังเคราะห์",
        interval_km: 10000,
        price: random_int(1200, 2500),
      },
    });
    log(`Created first oil change record for ${car.license_plate}`, "success");

    // Tire rotation (about 6 months after initial)
    const rotation_date = new Date(
      initial_date.getTime() + 180 * 24 * 60 * 60 * 1000
    );
    const rotation_odometer = initial_odometer + random_int(8000, 12000);

    const rotation_visit = await prisma.serviceVisit.create({
      data: {
        car_id: car.id,
        branch_id: branch.id,
        visit_date: rotation_date,
        odometer_km: rotation_odometer,
        total_price: 400,
        services_note: "สลับยาง",
      },
    });

    // Create tire switch records (front-to-rear swap)
    await prisma.tireSwitch.create({
      data: {
        service_visit_id: rotation_visit.id,
        from_position: "FL",
        to_position: "RL",
        notes: "สลับยางหน้า-หลัง",
      },
    });
    await prisma.tireSwitch.create({
      data: {
        service_visit_id: rotation_visit.id,
        from_position: "FR",
        to_position: "RR",
        notes: "สลับยางหน้า-หลัง",
      },
    });
    await prisma.tireSwitch.create({
      data: {
        service_visit_id: rotation_visit.id,
        from_position: "RL",
        to_position: "FL",
        notes: "สลับยางหน้า-หลัง",
      },
    });
    await prisma.tireSwitch.create({
      data: {
        service_visit_id: rotation_visit.id,
        from_position: "RR",
        to_position: "FR",
        notes: "สลับยางหน้า-หลัง",
      },
    });
    log(`Created tire switch records for ${car.license_plate}`, "success");

    // Second oil change (about 10,000 km later)
    const second_oil_date = new Date(
      rotation_date.getTime() + 120 * 24 * 60 * 60 * 1000
    );

    const second_oil_visit = await prisma.serviceVisit.create({
      data: {
        car_id: car.id,
        branch_id: branch.id,
        visit_date: second_oil_date,
        odometer_km: rotation_odometer + random_int(9000, 11000),
        total_price: random_int(1500, 2800),
        services_note: "เปลี่ยนถ่ายน้ำมันเครื่อง + ไส้กรอง",
      },
    });

    await prisma.oilChange.create({
      data: {
        service_visit_id: second_oil_visit.id,
        oil_model: random_pick(OIL_BRANDS),
        viscosity: random_pick(OIL_VISCOSITIES),
        engine_type: "เบนซิน",
        oil_type: "กึ่งสังเคราะห์",
        interval_km: 7500,
        price: random_int(1500, 2800),
      },
    });
    log(`Created second oil change record for ${car.license_plate}`, "success");

    // Recent service (within last month) - for realistic current status
    const recent_date = random_date(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      now
    );
    const current_odometer = initial_odometer + random_int(35000, 45000);

    const recent_visit = await prisma.serviceVisit.create({
      data: {
        car_id: car.id,
        branch_id: branch.id,
        visit_date: recent_date,
        odometer_km: current_odometer,
        total_price: random_int(1800, 3000),
        services_note: "เปลี่ยนถ่ายน้ำมันเครื่อง + ตรวจเช็คสภาพยาง",
      },
    });

    await prisma.oilChange.create({
      data: {
        service_visit_id: recent_visit.id,
        oil_model: random_pick(OIL_BRANDS),
        viscosity: random_pick(OIL_VISCOSITIES),
        engine_type: "เบนซิน",
        oil_type: "สังเคราะห์",
        interval_km: 10000,
        price: random_int(1800, 3000),
      },
    });
    log(`Created recent oil change record for ${car.license_plate}`, "success");

    log(`Completed setup for car: ${car.license_plate}`, "success");
  }

  // Summary
  const car_count = await prisma.car.count({ where: { owner_id: user.id } });
  const visit_count = await prisma.serviceVisit.count({
    where: { car: { owner_id: user.id } },
  });
  const tire_change_count = await prisma.tireChange.count({
    where: { service_visit: { car: { owner_id: user.id } } },
  });
  const tire_switch_count = await prisma.tireSwitch.count({
    where: { service_visit: { car: { owner_id: user.id } } },
  });
  const oil_change_count = await prisma.oilChange.count({
    where: { service_visit: { car: { owner_id: user.id } } },
  });

  log("=== Seed Summary ===", "info");
  log(`User: ${user.name} (${user.phone})`, "success");
  log(`Cars: ${car_count}`, "success");
  log(`Service Visits: ${visit_count}`, "success");
  log(`Tire Changes: ${tire_change_count}`, "success");
  log(`Tire Switches: ${tire_switch_count}`, "success");
  log(`Oil Changes: ${oil_change_count}`, "success");
  log("Seed completed successfully!", "success");
}

main()
  .catch((e) => {
    log(`Seed failed: ${e.message}`, "error");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
