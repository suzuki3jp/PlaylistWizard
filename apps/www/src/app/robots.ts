import type { MetadataRoute } from "next";
import { urls } from "@/constants";

export default function (): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${urls.BASE_URL}/sitemap.xml`,
  };
}
