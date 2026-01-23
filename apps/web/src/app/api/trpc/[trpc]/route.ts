import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { app_router, create_trpc_context } from "@tireoff/api";
import { SESSION_CONFIG } from "@tireoff/shared";

/**
 * Handle tRPC requests
 */
const handler = (req: Request) => {
  console.log("[tRPC Route] Handling request", { method: req.method });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: app_router,
    createContext: async () => {
      // Get session token from header or cookie
      const session_token =
        req.headers.get("x-session-token") ||
        get_cookie_value(req, SESSION_CONFIG.COOKIE_NAME);

      const ip_address =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";

      return create_trpc_context({
        session_token,
        ip_address,
      });
    },
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error.message);
    },
  });
};

/**
 * Get cookie value from request
 */
function get_cookie_value(req: Request, name: string): string | undefined {
  const cookies = req.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}

export { handler as GET, handler as POST };
