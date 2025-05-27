export function makeLocalizedUrl(lang: string, path: string): string {
  if (!path.startsWith("/")) {
    // biome-ignore lint/style/noParameterAssign: <explanation>
    path = `/${path}`;
  }

  return `/${lang}${path}`;
}
