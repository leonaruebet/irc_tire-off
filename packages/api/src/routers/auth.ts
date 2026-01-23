/**
 * Authentication router
 * Handles OTP-based phone authentication
 */

import { TRPCError } from "@trpc/server";
import { create_router, public_procedure, protected_procedure } from "../trpc";
import {
  request_otp_schema,
  verify_otp_schema,
  mask_phone,
  generate_otp,
  is_otp_expired,
  generate_session_token,
  send_otp,
  get_sms_config,
  verify_otp_via_sms,
} from "@tireoff/shared";
import { OTP_CONFIG, SESSION_CONFIG } from "@tireoff/shared";

export const auth_router = create_router({
  /**
   * Request OTP for phone number
   * Creates user if not exists, generates OTP with rate limiting
   * Sends OTP via configured SMS provider (ThaiBulkSMS or console)
   */
  request_otp: public_procedure
    .input(request_otp_schema)
    .mutation(async ({ ctx, input }) => {
      console.log("[Auth] Request OTP started", { phone: input.phone });

      const { db } = ctx;
      const phone = input.phone;

      // Find or create user
      let user = await db.user.findUnique({
        where: { phone },
      });

      if (!user) {
        console.log("[Auth] Creating new user", { phone });
        user = await db.user.create({
          data: {
            phone,
            phone_masked: mask_phone(phone),
          },
        });
      }

      // Check for existing unexpired OTP with cooldown
      const existing_otp = await db.oTPToken.findFirst({
        where: {
          user_id: user.id,
          verified: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: "desc" },
      });

      if (existing_otp?.cooldown_until && new Date() < existing_otp.cooldown_until) {
        const remaining_seconds = Math.ceil(
          (existing_otp.cooldown_until.getTime() - Date.now()) / 1000
        );

        console.log("[Auth] OTP cooldown active", { remaining_seconds });

        return {
          success: false,
          cooldown_seconds: remaining_seconds,
          error: "Please wait before requesting another OTP",
        };
      }

      // Generate new OTP
      const otp_code = generate_otp();
      const expires_at = new Date(
        Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
      );
      const cooldown_until = new Date(
        Date.now() + OTP_CONFIG.COOLDOWN_SECONDS * 1000
      );

      // Delete old unverified OTPs for this user
      await db.oTPToken.deleteMany({
        where: {
          user_id: user.id,
          verified: false,
        },
      });

      // Create new OTP token
      const otp_record = await db.oTPToken.create({
        data: {
          user_id: user.id,
          code: otp_code,
          expires_at,
          cooldown_until,
        },
      });

      // Send OTP via SMS provider
      const sms_config = get_sms_config();
      console.log("[Auth] Sending OTP via SMS provider", {
        provider: sms_config.provider,
      });

      const sms_result = await send_otp(phone, otp_code);

      if (!sms_result.success) {
        console.error("[Auth] Failed to send OTP", {
          error: sms_result.error,
        });

        // Still return success to avoid revealing SMS issues to client
        // Log the error for monitoring
      }

      // Store SMS token for ThaiBulkSMS verification
      if (sms_result.success && sms_result.token) {
        console.log("[Auth] Storing SMS token for verification", {
          token_prefix: sms_result.token.substring(0, 10) + "...",
        });

        await db.oTPToken.update({
          where: { id: otp_record.id },
          data: { sms_token: sms_result.token },
        });
      }

      // For development with console provider, log the OTP
      if (sms_config.provider === "console") {
        console.log("[Auth] Development mode - OTP logged", {
          phone,
          otp: otp_code,
          expires_at,
        });
      }

      console.log("[Auth] Request OTP completed", { phone, success: true });

      return {
        success: true,
        phone_masked: mask_phone(phone),
      };
    }),

  /**
   * Verify OTP and create session
   */
  verify_otp: public_procedure
    .input(verify_otp_schema)
    .mutation(async ({ ctx, input }) => {
      console.log("[Auth] Verify OTP started", { phone: input.phone });

      const { db, ip_address } = ctx;
      const { phone, code } = input;

      // Check for development bypass code (only in non-production)
      const is_dev_bypass =
        process.env.NODE_ENV !== "production" &&
        code === OTP_CONFIG.DEV_BYPASS_CODE;

      // Find user (create if dev bypass and not exists)
      let user = await db.user.findUnique({
        where: { phone },
      });

      if (!user && is_dev_bypass) {
        console.log("[Auth] Dev bypass: Creating user", { phone });
        user = await db.user.create({
          data: {
            phone,
            phone_masked: mask_phone(phone),
          },
        });
      }

      if (!user) {
        console.log("[Auth] User not found", { phone });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. Please request OTP first.",
        });
      }

      // Find valid OTP (skip if dev bypass)
      const otp_token = await db.oTPToken.findFirst({
        where: {
          user_id: user.id,
          verified: false,
        },
        orderBy: { created_at: "desc" },
      });

      if (!is_dev_bypass && !otp_token) {
        console.log("[Auth] No OTP found", { phone });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No OTP found. Please request a new OTP.",
        });
      }

      // Check expiry (skip if dev bypass)
      if (!is_dev_bypass && otp_token && is_otp_expired(otp_token.expires_at)) {
        console.log("[Auth] OTP expired", { phone });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OTP has expired. Please request a new OTP.",
        });
      }

      // Check attempts (skip if dev bypass)
      if (!is_dev_bypass && otp_token && otp_token.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
        console.log("[Auth] Max attempts exceeded", { phone });
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many failed attempts. Please request a new OTP.",
        });
      }

      if (is_dev_bypass) {
        console.log("[Auth] Development bypass code used", { phone });
      }

      // Verify code (allow dev bypass)
      if (!is_dev_bypass && otp_token) {
        const sms_config = get_sms_config();
        let is_code_valid = false;

        // Use ThaiBulkSMS verification if token is available
        if (sms_config.provider === "thaibulksms" && otp_token.sms_token) {
          console.log("[Auth] Verifying OTP via ThaiBulkSMS API", { phone });

          const verify_result = await verify_otp_via_sms({
            token: otp_token.sms_token,
            pin: code,
            api_key: sms_config.api_key,
            api_secret: sms_config.api_secret,
          });

          is_code_valid = verify_result.success;

          if (!is_code_valid) {
            console.log("[Auth] ThaiBulkSMS verification failed", {
              phone,
              error: verify_result.error,
            });
          }
        } else {
          // Fallback to local code comparison (for console provider)
          is_code_valid = otp_token.code === code;
        }

        if (!is_code_valid) {
          // Increment attempts
          await db.oTPToken.update({
            where: { id: otp_token.id },
            data: { attempts: { increment: 1 } },
          });

          const remaining = OTP_CONFIG.MAX_ATTEMPTS - otp_token.attempts - 1;
          console.log("[Auth] Invalid OTP", { phone, remaining_attempts: remaining });

          return {
            success: false,
            error: "Invalid OTP code",
            attempts_remaining: remaining,
          };
        }
      }

      // Mark OTP as verified (if exists)
      if (otp_token) {
        await db.oTPToken.update({
          where: { id: otp_token.id },
          data: { verified: true },
        });
      }

      // Create session
      const session_token = generate_session_token();
      const session_expires = new Date(
        Date.now() + SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );

      await db.session.create({
        data: {
          user_id: user.id,
          token: session_token,
          expires_at: session_expires,
          ip_address,
        },
      });

      // Update user last login
      await db.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      console.log("[Auth] Verify OTP completed", { phone, success: true });

      return {
        success: true,
        session_token,
      };
    }),

  /**
   * Get current user session info
   */
  me: protected_procedure.query(async ({ ctx }) => {
    console.log("[Auth] Get me", { user_id: ctx.user.id });

    return {
      id: ctx.user.id,
      phone: ctx.user.phone,
      phone_masked: ctx.user.phone_masked,
      last_login: ctx.user.last_login,
    };
  }),

  /**
   * Logout - invalidate session
   */
  logout: protected_procedure.mutation(async ({ ctx }) => {
    console.log("[Auth] Logout", { user_id: ctx.user.id });

    await ctx.db.session.delete({
      where: { id: ctx.session.id },
    });

    console.log("[Auth] Logout completed", { user_id: ctx.user.id });

    return { success: true };
  }),
});
