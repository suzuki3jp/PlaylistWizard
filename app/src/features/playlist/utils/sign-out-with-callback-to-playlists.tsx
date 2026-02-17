import "client-only";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { useLang } from "@/features/localization/atoms/lang";
import { signOut } from "@/lib/auth-client";

export function signOutWithCallbackToPlaylists() {
  const [lang] = useLang();

  return signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = makeLocalizedUrl(
          lang,
          "/sign-in?redirect_to=/playlists",
        );
      },
    },
  });
}
