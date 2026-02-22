import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RELEASE: process.env.npm_package_version,
  },
  images: {
    remotePatterns: [
      { hostname: "i.ytimg.com" },
      { hostname: "dummyimage.com" },
      { hostname: "example.com" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  transpilePackages: ["@playlistwizard/logger"],
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    browserDebugInfoInTerminal: true,
  },
};

export default nextConfig;
