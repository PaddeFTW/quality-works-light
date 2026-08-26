import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme-provider";
import { OrgProvider } from "@/components/providers/org-provider";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

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
    <html suppressHydrationWarning lang="sv">
      <body className={inter.className}>
        <ThemeProvider>
          <OrgProvider>{children}</OrgProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
