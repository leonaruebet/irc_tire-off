import { PrismaClient } from "@prisma/client";

/**
 * Create a singleton Prisma client instance
 * Prevents multiple instances in development due to hot reloading
 */
const global_for_prisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance
 * Uses singleton pattern for production and reuses client in development
 */
export const db =
  global_for_prisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global_for_prisma.prisma = db;
}
