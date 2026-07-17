import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    // Stamped at build time — shown in the footer so stale PWA caches are obvious
    NEXT_PUBLIC_BUILD: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
};

export default withSerwist(nextConfig);
