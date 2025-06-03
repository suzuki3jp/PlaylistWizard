import { GoogleAnalytics } from "@next/third-parties/google";
import { dir } from "i18next";
import type { Metadata } from "next";
import "@/styles/globals.css";

import type { LayoutProps, SSRProps } from "@/@types";
import { getEnv } from "@/helpers/getEnv";
import { supportedLangs } from "@/localization/i18n";
import { useServerT } from "@/presentation/hooks/t/server";
import { Providers } from "@/presentation/providers";

export async function generateMetadata({
  params,
}: SSRProps): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: "https://playlistwizard.suzuki3.jp",
      siteName: "Playlist Wizard",
      images: {
        url: "/assets/ogp.png",
        type: "image/png",
      },
    },
  };
}

export const generateStaticParams = () => {
  return supportedLangs.map((lang) => ({ lang }));
};

export default async function RootLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  const gaId = getEnv(["GOOGLE_ANALYTICS_ID"]);
  if (gaId.isErr()) throw gaId.error;

  return (
    <html lang={lang} dir={dir(lang)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <GoogleAnalytics gaId={gaId.value[0]} />
      <body className="antialiased">
        <div className="flex min-h-screen flex-col bg-gray-950">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
