"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@tireoff/api";

/**
 * tRPC React client
 * Used in client components
 */
export const trpc = createTRPCReact<AppRouter>();
