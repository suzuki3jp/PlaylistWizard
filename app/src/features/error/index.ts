export class UnauthorizedError extends Error {
  constructor(
    message: string,
    public redirectTo: string,
  ) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
