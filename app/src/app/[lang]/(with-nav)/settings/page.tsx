import { SettingsView } from "@/features/settings/view";

export default async function ({ params }: PageProps<"/[lang]/settings">) {
  const { lang } = await params;
  return <SettingsView lang={lang} />;
}
