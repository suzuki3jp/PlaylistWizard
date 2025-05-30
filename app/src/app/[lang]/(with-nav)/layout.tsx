import type { LayoutProps } from "@/@types";
import { Header } from "@/features/header/components/header";
import { useServerT } from "@/features/localization/hooks/server";
import { Footer } from "@/presentation/footer";

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
