import type { Metadata } from "next";
import { DevConsoleView } from "@/features/dev-console/view";
import { requireDeveloperPageUser } from "@/lib/developer";

export const metadata: Metadata = {
  title: "Dev Console - PlaylistWizard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const user = await requireDeveloperPageUser(lang);

  return <DevConsoleView user={user} />;
}
