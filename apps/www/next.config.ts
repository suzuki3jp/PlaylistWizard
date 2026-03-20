import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RELEASE: process.env.npm_package_version,
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
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

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
});
