/**
 * Whether the given data is null or undefined.
 * @param data The data to check
 * @returns
 */
export function isNullish<T>(
  data: T | null | undefined,
): data is null | undefined {
  return data === null || data === undefined;
}
