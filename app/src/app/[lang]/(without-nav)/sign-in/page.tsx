import { SignInPage } from "@/features/sign-in";

export default async function ({
  params,
  searchParams,
}: PageProps<"/[lang]/sign-in">) {
  const { lang } = await params;
  const { redirect_to } = await searchParams;

  if (Array.isArray(redirect_to)) return <p>Invalid redirect_to</p>;
  return <SignInPage lang={lang} redirectTo={redirect_to} />;
}
