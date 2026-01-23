/**
 * Root tRPC router
 * Combines all sub-routers into one app router
 */

import { create_router } from "./trpc";
import { auth_router } from "./routers/auth";
import { car_router } from "./routers/car";
import { service_router } from "./routers/service";
import { branch_router } from "./routers/branch";
import { admin_router } from "./routers/admin";

/**
 * Main application router
 * All API routes are defined here
 */
export const app_router = create_router({
  auth: auth_router,
  car: car_router,
  service: service_router,
  branch: branch_router,
  admin: admin_router,
});

/**
 * Type definition for the app router
 * Used for type inference on the client
 */
export type AppRouter = typeof app_router;
