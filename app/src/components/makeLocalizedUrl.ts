export function makeLocalizedUrl(lang: string, path: string): string {
  if (path === "/") {
    return `/${lang}`;
  }

  if (!path.startsWith("/")) {
    return `/${lang}/${path}`;
  }

  return `/${lang}${path}`;
}
