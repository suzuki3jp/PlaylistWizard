import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function ({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  return <NavigationLayout lang={lang}>{children}</NavigationLayout>;
}
