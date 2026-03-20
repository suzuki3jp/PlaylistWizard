"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";

import { CommandHistory } from "@/usecase/command/history";

const HistoryContext = createContext(new CommandHistory());

export function HistoryProvider({ children }: PropsWithChildren) {
  const [history] = useState(new CommandHistory());

  return (
    <HistoryContext.Provider value={history}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = use(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
