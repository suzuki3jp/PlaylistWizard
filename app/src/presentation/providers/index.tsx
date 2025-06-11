"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { type PropsWithChildren, createContext } from "react";
import { CookiesProvider } from "react-cookie";
import { PlaylistsProvider, TaskProvider } from "../playlists/contexts";
import { HistoryProvider } from "../playlists/history";

export interface ProviderProps extends PropsWithChildren {}

export function Providers({ children }: ProviderProps) {
  return (
    <CookiesProvider>
      <SessionProvider>
        <AuthProvider>
          <TaskProvider>
            <PlaylistsProvider>
              <HistoryProvider>{children}</HistoryProvider>
            </PlaylistsProvider>
          </TaskProvider>
        </AuthProvider>
      </SessionProvider>
    </CookiesProvider>
  );
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
  const { data } = useSession();
  let value = data;
  if (data && (!data.accessToken || !data.provider)) value = null;

  // @ts-expect-error
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
}
