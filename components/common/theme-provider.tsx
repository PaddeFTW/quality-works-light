"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function KeepTwoThemes() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (!theme || theme === "light" || theme === "dark") return;
    setTheme(theme === "contrast-dark" ? "dark" : "light");
  }, [theme, setTheme]);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
      themes={["light", "dark"]}
    >
      <KeepTwoThemes />
      {children}
    </NextThemesProvider>
  );
}