"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { SESSION_CONFIG } from "@tireoff/shared";

/**
 * Get base URL for tRPC
 */
function get_base_url() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Get session token from cookies (client-side)
 */
function get_session_token(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === SESSION_CONFIG.COOKIE_NAME) {
      return value;
    }
  }
  return undefined;
}

/**
 * tRPC provider component
 * Sets up tRPC client and React Query
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [query_client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpc_client] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${get_base_url()}/api/trpc`,
          transformer: superjson,
          headers() {
            const token = get_session_token();
            return token
              ? {
                  "x-session-token": token,
                }
              : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpc_client} queryClient={query_client}>
      <QueryClientProvider client={query_client}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
