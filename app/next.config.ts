import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  env: {
    RELEASE: process.env.npm_package_version,
  },
  images: {
    remotePatterns: [
      { hostname: "i.ytimg.com" },
      { hostname: "mosaic.scdn.co" },
      { hostname: "image-cdn-ak.spotifycdn.com" },
      { hostname: "i.scdn.co" },
      { hostname: "dummyimage.com" },
      { hostname: "image-cdn-fa.spotifycdn.com" },
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

const withMDX = createMDX({});
export default withMDX(nextConfig);
