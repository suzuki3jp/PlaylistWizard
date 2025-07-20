import type { SSRProps } from "@/@types";
import { HomePage } from "@/presentation/pages/home";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <HomePage lang={lang} />;
}
