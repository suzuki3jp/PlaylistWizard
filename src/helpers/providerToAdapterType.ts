export type AdapterType = "YouTubeAdapter" | "SpotifyAdapter";

export function providerToAdapterType(
    provider: "google" | "spotify",
): AdapterType {
    if (provider === "google") return "YouTubeAdapter";
    if (provider === "spotify") return "SpotifyAdapter";
    throw new Error(`Unknown provider: ${provider}`);
}
