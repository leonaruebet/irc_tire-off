import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

// Static imports for messages (Turbopack doesn't support dynamic pattern imports)
import th_messages from "./messages/th.json";
import en_messages from "./messages/en.json";

const messages_map = {
  th: th_messages,
  en: en_messages,
} as const;

type SupportedLocale = keyof typeof messages_map;

/**
 * Get the locale from request headers or cookies
 * Supports Thai (th) as primary and English (en) as secondary
 *
 * @returns Promise with locale configuration
 */
export default getRequestConfig(async () => {
  console.log("[i18n] Getting request config");

  // Priority: cookie > accept-language header > default
  const cookie_store = await cookies();
  const header_list = await headers();

  // Default to Thai - only use English if explicitly set via cookie
  let locale: SupportedLocale = "th";

  const cookie_locale = cookie_store.get("locale")?.value;
  if (cookie_locale && cookie_locale in messages_map) {
    locale = cookie_locale as SupportedLocale;
  }
  // Note: Accept-language header is ignored - Thai is always default
  // Users can switch language via the UI which sets the locale cookie

  console.log("[i18n] Locale resolved", { locale });

  return {
    locale,
    messages: messages_map[locale],
  };
});
