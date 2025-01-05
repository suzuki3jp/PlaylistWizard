import { AboutSection } from "@/components/about-section";
import type { PageProps } from "@/types";

export default async function Home(props: PageProps) {
    return <AboutSection {...props} />;
}
