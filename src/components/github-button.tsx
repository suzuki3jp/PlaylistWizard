"use client";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import { SOURCE_CODE_GITHUB } from "@/constants";
import { useT } from "@/hooks";
import { GitHub as GitHubIcon } from "@mui/icons-material";

export const GithubButton = () => {
    const { t } = useT();

    return (
        <Link href={SOURCE_CODE_GITHUB} isOpenInNewTab>
            <Button
                variant="ghost"
                size="icon"
                title={t("header.github-link-tooltip")}
            >
                <GitHubIcon />
            </Button>
        </Link>
    );
};
