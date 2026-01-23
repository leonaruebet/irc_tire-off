/**
 * tRPC initialization and context creation
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db, Prisma } from "@tireoff/db";
import type { User, Session } from "@tireoff/db";

/**
 * Session with user relation included
 */
type SessionWithUser = Prisma.SessionGetPayload<{ include: { user: true } }>;

/**
 * Context passed to all tRPC procedures
 */
export interface Context {
  db: typeof db;
  session: Session | null;
  user: User | null;
  ip_address?: string;
}

/**
 * Create tRPC context from request headers
 *
 * @param opts - Options containing session token and IP
 * @returns Context object
 */
export async function create_trpc_context(opts: {
  session_token?: string;
  ip_address?: string;
}): Promise<Context> {
  console.log("[tRPC] Creating context", {
    has_session: !!opts.session_token,
    ip: opts.ip_address,
  });

  let session: Session | null = null;
  let user: User | null = null;

  // Validate session if token provided
  if (opts.session_token) {
    const session_with_user = await db.session.findUnique({
      where: { token: opts.session_token },
      include: { user: true },
    }) as SessionWithUser | null;

    if (session_with_user) {
      // Check if session is expired
      if (new Date() > session_with_user.expires_at) {
        console.log("[tRPC] Session expired", { session_id: session_with_user.id });
        session = null;
      } else {
        session = session_with_user;
        user = session_with_user.user;
      }
    }
  }

  console.log("[tRPC] Context created", {
    has_user: !!user,
    user_id: user?.id,
  });

  return {
    db,
    session,
    user,
    ip_address: opts.ip_address,
  };
}

/**
 * Initialize tRPC with superjson transformer
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

/**
 * Create a tRPC router
 */
export const create_router = t.router;

/**
 * Public procedure - no authentication required
 */
export const public_procedure = t.procedure;

/**
 * Protected procedure - requires authenticated user
 */
export const protected_procedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  console.log("[tRPC] Protected procedure accessed", {
    user_id: ctx.user.id,
    phone: ctx.user.phone,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

/**
 * Middleware for logging procedure calls
 */
export const logged_procedure = t.procedure.use(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;
  console.log("[tRPC]", {
    path,
    type,
    duration_ms: duration,
    ok: result.ok,
  });

  return result;
});
