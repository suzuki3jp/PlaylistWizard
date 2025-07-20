import type { LayoutProps } from "@/@types";
import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function ({ children, params }: LayoutProps) {
  const { lang } = await params;

  return <NavigationLayout lang={lang}>{children}</NavigationLayout>;
}
