"use client";
import { SiSpotify as SpotifyIcon } from "@icons-pack/react-simple-icons";
import { Google as GoogleIcon } from "@mui/icons-material";
import { signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Trans } from "react-i18next";

import { Button } from "@/components/shadcn-ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { Link } from "@/components/ui/link";
import { useT } from "@/hooks";

const AuthProviderButton = ({ provider }: AuthProviderButtonProps) => {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    {provider === "google" ? (
                        <>
                            <GoogleIcon /> {t("header.google-sign-in")}
                        </>
                    ) : (
                        <>
                            <SpotifyIcon />
                            {t("header.spotify-sign-in")}
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t("header.terms-agreement.title")}
                    </DialogTitle>
                    <DialogDescription>
                        <Trans
                            i18nKey="header.terms-agreement.content"
                            components={{
                                1: (
                                    <Link
                                        href="/terms-and-privacy"
                                        underline
                                        onClick={() => setIsOpen(false)}
                                    />
                                ),
                            }}
                        />
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t("header.terms-agreement.no")}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={() => signIn(provider)}>
                        {t("header.terms-agreement.yes")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const AuthProviderButtonNoSSR = dynamic(
    () => Promise.resolve(AuthProviderButton),
    {
        ssr: false,
    },
);

interface AuthProviderButtonProps {
    provider: "google" | "spotify";
}
