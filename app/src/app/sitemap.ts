import type { MetadataRoute } from "next";

import { supportedLangs } from "@/localization/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE_URL = "https://playlistwizard.suzuki3.jp";

  const urls = ["/", "/terms-and-privacy"];
  const localizedUrls = supportedLangs.flatMap((lang) =>
    urls.map((url) => `/${lang}${url}`),
  );
  const fullUrls = localizedUrls.map((url) => `${BASE_URL}${url}`);

  // We don't set changefreq or priority here, because Google will ignore them
  return fullUrls.map((url) => ({
    url,
    lastModified: new Date(),
  }));
}
