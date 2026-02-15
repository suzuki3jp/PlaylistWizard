import type { WithT } from "i18next";
import { UserMenu } from "@/features/user-menu/components/user-menu";
import { GetStartedButton } from "./get-started-button";
import { HeaderNavSection } from "./header-nav-section";

export type HeaderProps = WithT & { lang: string };

export async function Header(_props: HeaderProps) {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 border-gray-800 border-b bg-gray-950">
      <header className="flex h-16 items-center gap-4 px-4 md:px-6">
        <HeaderNavSection />

        <div className="flex flex-1 items-center justify-end gap-4">
          <GetStartedButton />
          <UserMenu />
        </div>
      </header>
    </div>
  );
}
