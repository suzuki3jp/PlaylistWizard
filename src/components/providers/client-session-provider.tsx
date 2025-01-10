"use client";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";

/**
 * The client session provider component.
 * It is wrapper component for the next-auth session provider.
 * @param props
 * @returns
 */
export const ClientSessionProvider = (props: SessionProviderProps) => {
    return <SessionProvider {...props} />;
};
