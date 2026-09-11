"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// React 19 emits a console error when next-themes injects an inline anti-flicker script tag
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const firstArg = typeof args[0] === "string" ? args[0] : "";
    if (firstArg.includes("Encountered a script tag while rendering React component")) {
      return;
    }
    origError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
