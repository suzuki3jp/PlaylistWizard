import type { Metadata } from "next";

import { HomeView } from "@/features/home/view";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang, "home");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
  };
}

export default HomeView;
