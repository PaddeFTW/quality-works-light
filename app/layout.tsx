import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme-provider";
import { OrgProvider } from "@/components/providers/org-provider";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable}`} lang="sv" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <OrgProvider>{children}</OrgProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
