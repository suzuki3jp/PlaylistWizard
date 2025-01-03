import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "PlaylistWizard",
    description:
        "You can copy, shuffle, merge, manage, and delete Youtube (music) playlists",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
