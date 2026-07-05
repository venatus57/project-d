"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ConquestDetailClient from "./ConquestDetailClient";

function ConquestDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || "";
    return <ConquestDetailClient id={id} />;
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
            <ConquestDetailContent />
        </Suspense>
    );
}
