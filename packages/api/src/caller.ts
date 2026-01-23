/**
 * Server-side tRPC caller
 * Used for calling tRPC procedures from server components
 */

import { app_router } from "./root";
import { create_trpc_context, type Context } from "./trpc";

/**
 * Create a server-side caller with the given context
 *
 * @param ctx - Context object or partial context options
 * @returns Callable tRPC router
 */
export async function create_caller(
  ctx_opts: { session_token?: string; ip_address?: string } = {}
) {
  const ctx = await create_trpc_context(ctx_opts);
  return app_router.createCaller(ctx);
}
