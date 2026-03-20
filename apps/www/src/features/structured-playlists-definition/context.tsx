"use client";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { createContext, useContext, useState } from "react";
import { useFocusedAccount } from "@/features/accounts";
import { saveStructuredPlaylistsDefinition } from "./actions";

type ContextValue = [
  data: StructuredPlaylistsDefinition | null,
  save: (data: StructuredPlaylistsDefinition | null) => Promise<void>,
];

const StructuredPlaylistsDefinitionContext = createContext<ContextValue | null>(
  null,
);

export function StructuredPlaylistsDefinitionProvider({
  initialData,
  children,
}: {
  initialData: Record<string, StructuredPlaylistsDefinition>;
  children: React.ReactNode;
}) {
  const [definitions, setDefinitions] = useState<
    Map<string, StructuredPlaylistsDefinition | null>
  >(new Map(Object.entries(initialData)));

  const [focusedAccount] = useFocusedAccount();

  const data = focusedAccount
    ? (definitions.get(focusedAccount.id) ?? null)
    : null;

  async function save(newData: StructuredPlaylistsDefinition | null) {
    if (!focusedAccount) return;
    const accId = focusedAccount.id;
    try {
      await saveStructuredPlaylistsDefinition(accId, newData);
      setDefinitions((prev) => {
        const next = new Map(prev);
        next.set(accId, newData);
        return next;
      });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: necessary
      console.error("Failed to save structured playlists definition:", error);
      throw error;
    }
  }

  return (
    <StructuredPlaylistsDefinitionContext.Provider value={[data, save]}>
      {children}
    </StructuredPlaylistsDefinitionContext.Provider>
  );
}

export function useStructuredPlaylistsDefinition(): ContextValue {
  const ctx = useContext(StructuredPlaylistsDefinitionContext);
  if (!ctx) {
    throw new Error(
      "useStructuredPlaylistsDefinition must be used within StructuredPlaylistsDefinitionProvider",
    );
  }
  return ctx;
}
