import { cookies } from "next/headers";
import { SESSION_CONFIG } from "@tireoff/shared";
import { db } from "@tireoff/db";

/**
 * Get current session from cookies
 *
 * @returns Session with user or null
 */
export async function get_session() {
  console.log("[Auth] Getting session from cookies");

  const cookie_store = await cookies();
  const session_token = cookie_store.get(SESSION_CONFIG.COOKIE_NAME)?.value;

  if (!session_token) {
    console.log("[Auth] No session token in cookies");
    return null;
  }

  const session = await db.session.findUnique({
    where: { token: session_token },
    include: { user: true },
  });

  if (!session) {
    console.log("[Auth] Session not found in database");
    return null;
  }

  // Check if expired
  if (new Date() > session.expires_at) {
    console.log("[Auth] Session expired");
    return null;
  }

  console.log("[Auth] Session valid", { user_id: session.user.id });

  return session;
}

/**
 * Get session token from cookies
 *
 * @returns Session token or undefined
 */
export async function get_session_token(): Promise<string | undefined> {
  const cookie_store = await cookies();
  return cookie_store.get(SESSION_CONFIG.COOKIE_NAME)?.value;
}

/**
 * Set session cookie
 *
 * @param token - Session token
 */
export async function set_session_cookie(token: string) {
  console.log("[Auth] Setting session cookie");

  const cookie_store = await cookies();
  cookie_store.set(SESSION_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

/**
 * Clear session cookie
 */
export async function clear_session_cookie() {
  console.log("[Auth] Clearing session cookie");

  const cookie_store = await cookies();
  cookie_store.delete(SESSION_CONFIG.COOKIE_NAME);
}
