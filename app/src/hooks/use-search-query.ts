"use client";
import { useState } from "react";

export function useSearchQuery() {
  const [searchQuery, setSearchQuery] = useState("");

  function isMatchingSearchQuery(...target: string[]): boolean {
    if (!searchQuery.trim()) return true;

    // Split search query by spaces and treat each word as an OR condition
    const queries = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((q) => q.length > 0);

    return queries.every((query) =>
      target.some((item) => item.toLowerCase().includes(query)),
    );
  }

  return { searchQuery, setSearchQuery, isMatchingSearchQuery };
}
