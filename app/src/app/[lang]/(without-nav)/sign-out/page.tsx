import { SignOut } from "./_sign-out";

export default async function ({
  searchParams,
  params,
}: PageProps<"/[lang]/sign-out">) {
  const { lang } = await params;
  const { redirect_to } = await searchParams;

  return <SignOut lang={lang} redirect_to={redirect_to} />;
}
