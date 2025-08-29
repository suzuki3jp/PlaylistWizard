import { getEnv } from "@playlistwizard/env";
import type { Metadata } from "next";

import "@/presentation/global.css";
import type { LayoutProps, SSRProps } from "@/lib/types/next";
import { supportedLangs } from "@/features/localization/i18n";
import { useServerT } from "@/presentation/hooks/t/server";
import { RootLayout } from "@/presentation/pages/layouts/root";

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

export default async function ({ children, params }: LayoutProps) {
  const { lang } = await params;
  const gaId = getEnv(["GOOGLE_ANALYTICS_ID"]);
  if (gaId.isErr()) throw gaId.error;

  return (
    <RootLayout gaId={gaId.value[0]} lang={lang}>
      {children}
    </RootLayout>
  );
}
