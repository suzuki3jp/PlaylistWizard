"use client";
import {
    ThemeProvider as NextThemeProvider,
    type ThemeProviderProps as NextThemeProviderProps,
} from "next-themes";
import type React from "react";

/**
 * The theme provider component.
 * It is used to provide the theme to the application.
 * It is a CSR component.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    ...props
}) => {
    return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
};

export type ThemeProviderProps = Readonly<
    React.PropsWithChildren<NextThemeProviderProps>
>;
