"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, MapPin, Calendar, TrendingDown, TrendingUp, Navigation, Mountain, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { UserRoute } from "../../lib/types";
import { loadRoutes, saveRoutes } from "../../lib/storage";
import { formatDate } from "../../lib/format";
import { BtnLink, DifficultyBadge } from "@/components/ui";

const RouteMapView = dynamic(() => import("./RouteMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full grid place-items-center">
            <div className="kicker text-ice animate-pulse">Chargement de la carte…</div>
        </div>
    ),
});

const typeIcons = {
    DOWNHILL: TrendingDown,
    UPHILL: TrendingUp,
    MIXED: Navigation,
};

interface ConquestDetailClientProps {
    id: string;
}

export default function ConquestDetailClient({ id }: ConquestDetailClientProps) {
    const router = useRouter();
    const [route, setRoute] = useState<UserRoute | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const found = loadRoutes().find((r) => r.id === id);
        if (found) setRoute(found);
        else setNotFound(true);
    }, [id]);

    const deleteRoute = () => {
        if (!route) return;
        saveRoutes(loadRoutes().filter((r) => r.id !== route.id));
        router.push("/conquest");
    };

    if (notFound) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="text-center">
                    <div className="kicker text-accent mb-4">Erreur 404</div>
                    <p className="font-display font-bold uppercase tracking-widest text-white text-xl mb-6">
                        Tracé introuvable
                    </p>
                    <BtnLink href="/conquest" variant="outline">
                        <ArrowLeft size={16} /> Retour
                    </BtnLink>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="kicker text-ice animate-pulse">Chargement…</div>
            </div>
        );
    }

    const TypeIcon = typeIcons[route.type];
    const displayPoints =
        route.routeGeometry && route.routeGeometry.length > 0 ? route.routeGeometry : route.points || [];

    return (
        <div className="map-screen">
            {/* Map */}
            <div className="absolute inset-0">
                <RouteMapView points={route.points || []} routeGeometry={displayPoints} />
            </div>

            {/* ===== HEADER HUD ===== */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-3 inset-x-3 z-[500]"
            >
                <div className="hud edge-accent p-4 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href="/conquest"
                                className="shrink-0 grid place-items-center w-9 h-9 rounded-lg border border-line text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                            >
                                <ArrowLeft size={17} />
                            </Link>
                            <div className="min-w-0">
                                <h1 className="title-xl text-xl md:text-2xl text-white truncate">{route.name}</h1>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1">
                                        <Mountain size={11} />
                                        {route.region}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={11} />
                                        {formatDate(route.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={deleteRoute}
                            className="shrink-0 grid place-items-center w-9 h-9 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-black transition-colors"
                            aria-label="Supprimer le tracé"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ===== STATS HUD ===== */}
            <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="absolute bottom-4 inset-x-3 md:inset-x-auto md:right-3 md:top-28 md:bottom-auto z-[500]"
            >
                <div className="hud p-4 md:w-64 flex md:flex-col items-center md:items-stretch gap-4 md:gap-4 justify-between">
                    {/* Distance */}
                    <div className="text-center md:rounded-xl md:bg-black/30 md:border md:border-line md:p-3">
                        <div className="mono-num text-3xl md:text-4xl font-bold text-gold">{route.distance.toFixed(2)}</div>
                        <div className="label mt-0.5">kilomètres</div>
                    </div>

                    <div className="hidden md:block border-t border-line" />

                    <div className="flex md:flex-col items-center md:items-stretch gap-4 md:gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="label hidden md:flex items-center gap-1.5">
                                <MapPin size={12} className="text-ice" /> Waypoints
                            </span>
                            <span className="mono-num text-white font-bold">
                                {route.points?.length || 0}
                                <span className="md:hidden label ml-1">pts</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="label hidden md:flex items-center gap-1.5">
                                <TypeIcon size={12} className="text-accent" /> Type
                            </span>
                            <span className="text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <TypeIcon size={12} className="text-accent md:hidden" />
                                {route.type}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="label hidden md:inline">Difficulté</span>
                            <DifficultyBadge level={route.difficulty} />
                        </div>
                    </div>

                    {/* Coordinates (desktop only) */}
                    {route.points && route.points.length > 0 && (
                        <div className="hidden md:block border-t border-line pt-3 space-y-2 text-[11px] mono-num">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_6px_rgba(61,220,132,0.7)]" />
                                <span className="text-zinc-400">
                                    {route.points[0][0].toFixed(4)}, {route.points[0][1].toFixed(4)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-gold shadow-[0_0_6px_rgba(255,194,51,0.7)]" />
                                <span className="text-zinc-400">
                                    {route.points[route.points.length - 1][0].toFixed(4)},{" "}
                                    {route.points[route.points.length - 1][1].toFixed(4)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
