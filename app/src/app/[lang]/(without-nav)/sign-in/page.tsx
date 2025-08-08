import type { SSRProps } from "@/lib/types/next";
import { SignInPage } from "@/presentation/pages/sign-in";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;
  return <SignInPage lang={lang} />;
}
