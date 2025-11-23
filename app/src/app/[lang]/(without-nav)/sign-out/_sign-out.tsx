"use client";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

interface SignOutProps {
  lang: string;
  redirect_to?: string | string[];
}

export function SignOut({ lang, redirect_to }: SignOutProps) {
  useEffect(() => {
    signOut({
      callbackUrl: redirect_to
        ? `/${lang}/sign-in?redirect_to=${redirect_to}`
        : `/${lang}/sign-in`,
    });
  }, [lang, redirect_to]);

  return null; // render nothing while signing out
}
