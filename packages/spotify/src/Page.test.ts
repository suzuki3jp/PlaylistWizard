import { describe, expect, it, vi } from "vitest";
import { Page } from "./Page";

describe("Page", () => {
  const mockRest = {
    fetch: vi.fn(),
  };

  const mockData = {
    href: "test-href",
    limit: 20,
    next: null,
    offset: 0,
    previous: null,
    total: 2,
    items: [{ id: 1 }, { id: 2 }],
  };

  it("should initialize with items", () => {
    const page = new Page(mockData, mockRest);
    expect(page.items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("should return all items when no next/prev pages exist", async () => {
    const page = new Page(mockData, mockRest);
    const result = await page.all();
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("should fetch and combine items from next pages", async () => {
    const nextPageData = {
      ...mockData,
      next: null,
      previous: "prev-url",
      items: [{ id: 3 }, { id: 4 }],
    };

    const initialData = {
      ...mockData,
      next: "next-url",
    };

    mockRest.fetch.mockResolvedValueOnce(nextPageData);

    const page = new Page(initialData, mockRest);
    const result = await page.all();

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    expect(mockRest.fetch).toHaveBeenCalledWith("next-url", {});
  });

  it("should fetch and combine items from previous pages", async () => {
    const prevPageData = {
      ...mockData,
      next: "next-url",
      previous: null,
      items: [{ id: 0 }, { id: 1 }],
    };

    const initialData = {
      ...mockData,
      previous: "prev-url",
    };

    mockRest.fetch.mockResolvedValueOnce(prevPageData);

    const page = new Page(initialData, mockRest);
    const result = await page.all();

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 0 }, { id: 1 }]);
    expect(mockRest.fetch).toHaveBeenCalledWith("prev-url", {});
  });
});
