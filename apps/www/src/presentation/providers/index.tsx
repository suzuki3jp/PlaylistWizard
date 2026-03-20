"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { CookiesProvider } from "react-cookie";

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
