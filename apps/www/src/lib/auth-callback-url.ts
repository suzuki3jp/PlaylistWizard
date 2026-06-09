export const makeAuthCallbackUrl = (path: string): string =>
  new URL(path, window.location.origin).toString();
