"use client";
import { createContext, type PropsWithChildren, use, useState } from "react";

type SearchQueryContextType = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const SearchQueryContext = createContext<SearchQueryContextType>({
  searchQuery: "",
  setSearchQuery: () => {
    throw new Error(
      "The SearchQueryContext#setSearchQuery function called before the context was initialized. This is a bug.",
    );
  },
});

export function SearchQueryContextProvider({ children }: PropsWithChildren) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <SearchQueryContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchQueryContext.Provider>
  );
}

export function useSearchQuery() {
  return use(SearchQueryContext);
}
