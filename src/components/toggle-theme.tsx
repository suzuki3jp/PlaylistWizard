"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/hooks";
/**
 * The toggle theme component.
 * It is used in the header to toggle the theme.
 */
export const ToggleTheme = () => {
    const { t } = useT();
    const { theme, setTheme } = useTheme();
    const newTheme = theme === "dark" ? "light" : "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            title={t("header.toggle-theme-tooltip", { theme: newTheme })}
            onClick={() => setTheme(newTheme)}
        >
            {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
    );
};
