import { getEnv } from "@playlistwizard/env";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "@/app/global.css";
import { urls } from "@/constants";
import { supportedLangs } from "@/features/localization/i18n";
import { getAppIcon } from "@/lib/app-icon";
import { evaluateAllFeatureFlags } from "@/lib/feature-flag-evaluator";
import type { FeatureFlagName } from "@/lib/feature-flags";
import { getServerT } from "@/presentation/hooks/t/server";
import { RootLayout } from "@/presentation/pages/layouts/root";
import { FeatureFlagProvider } from "@/presentation/providers/FeatureFlagProvider";
import { getSession } from "@/repository/auth/session";
import { featureFlagDbRepository } from "@/repository/db/feature-flag/repository";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getServerT(lang);
  const icon = getAppIcon();

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    icons: {
      icon: icon.src,
      apple: icon.src,
    },
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      url: urls.BASE_URL,
      siteName: "PlaylistWizard",
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

  const userId = (await getSession())?.user.id;
  const dbEnabledFlags = userId
    ? new Set(await featureFlagDbRepository.findEnabledFlagsByUserId(userId))
    : new Set<FeatureFlagName>();
  const flags = evaluateAllFeatureFlags(userId, dbEnabledFlags);

  return (
    <FeatureFlagProvider flags={flags}>
      <RootLayout gaId={gaId.value[0]} lang={lang}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </RootLayout>
    </FeatureFlagProvider>
  );
}
