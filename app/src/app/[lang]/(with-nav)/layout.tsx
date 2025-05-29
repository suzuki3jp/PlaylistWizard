import type { LayoutProps } from "@/@types";
import { Footer } from "@/features/footer/components/footer";
import { Header } from "@/features/header/components/header";
import { useServerT } from "@/features/localization/hooks/server";

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
