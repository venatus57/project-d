import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// GitHub Pages serves the site under /project-d — we own the basePath here
// (the workflow's configure-pages injection is disabled: it used to shadow
// this whole file with a generated next.config.js).
const isGitHubPages = !!process.env.GITHUB_ACTIONS;

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/project-d' : '',
  images: {
    unoptimized: true,
  },
  env: {
    // Stamped at build time — shown in the footer so stale PWA caches are obvious
    NEXT_PUBLIC_BUILD: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
};

export default withSerwist(nextConfig);
