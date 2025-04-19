export function providerToAdapterType(
    provider: "google" | "spotify",
): "YouTubeAdapter" | "SpotifyAdapter" {
    switch (provider) {
        case "google":
            return "YouTubeAdapter";
        case "spotify":
            return "SpotifyAdapter";
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
