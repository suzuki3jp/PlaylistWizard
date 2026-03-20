export function isExternalLink(href: string, currentOrigin: string): boolean {
  if (!href.startsWith("http")) return false; // Relative URL, not external

  try {
    const url = new URL(href);
    return url.origin !== currentOrigin;
  } catch {
    return false;
  }
}
