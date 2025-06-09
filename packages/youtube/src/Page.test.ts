import { beforeEach, describe, expect, it, vi } from "vitest";

import { Page } from "./Page";

describe("Page", () => {
  const mockData = { items: ["item1", "item2"] };
  const mockGetWithToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should construct with valid options", () => {
    const page = new Page({
      data: mockData,
      prevToken: "prev123",
      nextToken: "next456",
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    expect(page.data).toBe(mockData);
    expect(page.resultsPerPage).toBe(2);
    expect(page.totalResults).toBe(10);
  });

  it("should handle undefined tokens as null", async () => {
    const page = new Page({
      data: mockData,
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    expect(await page.prev()).toBeNull();
    expect(await page.next()).toBeNull();
  });

  it("should throw error when resultsPerPage or totalResults is null", () => {
    expect(
      () =>
        new Page({
          data: mockData,
          getWithToken: mockGetWithToken,
          resultsPerPage: null,
          totalResults: 10,
        }),
    ).toThrow();

    expect(
      () =>
        new Page({
          data: mockData,
          getWithToken: mockGetWithToken,
          resultsPerPage: 2,
          totalResults: null,
        }),
    ).toThrow();
  });

  it("should call getWithToken with correct token for prev()", async () => {
    const page = new Page({
      data: mockData,
      prevToken: "prev123",
      nextToken: "next456",
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    await page.prev();
    expect(mockGetWithToken).toHaveBeenCalledWith("prev123");
  });

  it("should call getWithToken with correct token for next()", async () => {
    const page = new Page({
      data: mockData,
      prevToken: "prev123",
      nextToken: "next456",
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    await page.next();
    expect(mockGetWithToken).toHaveBeenCalledWith("next456");
  });

  it("should return null for prev() when no prevToken exists", async () => {
    const page = new Page({
      data: mockData,
      prevToken: null,
      nextToken: "next456",
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    expect(await page.prev()).toBeNull();
  });

  it("should return null for next() when no nextToken exists", async () => {
    const page = new Page({
      data: mockData,
      prevToken: "prev123",
      nextToken: null,
      resultsPerPage: 2,
      totalResults: 10,
      getWithToken: mockGetWithToken,
    });

    expect(await page.next()).toBeNull();
  });

  it("should fetch all pages correctly", async () => {
    const page1Data = { items: ["item1"] };
    const page2Data = { items: ["item2"] };

    const getWithToken = vi.fn().mockImplementationOnce(() =>
      Promise.resolve(
        new Page({
          data: page2Data,
          prevToken: null,
          nextToken: null,
          resultsPerPage: 1,
          totalResults: 3,
          getWithToken,
        }),
      ),
    );

    const page = new Page({
      data: page1Data,
      prevToken: null,
      nextToken: "next",
      resultsPerPage: 1,
      totalResults: 3,
      getWithToken,
    });

    const allPages = await page.all();
    expect(allPages).toEqual([page1Data, page2Data]);
  });

  it("should fetch all pages in order when called from middle page", async () => {
    const page1Data = { items: ["item1"] };
    const page2Data = { items: ["item2"] };
    const page3Data = { items: ["item3"] };

    const getWithToken = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Page({
            data: page3Data,
            prevToken: "prev2",
            nextToken: null,
            resultsPerPage: 1,
            totalResults: 3,
            getWithToken,
          }),
        ),
      )
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Page({
            data: page1Data,
            prevToken: null,
            nextToken: "next1",
            resultsPerPage: 1,
            totalResults: 3,
            getWithToken,
          }),
        ),
      );

    // 真ん中のページから開始
    const page2 = new Page({
      data: page2Data,
      prevToken: "prev1",
      nextToken: "next2",
      resultsPerPage: 1,
      totalResults: 3,
      getWithToken,
    });

    const allPages = await page2.all();
    expect(allPages).toEqual([page1Data, page2Data, page3Data]);
  });
});
