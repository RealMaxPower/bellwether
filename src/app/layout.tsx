import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Fonts are loaded directly from Google Fonts (matching the Bellwether.html
// prototype's `<link>`) so we get the exact same variable-axis files —
// Source Serif 4 ital+opsz+wght, Inter wght, JetBrains Mono wght.
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

export const metadata: Metadata = {
  title: "Bellwether — atlas of the ISM PMI",
  description:
    "Interactive atlas of the ISM PMI suite — Manufacturing 1948→present, Services 1997→present — alongside US economic policy. Three economist views per policy event. Free, no signup.",
  metadataBase: new URL("https://bellwether-nine.vercel.app"),
  // The 1200x630 OpenGraph card and Twitter summary_large_image are generated
  // by src/app/opengraph-image.tsx (and Next.js fans that out to the twitter
  // tags automatically) so every share-link preview has a proper rendered
  // image rather than an SVG icon.
  openGraph: {
    title: "Bellwether",
    description:
      "Interactive atlas of the ISM PMI suite — Manufacturing 1948→present, Services 1997→present — alongside US economic policy.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bellwether",
    description:
      "Interactive atlas of the ISM PMI suite — Manufacturing 1948→present, Services 1997→present — alongside US economic policy.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body className="min-h-screen bg-paper text-ink-700">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SiteHeader />
          <main className="min-h-[calc(100vh-12rem)]">{children}</main>
          <SiteFooter />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
