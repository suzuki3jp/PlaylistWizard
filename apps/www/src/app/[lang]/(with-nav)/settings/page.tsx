import type { Metadata } from "next";

import { SettingsView } from "@/features/settings/view";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/settings">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang, "settings");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ({ params }: PageProps<"/[lang]/settings">) {
  const { lang } = await params;
  return <SettingsView lang={lang} />;
}
