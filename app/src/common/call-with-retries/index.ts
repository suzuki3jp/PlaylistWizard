import { sleep } from "@/common/sleep";

const DEFAULT_MAX_RETRIES = 3;

// biome-ignore lint/suspicious/noExplicitAny: TODO
type AnyFunction = (...args: any[]) => Promise<any>;

export interface CallWithRetriesOptions<T extends AnyFunction> {
  func: T;
  maxRetries?: number;
}

/**
 * Call the function with retry.
 * If the function returns a status code as **200** or **401**, the result is returned without retries.
 * If the function returns a status code other than **200**, the function is retried up to MAX_RETRY times.
 * @returns
 */
export async function callWithRetries<T extends AnyFunction>(
  { func, maxRetries = DEFAULT_MAX_RETRIES }: CallWithRetriesOptions<T>,
  ...params: Parameters<T>
): Promise<ReturnType<T>> {
  let retries = 0;
  let result: Awaited<ReturnType<T>>;

  do {
    try {
      result = await func(...params);
      if (result.status === 200) break;
      if (result.status === 401) break;
      await sleep(1000 * (retries + 1)); // Exponential backoff
      retries++;
    } catch (error) {
      if (retries >= maxRetries) {
        throw error; // Re-throw the error if max retries reached
      }
      retries++;
    }
  } while (retries <= maxRetries);
  // @ts-expect-error
  return result;
}
