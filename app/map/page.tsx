"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const loading = (
    <div className="map-screen grid place-items-center">
        <div className="kicker text-ice animate-pulse">Chargement de la carte…</div>
    </div>
);

const MapExplorerClient = dynamic(() => import("./MapExplorerClient"), {
    ssr: false,
    loading: () => loading,
});

export default function MapPage() {
    return (
        <Suspense fallback={loading}>
            <MapExplorerClient />
        </Suspense>
    );
}
