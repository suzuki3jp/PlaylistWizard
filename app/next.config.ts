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
      { hostname: "dummyimage.com" },
      { hostname: "image-cdn-fa.spotifycdn.com" },
      { hostname: "example.com" },
    ],
  },
  transpilePackages: ["@playlistwizard/logger"],
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    browserDebugInfoInTerminal: true,
  },
};

export default nextConfig;
