import { AboutSection } from "@/components/about-section";
import { YourPlaylists } from "@/components/your-playlists";
import type { PageProps } from "@/types";

export default async function Home(props: PageProps) {
    return (
        <>
            <YourPlaylists {...props} />
            <AboutSection {...props} />
        </>
    );
}
