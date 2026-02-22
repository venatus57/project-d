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
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>}>
            <GhostDetailContent />
        </Suspense>
    );
}
