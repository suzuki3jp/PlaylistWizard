import type { SSRProps } from "@/@types";
import { SignInPage } from "@/presentation/pages/sign-in";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;
  return <SignInPage lang={lang} />;
}
