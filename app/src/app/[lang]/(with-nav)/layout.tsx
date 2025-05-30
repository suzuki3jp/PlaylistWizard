import type { LayoutProps } from "@/@types";
import { useServerT } from "@/features/localization/hooks/server";
import { Footer } from "@/presentation/footer";
import { Header } from "@/presentation/header";

export default async function NavigationLayout({
  children,
  params,
}: LayoutProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return (
    <>
      <Header t={t} lang={lang} />
      {children}
      <Footer t={t} lang={lang} />
    </>
  );
}
