import "server-only";

import { create_caller } from "@tireoff/api";
import { get_session_token } from "./auth";
import { headers } from "next/headers";

/**
 * Create a server-side tRPC caller
 * Used in server components and server actions
 *
 * @returns tRPC caller with current user context
 */
export async function create_server_caller() {
  console.log("[tRPC Server] Creating server caller");

  const session_token = await get_session_token();
  const header_list = await headers();
  const ip_address =
    header_list.get("x-forwarded-for") ||
    header_list.get("x-real-ip") ||
    "unknown";

  return create_caller({
    session_token,
    ip_address,
  });
}
