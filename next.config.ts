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
        ],
    },
};

export default nextConfig;
