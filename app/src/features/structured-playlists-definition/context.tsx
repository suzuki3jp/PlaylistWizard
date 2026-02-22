"use client";
import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import { createContext, useContext, useState } from "react";
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
  initialData: StructuredPlaylistsDefinition | null;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<StructuredPlaylistsDefinition | null>(
    initialData,
  );

  async function save(newData: StructuredPlaylistsDefinition | null) {
    await saveStructuredPlaylistsDefinition(newData);
    setData(newData);
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
