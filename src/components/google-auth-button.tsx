"use client";
import { Google as GoogleIcon } from "@mui/icons-material";
import { signIn, signOut, useSession } from "next-auth/react";
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

const GoogleAuthButton = () => {
    const { data } = useSession();
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);

    return !data ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <GoogleIcon /> {t("header.google-auth.sign-in")}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t("header.google-auth.agreement.title")}
                    </DialogTitle>
                    <DialogDescription>
                        <Trans
                            i18nKey="header.google-auth.agreement.content"
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
                            {t("header.google-auth.agreement.no")}
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={() => signIn("google")}>
                        {t("header.google-auth.agreement.yes")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ) : (
        <Button onClick={() => signOut()}>
            {t("header.google-auth.sign-out")}
        </Button>
    );
};

export const GoogleAuthButtonNoSSR = dynamic(
    () => Promise.resolve(GoogleAuthButton),
    {
        ssr: false,
    },
);
