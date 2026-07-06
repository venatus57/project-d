import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
    const basePath = process.env.GITHUB_ACTIONS ? "/project-d" : "";

    return {
        name: "Project D Night Runners",
        short_name: "Project D",
        description: "Street Racing GPS Tracker & Telemetry Dashboard",
        start_url: `${basePath}/`,
        display: "standalone",
        background_color: "#0a0a0f",
        theme_color: "#c8f542",
        orientation: "portrait",
        icons: [
            {
                src: `${basePath}/icons/icon-192.png`,
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: `${basePath}/icons/icon-512.png`,
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: `${basePath}/icons/icon-512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
