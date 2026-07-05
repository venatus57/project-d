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
        background_color: "#07070c",
        theme_color: "#ff3b57",
        orientation: "portrait",
        icons: [
            {
                src: `${basePath}/icon?size=192x192`,
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: `${basePath}/icon?size=512x512`,
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
