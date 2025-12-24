"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import { SessionProvider, useSession } from "next-auth/react";
import { createContext, type PropsWithChildren } from "react";
import { CookiesProvider } from "react-cookie";

export const queryClient = new QueryClient();

export interface ProviderProps extends PropsWithChildren {}

export function Providers({ children }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <JotaiProvider>
        <CookiesProvider>
          <SessionProvider>
            <AuthProvider>{children}</AuthProvider>
          </SessionProvider>
        </CookiesProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}

export function CookiesProviderClient({ children }: PropsWithChildren) {
  return <CookiesProvider>{children}</CookiesProvider>;
}

export const AuthContext = createContext<
  | (NonNullable<ReturnType<typeof useSession>["data"]> & {
      provider: NonNullable<
        NonNullable<ReturnType<typeof useSession>["data"]>["provider"]
      >;
      accessToken: NonNullable<
        NonNullable<ReturnType<typeof useSession>["data"]>["accessToken"]
      >;
    })
  | null
>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, status } = useSession();

  if (status === "loading") return null;

  let value = data;
  if (data && (!data.accessToken || !data.provider)) value = null;

  // @ts-expect-error
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
