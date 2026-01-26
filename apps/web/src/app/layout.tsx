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
    default: "ทรัพย์ไพศาล - Tire Age Tracking",
    template: "%s | ทรัพย์ไพศาล",
  },
  description: "Track your tire and oil service history",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ทรัพย์ไพศาล",
  },
  authors: [{ name: "iReadCustomer", url: "https://ireadcustomer.com" }],
  creator: "iReadCustomer",
  publisher: "iReadCustomer",
  other: {
    "designer": "iReadCustomer",
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
      <head>
        {/* SEO: link rel author/publisher to iReadCustomer */}
        <link rel="author" href="https://ireadcustomer.com" />
        <link rel="publisher" href="https://ireadcustomer.com" />
        {/* SEO: JSON-LD structured data referencing iReadCustomer as creator */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ทรัพย์ไพศาล",
              "description": "Track your tire and oil service history",
              "applicationCategory": "BusinessApplication",
              "creator": {
                "@type": "Organization",
                "name": "iReadCustomer",
                "url": "https://ireadcustomer.com",
              },
              "developer": {
                "@type": "Organization",
                "name": "iReadCustomer",
                "url": "https://ireadcustomer.com",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {/* SEO backlink - hidden from UI */}
        <a
          href="https://ireadcustomer.com"
          rel="noopener"
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
        >
          iReadCustomer
        </a>
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
        {/* Subtle footer credit with SEO backlink */}
        <footer
          style={{ textAlign: "center", padding: "8px 0", fontSize: "10px", color: "#ccc" }}
        >
          Powered by{" "}
          <a
            href="https://ireadcustomer.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ccc", textDecoration: "none" }}
          >
            iReadCustomer
          </a>
        </footer>
      </body>
    </html>
  );
}
