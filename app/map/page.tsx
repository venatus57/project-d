"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const MapExplorerClient = dynamic(() => import("./MapExplorerClient"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen bg-black flex items-center justify-center font-pixel">
            <div className="text-zinc-500 font-bold animate-pulse tracking-widest uppercase">
                LOADING OVERRIDE MAP...
            </div>
        </div>
    )
});

export default function MapPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-screen bg-black flex items-center justify-center font-pixel">
                <div className="text-zinc-500 font-bold tracking-widest uppercase">INITIALIZING SYSTEM...</div>
            </div>
        }>
            <MapExplorerClient />
        </Suspense>
    );
}
