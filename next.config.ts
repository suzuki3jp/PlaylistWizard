import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        RELEASE: process.env.npm_package_version,
    },
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
        ],
    },
};

export default nextConfig;
