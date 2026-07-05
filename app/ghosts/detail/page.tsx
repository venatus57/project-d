"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GhostDetailClient from "./GhostDetailClient";

function GhostDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || "";
    return <GhostDetailClient id={id} />;
}

export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="map-screen grid place-items-center">
                    <div className="kicker text-ice animate-pulse">Chargement…</div>
                </div>
            }
        >
            <GhostDetailContent />
        </Suspense>
    );
}
