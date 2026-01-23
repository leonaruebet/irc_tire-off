import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme_provider";
import { TRPCProvider } from "@/components/providers/trpc_provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * Root layout metadata
 */
export const metadata: Metadata = {
  title: {
    default: "TireTrack - Tire Age Tracking",
    template: "%s | TireTrack",
  },
  description: "Track your tire and oil service history",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TireTrack",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

/**
 * Root layout component
 * Wraps all pages with providers
 * Uses IBM Plex Sans Thai font from globals.css
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[Layout] Rendering root layout");

  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <TRPCProvider>
              <main className="relative flex min-h-screen flex-col">
                {children}
              </main>
              <Toaster />
            </TRPCProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
