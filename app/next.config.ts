import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: "i.ytimg.com",
            },
            {
                hostname: "mosaic.scdn.co",
            },
            { hostname: "image-cdn-ak.spotifycdn.com" },
            { hostname: "i.scdn.co" },
            { hostname: "dummyimage.com" },
            { hostname: "image-cdn-fa.spotifycdn.com" },
        ],
    },
};

export default nextConfig;
