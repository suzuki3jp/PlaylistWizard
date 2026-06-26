export function unreachable(value: never, message?: string): never {
  throw new Error(message ?? `Unreachable code reached with value: ${value}`);
}
