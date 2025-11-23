/**
 * Utility type to remove branding from a branded type.
 */

// biome-ignore lint/suspicious/noExplicitAny: Required
export type Unbrand<T> = T extends infer U & { __brand: any } ? U : T;

export type DeepUnbrand<T> = T extends (infer U)[]
  ? DeepUnbrand<U>[]
  : T extends object
    ? { [K in keyof T]: DeepUnbrand<Unbrand<T[K]>> }
    : Unbrand<T>;
