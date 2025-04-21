"use client";
import {
    SiSpotify as SpotifyIcon,
    SiYoutubemusic as YouTubeMusicIcon,
} from "@icons-pack/react-simple-icons";
import { useSession } from "next-auth/react";

import { Link } from "@/components/ui/link";

export function ServiceLink({ url }: ServiceLinkProps) {
    const { data } = useSession();
    const { provider } = data || {};

    return (
        <Link href={url} isOpenInNewTab>
            {provider === "spotify" ? <SpotifyIcon /> : <YouTubeMusicIcon />}
        </Link>
    );
}

interface ServiceLinkProps {
    url: string;
}
