import { AboutSection } from "@/components/about-section";
import { PlaylistBrowser } from "@/components/playlist-browser";
import { YourPlaylists } from "@/components/your-playlists";
import type { PageProps } from "@/types";

export default async function Home(props: PageProps) {
    const params = await props.searchParams;

    return (
        <>
            {params.id ? (
                <PlaylistBrowser {...props} />
            ) : (
                <YourPlaylists {...props} />
            )}
            <AboutSection {...props} />
        </>
    );
}
