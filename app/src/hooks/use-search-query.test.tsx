import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSearchQuery } from "./use-search-query";

describe("useSearchQuery", () => {
  it("should return true when search query is empty", () => {
    const { result } = renderHook(() => useSearchQuery());
    expect(result.current.isMatchingSearchQuery("any text")).toBe(true);
  });

  it("should match single word queries", () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setSearchQuery("hello");
    });
    expect(result.current.isMatchingSearchQuery("hello world")).toBe(true);
    expect(result.current.isMatchingSearchQuery("world hello")).toBe(true);
    expect(result.current.isMatchingSearchQuery("hi there")).toBe(false);
  });

  it("should match multiple word queries with AND logic", () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setSearchQuery("hello world");
    });
    expect(result.current.isMatchingSearchQuery("hello world")).toBe(true);
    expect(result.current.isMatchingSearchQuery("world hello")).toBe(true);
    expect(result.current.isMatchingSearchQuery("hello there")).toBe(false);
    expect(result.current.isMatchingSearchQuery("world there")).toBe(false);
  });

  it("should be case insensitive", () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setSearchQuery("HeLLo WoRLd");
    });
    expect(result.current.isMatchingSearchQuery("hello world")).toBe(true);
    expect(result.current.isMatchingSearchQuery("HELLO WORLD")).toBe(true);
    expect(result.current.isMatchingSearchQuery("Hi There")).toBe(false);
  });

  it("should ignore extra spaces in the search query", () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setSearchQuery("  hello   world  ");
    });
    expect(result.current.isMatchingSearchQuery("hello world")).toBe(true);
    expect(result.current.isMatchingSearchQuery("world hello")).toBe(true);
    expect(result.current.isMatchingSearchQuery("hello there")).toBe(false);
  });
});
