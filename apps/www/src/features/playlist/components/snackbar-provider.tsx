"use client";
import { SnackbarProvider } from "notistack";
import type { PropsWithChildren } from "react";

export function PlaylistSnackbarProvider({ children }: PropsWithChildren) {
  return <SnackbarProvider>{children}</SnackbarProvider>;
}
