import { Shield } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import { useServerT } from "@/presentation/hooks/t/server";
import { PlaylistWizardLogo } from "../common/playlistwizard-log";
import { Agreement } from "./agreement";
import { GoogleSignInButton } from "./google-sign-in-button";
import { SpotifySignInButton } from "./spotify-sign-in-button";

interface SignInProps {
  lang: string;
}

export async function SignIn({ lang }: SignInProps) {
  const { t } = await useServerT(lang, "sign-in");
  const session = await getServerSession();
  if (session) {
    // If the user is already signed in, redirect to /playlists
    return redirect(makeLocalizedUrl(lang, "/playlists"));
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <PlaylistWizardLogo size={64} />
            </div>
            <h1 className="mb-2 font-bold text-2xl text-white">
              {t("sign-in-playlistwizard")}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("start-managing-playlists")}
            </p>
          </div>

          {/* Login Buttons */}
          <div className="mb-6 space-y-4">
            <GoogleSignInButton lang={lang} />
            <SpotifySignInButton lang={lang} />
          </div>

          {/* Security Notice */}
          <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/20">
                <Shield className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="mb-1 font-medium text-sm text-white">
                  {t("safety-sign-in.title")}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {t("safety-sign-in.description")}
                </p>
              </div>
            </div>
          </div>

          <Agreement lang={lang} t={t} />
        </div>
      </div>
    </main>
  );
}
