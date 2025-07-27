import type { SSRProps } from "@/lib/types/next";
import { HomePage } from "@/presentation/pages/home";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <HomePage lang={lang} />;
}
