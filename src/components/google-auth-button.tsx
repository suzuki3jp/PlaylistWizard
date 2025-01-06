"use client";
import { useT } from "@/hooks";
import { Google as GoogleIcon } from "@mui/icons-material";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import { Button } from "./ui/button";

export const GoogleAuthButton = () => {
    const { data } = useSession();
    const { t } = useT();

    return !data ? (
        <Button onClick={() => signIn("google")}>
            <GoogleIcon /> {t("header.google-auth.sign-in")}
        </Button>
    ) : (
        <Button onClick={() => signOut()}>
            {t("header.google-auth.sign-out")}
        </Button>
    );
};
