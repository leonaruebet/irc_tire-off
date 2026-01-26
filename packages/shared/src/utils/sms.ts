/**
 * SMS Provider Utilities for ThaiBulkSMS OTP
 * Handles OTP request and verification via ThaiBulkSMS API
 */

// ============================================
// TYPES
// ============================================

export interface SmsOtpRequestParams {
  /** Phone number in Thai format (e.g., 0917013331 or 66917013331) */
  phone: string;
  /** OTP code to send (6 digits) */
  code: string;
  /** API key from ThaiBulkSMS dashboard */
  api_key: string;
  /** API secret from ThaiBulkSMS dashboard */
  api_secret: string;
}

export interface SmsOtpRequestResult {
  /** Whether the request was successful */
  success: boolean;
  /** Token for verification (returned by ThaiBulkSMS) */
  token?: string;
  /** Error message if failed */
  error?: string;
  /** Transaction ID for tracking */
  transaction_id?: string;
}

export interface SmsOtpVerifyParams {
  /** Token from request */
  token: string;
  /** OTP code entered by user */
  pin: string;
  /** API key from ThaiBulkSMS dashboard */
  api_key: string;
  /** API secret from ThaiBulkSMS dashboard */
  api_secret: string;
}

export interface SmsOtpVerifyResult {
  /** Whether the verification was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ============================================
// THAIBULKSMS OTP API
// ============================================

/**
 * ThaiBulkSMS OTP API endpoints
 */
export const THAIBULKSMS_OTP_API = {
  /** Request OTP endpoint (v2) */
  REQUEST: "https://otp.thaibulksms.com/v2/otp/request",
  /** Verify OTP endpoint (v2) */
  VERIFY: "https://otp.thaibulksms.com/v2/otp/verify",
} as const;

/**
 * Normalize phone number to Thai format
 * Converts 0917013331 to 66917013331
 *
 * @param phone - Phone number
 * @returns Normalized phone number with 66 prefix
 */
export function normalize_phone_for_sms(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 66
  if (cleaned.startsWith("0")) {
    return "66" + cleaned.slice(1);
  }

  // If already has 66 prefix, return as is
  if (cleaned.startsWith("66")) {
    return cleaned;
  }

  // Default: assume Thai number with 66 prefix
  return "66" + cleaned;
}

/**
 * Send OTP request via ThaiBulkSMS API
 *
 * @param params - OTP request parameters
 * @returns Request result with token for verification
 */
export async function request_otp_via_sms(
  params: SmsOtpRequestParams
): Promise<SmsOtpRequestResult> {
  const { phone, api_key, api_secret } = params;

  const msisdn = normalize_phone_for_sms(phone);
  console.log("[SMS] Requesting OTP via ThaiBulkSMS", { msisdn });

  try {
    // ThaiBulkSMS OTP API generates its own OTP and sends it to the user.
    // Do NOT send `pin` — the pin is only used at the /verify step.
    // API requires x-www-form-urlencoded format and +66 phone prefix.
    const response = await fetch(THAIBULKSMS_OTP_API.REQUEST, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        key: api_key,
        secret: api_secret,
        msisdn: `+${msisdn}`,
      }),
    });

    const data = await response.json();

    console.log("[SMS] ThaiBulkSMS response", {
      status: response.status,
      data: JSON.stringify(data),
    });

    // ThaiBulkSMS v2 response formats:
    // Success: { status: "success", token: "...", ... }
    // Error:   { errors: [{ detail: "...", message: "..." }], code: 400 }
    // Legacy:  { code: "000", token: "..." }
    const is_success =
      (response.ok && data.status === "success") ||
      (response.ok && data.code === "000");
    const token = data.token;

    if (is_success && token) {
      console.log("[SMS] OTP request successful", {
        token: token.substring(0, 10) + "...",
      });

      return {
        success: true,
        token,
      };
    }

    // Extract error message from v2 error format: { errors: [{ detail, message }] }
    const error_detail = data.errors?.[0]?.detail || "";
    const error_message =
      data.errors?.[0]?.message ||
      data.message ||
      data.description ||
      "SMS request failed";

    console.error("[SMS] OTP request failed", {
      http_status: response.status,
      response_code: data.code,
      error_detail,
      error_message,
      raw: JSON.stringify(data),
    });

    return {
      success: false,
      error: error_detail
        ? `${error_message} (${error_detail})`
        : error_message,
    };
  } catch (error) {
    console.error("[SMS] OTP request error", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Verify OTP via ThaiBulkSMS API
 *
 * @param params - OTP verification parameters
 * @returns Verification result
 */
export async function verify_otp_via_sms(
  params: SmsOtpVerifyParams
): Promise<SmsOtpVerifyResult> {
  const { token, pin, api_key, api_secret } = params;

  console.log("[SMS] Verifying OTP via ThaiBulkSMS", {
    token: token.substring(0, 10) + "...",
  });

  try {
    // ThaiBulkSMS v2 OTP verify expects x-www-form-urlencoded
    const response = await fetch(THAIBULKSMS_OTP_API.VERIFY, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        key: api_key,
        secret: api_secret,
        token: token,
        pin: pin,
      }),
    });

    const data = await response.json();

    console.log("[SMS] ThaiBulkSMS verify response", {
      status: response.status,
      data: JSON.stringify(data),
    });

    // v2 response: { status: "success", message: "..." }
    // Error:       { errors: [...], code: 400 }
    const is_success =
      (response.ok && data.status === "success") ||
      (response.ok && data.code === "000");

    if (is_success) {
      console.log("[SMS] OTP verification successful");

      return {
        success: true,
      };
    }

    const error_message =
      data.message ||
      data.errors?.[0]?.message ||
      data.description ||
      "Verification failed";

    console.error("[SMS] OTP verification failed", {
      http_status: response.status,
      data: JSON.stringify(data),
      error_message,
    });

    return {
      success: false,
      error: error_message,
    };
  } catch (error) {
    console.error("[SMS] OTP verification error", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Send simple SMS message (non-OTP)
 * Uses ThaiBulkSMS SMS API v2
 *
 * @param phone - Phone number
 * @param message - Message content
 * @param api_key - API key
 * @param api_secret - API secret
 * @returns Send result
 */
export async function send_sms(
  phone: string,
  message: string,
  api_key: string,
  api_secret: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[SMS] Sending SMS via ThaiBulkSMS", {
    phone: normalize_phone_for_sms(phone),
    message_length: message.length,
  });

  try {
    const response = await fetch("https://api-v2.thaibulksms.com/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${btoa(`${api_key}:${api_secret}`)}`,
      },
      body: new URLSearchParams({
        msisdn: normalize_phone_for_sms(phone),
        message: message,
        sender: "ทรัพย์ไพศาล",
      }),
    });

    const data = await response.json();

    console.log("[SMS] SMS send response", {
      status: response.status,
      data,
    });

    if (response.ok) {
      return { success: true };
    }

    return {
      success: false,
      error: data.description || data.message || "SMS send failed",
    };
  } catch (error) {
    console.error("[SMS] SMS send error", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Get SMS provider configuration from environment
 * Supports console, thaibulksms providers
 */
export function get_sms_config(): {
  provider: string;
  api_key: string;
  api_secret: string;
} {
  return {
    provider: process.env.SMS_PROVIDER || "console",
    api_key: process.env.SMS_API_KEY || "",
    api_secret: process.env.SMS_API_SECRET || "",
  };
}

/**
 * Send OTP with provider abstraction
 * Automatically selects provider based on SMS_PROVIDER env var
 *
 * @param phone - Phone number
 * @param code - OTP code
 * @returns Send result
 */
export async function send_otp(
  phone: string,
  code: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const config = get_sms_config();

  console.log("[SMS] Sending OTP", {
    provider: config.provider,
    phone: normalize_phone_for_sms(phone),
  });

  switch (config.provider) {
    case "thaibulksms":
      return await request_otp_via_sms({
        phone,
        code,
        api_key: config.api_key,
        api_secret: config.api_secret,
      });

    case "console":
    default:
      // Console fallback for development
      console.log("[SMS] Console mode - OTP:", {
        phone,
        code,
        expires_in: "5 minutes",
      });
      return { success: true };
  }
}
