import "client-only";
import { signOut } from "next-auth/react";

import { useLang } from "@/presentation/atoms";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";

export function signOutWithCallbackToPlaylists() {
  const [lang] = useLang();

  return signOut({
    callbackUrl: makeLocalizedUrl(lang, "/sign-in?redirect_to=/playlists"),
  });
}
