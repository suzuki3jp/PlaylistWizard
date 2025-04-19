"use client";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/shadcn-ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { useT } from "@/hooks";
import { AuthProviderButtonNoSSR } from "./auth-provider-button";

export function AuthButton() {
    const { t } = useT();
    const [isOpen, setIsOpen] = useState(false);
    const { data } = useSession();

    return !data ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>{t("header.sign-in")}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("header.which-provider")}</DialogTitle>
                </DialogHeader>
                <AuthProviderButtonNoSSR provider="google" />
                <AuthProviderButtonNoSSR provider="spotify" />
            </DialogContent>
        </Dialog>
    ) : (
        <Button onClick={() => signOut()}>{t("header.sign-out")}</Button>
    );
}
