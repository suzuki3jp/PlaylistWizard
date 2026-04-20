"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import { CookiesProvider } from "react-cookie";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (mod) => mod.ReactQueryDevtools,
          ),
        { ssr: false },
      )
    : () => null;

export const queryClient = new QueryClient();

export interface ProviderProps extends PropsWithChildren {}

export function Providers({ children }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <JotaiProvider>
        <CookiesProvider>{children}</CookiesProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}

export function CookiesProviderClient({ children }: PropsWithChildren) {
  return <CookiesProvider>{children}</CookiesProvider>;
}
