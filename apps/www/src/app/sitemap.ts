import type { MetadataRoute } from "next";
import { urls } from "@/constants";
import { supportedLangs } from "@/features/localization/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrls = ["/", "/terms-and-privacy"];
  const localizedUrls = supportedLangs.flatMap((lang) =>
    siteUrls.map((url) => `/${lang}${url}`),
  );
  const fullUrls = localizedUrls.map((url) => `${urls.BASE_URL}${url}`);

  // We don't set changefreq or priority here, because Google will ignore them
  return fullUrls.map((url) => ({
    url,
    lastModified: new Date(),
  }));
}
