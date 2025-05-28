"use client";
import {
  SiGoogle as Google,
  SiSpotify as Spotify,
} from "@icons-pack/react-simple-icons";
import { DialogTitle } from "@radix-ui/react-dialog";
import type { WithT } from "i18next";
import { signIn, signOut } from "next-auth/react";
import { type ReactNode, useState } from "react";
import { Trans } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/features/localization/hooks/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "./link";

export interface AuthButtonProps {
  lang: string;
  text?: ReactNode;
}

export function AuthButton({ lang, text }: AuthButtonProps) {
  const { t } = useT(lang);
  const auth = useAuth();

  const [providerSelectDialogOpen, setProviderSelectDialogOpen] =
    useState(false);

  return auth ? (
    <Button
      className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {t("header.sign-out")}
    </Button>
  ) : (
    <Dialog
      open={providerSelectDialogOpen}
      onOpenChange={setProviderSelectDialogOpen}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700">
          {text || t("header.sign-in")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("header.which-provider")}</DialogTitle>
        </DialogHeader>
        <AuthProviderButton provider="google" t={t} />
        <AuthProviderButton provider="spotify" t={t} />
      </DialogContent>
    </Dialog>
  );
}

type AuthProviderButtonProps = WithT & { provider: "google" | "spotify" };

function AuthProviderButton({ t, provider }: AuthProviderButtonProps) {
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  return (
    <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 text-white hover:bg-pink-700">
          {provider === "google" ? <Google /> : <Spotify />}
          {provider === "google"
            ? t("header.sign-in-with-google")
            : t("header.sign-in-with-spotify")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("header.terms-agreement.title")}</DialogTitle>
          <DialogDescription className="text-gray-400">
            <Trans
              i18nKey="header.terms-agreement.content"
              components={{
                1: (
                  <Link
                    href="/terms"
                    underline
                    onClick={() => setTermsDialogOpen(false)}
                  />
                ),
                2: (
                  <Link
                    href={"/privacy"}
                    underline
                    onClick={() => setTermsDialogOpen(false)}
                  />
                ),
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="bg-pink-600 text-white hover:bg-pink-700"
            >
              {t("header.terms-agreement.no")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => signIn(provider, { callbackUrl: "/playlists" })}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("header.terms-agreement.yes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
