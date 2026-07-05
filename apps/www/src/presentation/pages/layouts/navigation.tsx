import { cookies } from "next/headers";
import type { PropsWithChildren } from "react";
import { PolicyUpdateAnnouncementBanner } from "@/features/announcement/components/policy-update-announcement-banner";
import {
  announcementDismissedCookie,
  POLICY_UPDATE_ANNOUNCEMENT_KEY,
} from "@/features/announcement/constants";
import { getServerT } from "@/presentation/hooks/t/server";
import { Footer } from "./footer";
import { Header } from "./header";
import { SidebarLayout } from "./sidebar-layout";

type NavigationProps = PropsWithChildren<{ lang: string }>;

/**
 * Navigation layout component that includes a header and footer.
 *
 * The announcement banner's visibility is decided here on the server from the
 * dismissal cookie: rendering it client-side only would insert the banner
 * after hydration and shift the whole page down (CLS).
 */
export async function NavigationLayout({ lang, children }: NavigationProps) {
  const { t } = await getServerT(lang);
  const cookieStore = await cookies();
  const policyUpdateDismissed =
    cookieStore.get(
      announcementDismissedCookie(POLICY_UPDATE_ANNOUNCEMENT_KEY),
    ) !== undefined;

  return (
    <SidebarLayout>
      {!policyUpdateDismissed && <PolicyUpdateAnnouncementBanner />}
      <Header t={t} lang={lang} />
      {children}
      <Footer t={t} lang={lang} />
    </SidebarLayout>
  );
}
