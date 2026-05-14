export function makeLocalizedUrl(lang: string, path: string): string {
  if (path === "/") {
    return `/${lang}`;
  }

  if (
    path === `/${lang}` ||
    path.startsWith(`/${lang}/`) ||
    path.startsWith(`/${lang}?`)
  ) {
    return path;
  }

  if (!path.startsWith("/")) {
    return `/${lang}/${path}`;
  }

  return `/${lang}${path}`;
}
