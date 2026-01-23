import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const with_next_intl = createNextIntlPlugin("./src/i18n/request.ts");

const next_config: NextConfig = {
  transpilePackages: ["@tireoff/api", "@tireoff/db", "@tireoff/shared"],
  // Exclude @prisma/client from serverExternalPackages since we transpile @tireoff/db
  serverExternalPackages: [],
};

export default with_next_intl(next_config);
