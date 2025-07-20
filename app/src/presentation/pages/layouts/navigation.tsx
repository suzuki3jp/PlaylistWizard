import type { PropsWithChildren } from "react";

import { Footer } from "@/presentation/footer";
import { Header } from "@/presentation/header";
import { useServerT } from "@/presentation/hooks/t/server";

type NavigationProps = PropsWithChildren<{ lang: string }>;

/**
 * Navigation layout component that includes a header and footer.
 * @param param0
 * @returns
 */
export async function NavigationLayout({ lang, children }: NavigationProps) {
  const { t } = await useServerT(lang);

  return (
    <>
      <Header t={t} lang={lang} />
      {children}
      <Footer t={t} lang={lang} />
    </>
  );
}
