/**
 * Marks a failure that retrying cannot resolve, such as a Provider rejecting a
 * request as invalid or forbidden. The Step processor records these as final
 * failures instead of handing them back to the Queue retry budget.
 * Infrastructure adapters throw it after classifying external errors; any other
 * error is treated as retryable.
 */
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}
