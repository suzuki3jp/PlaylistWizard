import "client-only";
import { signOut } from "next-auth/react";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { useLang } from "@/features/localization/atoms/lang";

export function signOutWithCallbackToPlaylists() {
  const [lang] = useLang();

  return signOut({
    callbackUrl: makeLocalizedUrl(lang, "/sign-in?redirect_to=/playlists"),
  });
}
