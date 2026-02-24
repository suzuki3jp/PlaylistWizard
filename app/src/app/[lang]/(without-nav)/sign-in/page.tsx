import type { Metadata } from "next";

import { SignInPage } from "@/features/sign-in";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang, "sign-in");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
    },
  };
}

export default async function ({
  params,
  searchParams,
}: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  const { redirect_to } = await searchParams;

  if (Array.isArray(redirect_to)) return <p>Invalid redirect_to</p>;
  return <SignInPage lang={lang} redirectTo={redirect_to} />;
}
