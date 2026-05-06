export const enumValues = <const T extends Record<string, string>>(
  values: T,
): [T[keyof T], ...T[keyof T][]] => {
  const [first, ...rest] = Object.values(values) as T[keyof T][];
  if (!first) {
    throw new Error("Expected at least one enum value");
  }
  return [first, ...rest];
};
