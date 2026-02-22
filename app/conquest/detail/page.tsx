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
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>}>
            <ConquestDetailContent />
        </Suspense>
    );
}
