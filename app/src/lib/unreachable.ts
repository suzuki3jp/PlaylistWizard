export function unreachable(x: never): never {
  throw new Error(`Reached unreachable code with value: ${x}`);
}
