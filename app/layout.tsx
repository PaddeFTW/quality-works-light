import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme-provider";
import { OrgProvider } from "@/components/providers/org-provider";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={`${geist.variable} ${inter.variable}`} lang="sv" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider>
          <OrgProvider>{children}</OrgProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
