import type { PropsWithChildren } from "react";
import { DomainMigrationAnnouncementBanner } from "@/features/announcement/components/domain-migration-announcement-banner";
import { useServerT } from "@/presentation/hooks/t/server";
import { Footer } from "./footer";
import { Header } from "./header";
import { SidebarLayout } from "./sidebar-layout";

type NavigationProps = PropsWithChildren<{ lang: string }>;

/**
 * Navigation layout component that includes a header and footer.
 * @param param0
 * @returns
 */
export async function NavigationLayout({ lang, children }: NavigationProps) {
  const { t } = await useServerT(lang);

  return (
    <SidebarLayout>
      <DomainMigrationAnnouncementBanner />
      <Header t={t} lang={lang} />
      {children}
      <Footer t={t} lang={lang} />
    </SidebarLayout>
  );
}
