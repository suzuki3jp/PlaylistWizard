"use client";

import { ThemeProvider as NativeThemeProvider, useTheme } from "next-themes";
import { type PropsWithChildren, useEffect, useState } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  // Protects against hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return (
    <NativeThemeProvider attribute="class" defaultTheme="dark">
      {children}
    </NativeThemeProvider>
  );
}
