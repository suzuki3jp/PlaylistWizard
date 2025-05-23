import { BUG_REPORT } from "./constants";

export interface PaginationOptions<T> {
  data: T;
  prevToken?: string | null;
  nextToken?: string | null;
  resultsPerPage?: number | null;
  totalResults?: number | null;
  getWithToken: (token: string) => Promise<Page<T>>;
}

/**
 * Provides utility methods for pagination.
 */
export class Page<T> {
  /**
   * The data of the current page.
   */
  public data: T;

  /**
   * The number of results included in the API response.
   */
  public resultsPerPage: number;

  /**
   * The total number of results in the result set.
   * @remarks This number may be larger than the number of actual retrievable results. The YouTube Data API may not return some playlists (for example, the "Liked videos" playlist). However, the totalResults count may include them.
   */
  public totalResults: number;

  /**
   * The token for the previous page.
   * If it is `null`, there is no previous page.
   */
  private prevToken: string | null;

  /**
   * The token for the next page.
   * If it is `null`, there is no next page.
   */
  private nextToken: string | null;

  /**
   * Fetches the page with the given token.
   * @param token - The token of the page to fetch.
   */
  private getWithToken: (token: string) => Promise<Page<T>>;

  constructor({
    data,
    prevToken,
    nextToken,
    resultsPerPage,
    totalResults,
    getWithToken,
  }: PaginationOptions<T>) {
    this.data = data;
    this.prevToken = prevToken ?? null;
    this.nextToken = nextToken ?? null;
    this.getWithToken = getWithToken;

    if (isNullish(resultsPerPage) || isNullish(totalResults))
      throw new Error(
        `YouTube API returned nullish property of Page. resultsPerPage: ${resultsPerPage}, totalResults: ${totalResults}. ll${BUG_REPORT}`,
      );

    this.resultsPerPage = resultsPerPage;
    this.totalResults = totalResults;
  }

  /**
   * Fetches the previous page.
   * @returns
   */
  public async prev(): Promise<Page<T> | null> {
    if (!this.prevToken) return null;
    const data = await this.getWithToken(this.prevToken);
    return data;
  }

  /**
   * Fetches the next page.
   * @returns
   */
  public async next(): Promise<Page<T> | null> {
    if (!this.nextToken) return null;
    const data = await this.getWithToken(this.nextToken);
    return data;
  }

  /**
   * Fetches all pages.
   *
   * Note: This method may consume quotas unnecessarily. Implementation of gradual loading, such as scroll loading, is recommended.
   * @returns
   */
  public async all(): Promise<T[]> {
    const results: T[] = [this.data];
    let current: Page<T> | null = this;

    while (current) {
      current = await current.next();
      if (current) results.push(current.data);
    }

    current = this;
    while (current) {
      current = await current.prev();
      if (current) results.unshift(current.data);
    }

    return results;
  }
}

/**
 * Check if the data is null or undefined
 * @param data The data to check
 * @returns
 */
export function isNullish<T>(
  data: T | null | undefined,
): data is null | undefined {
  return data === null || data === undefined;
}
