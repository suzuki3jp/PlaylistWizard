import { redirect } from "next/navigation";
import { urls } from "@/constants";
import { getLinkedAccounts } from "@/features/accounts/actions/get-linked-accounts";
import { getSessionUser } from "@/lib/user";
import { useServerT } from "@/presentation/hooks/t/server";
import { DangerZoneCard } from "./components/danger-zone-card";
import { LinkedAccountsCard } from "./components/linked-accounts-card";

interface SettingsViewProps {
  lang: string;
}

export async function SettingsView({ lang }: SettingsViewProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect(urls.signIn(lang, urls.settings(lang)));
  }

  const [{ t }, providerProfiles] = await Promise.all([
    useServerT(lang, "settings"),
    getLinkedAccounts(),
  ]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl text-white">{t("title")}</h1>
          <p className="text-gray-400">{t("description")}</p>
        </div>
        <LinkedAccountsCard providers={providerProfiles} lang={lang} />
        <DangerZoneCard lang={lang} />
      </div>
    </main>
  );
}
