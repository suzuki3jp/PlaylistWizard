import { getEnv } from "@playlistwizard/env";
import type { Metadata } from "next";

import "@/presentation/global.css";
import { urls } from "@/constants";
import { supportedLangs } from "@/features/localization/i18n";
import { useServerT } from "@/presentation/hooks/t/server";
import { RootLayout } from "@/presentation/pages/layouts/root";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: urls.BASE_URL,
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

export default async function ({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const gaId = getEnv(["GOOGLE_ANALYTICS_ID"]);
  if (gaId.isErr()) throw gaId.error;

  return (
    <RootLayout gaId={gaId.value[0]} lang={lang}>
      {children}
    </RootLayout>
  );
}
