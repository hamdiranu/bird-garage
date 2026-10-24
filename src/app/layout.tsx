import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { InlineScript } from "@/components/ui/InlineScript";
import { CARS } from "@/lib/fleet";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, carMetadata, siteUrl } from "@/lib/previews";
import { themeScript } from "@/lib/theme";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
});
const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-chakra",
});

// The home page shares with the first car's preview picture.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  ...carMetadata(CARS[0], "/", { title: SITE_TITLE, description: SITE_DESCRIPTION }),
  applicationName: SITE_NAME,
  authors: [{ name: "Hamdi Ranuharja" }],
  creator: "Hamdi Ranuharja",
  // Pages are open to crawlers, and Google may show a car's preview picture full size rather than as a thumbnail.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Set GOOGLE_SITE_VERIFICATION to the token from Search Console to verify the site by meta tag.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8eef6" },
    { media: "(prefers-color-scheme: dark)", color: "#050c1d" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set by the script below before first paint, so the page never flashes the wrong theme
    <html lang="en" className={`${barlow.variable} ${chakra.variable}`} suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body>{children}</body>
    </html>
  );
}
