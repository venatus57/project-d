"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MapPin, Ruler, Trash2, Calendar, Route } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRoute } from "../lib/types";
import { loadRoutes, saveRoutes } from "../lib/storage";
import { formatDate } from "../lib/format";
import {
    PageShell, PageHeader, BtnLink, EmptyState, DifficultyBadge, DIFFICULTY_STYLE,
    fadeUp, stagger,
} from "@/components/ui";

// Normalized mini-preview of the actual route shape
function RoutePreview({ route }: { route: UserRoute }) {
    const pts = route.routeGeometry && route.routeGeometry.length > 1 ? route.routeGeometry : route.points;
    if (!pts || pts.length < 2) return null;

    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 1e-6;
    const spanLng = maxLng - minLng || 1e-6;

    const W = 280, H = 110, PAD = 14;
    const path = pts
        .map((p, i) => {
            const x = PAD + ((p[1] - minLng) / spanLng) * (W - 2 * PAD);
            const y = PAD + ((maxLat - p[0]) / spanLat) * (H - 2 * PAD);
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    const color = DIFFICULTY_STYLE[route.difficulty]?.hex || "#d84fc4";

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <path d={path} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function ConquestPage() {
    const [routes, setRoutes] = useState<UserRoute[]>([]);

    useEffect(() => {
        setRoutes(loadRoutes());
    }, []);

    const deleteRoute = (id: string) => {
        const updated = routes.filter((r) => r.id !== id);
        setRoutes(updated);
        saveRoutes(updated);
    };

    return (
        <PageShell>
            <PageHeader
                kicker="Territory builder"
                title="Conquest"
                sub="Tes circuits personnalisés — tracés à la main, au GPS ou importés."
                actions={
                    <BtnLink href="/conquest/builder">
                        <Plus size={17} /> Nouveau tracé
                    </BtnLink>
                }
            />

            {routes.length === 0 ? (
                <EmptyState
                    icon={Route}
                    title="Aucun tracé enregistré"
                    text="Utilise le Route Builder pour dessiner ton premier circuit sur la carte."
                    action={
                        <BtnLink href="/conquest/builder">
                            <Plus size={17} /> Ouvrir le builder
                        </BtnLink>
                    }
                />
            ) : (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <AnimatePresence>
                        {routes.map((route) => (
                            <motion.div
                                key={route.id}
                                layout
                                variants={fadeUp}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                whileHover={{ y: -4 }}
                                className="glass glass-hover overflow-hidden group"
                            >
                                {/* Route shape preview */}
                                <Link href={`/conquest/detail?id=${route.id}`} className="block relative h-32 bg-black/30 border-b border-line">
                                    <RoutePreview route={route} />
                                    <div className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/40 transition-colors">
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity font-display font-bold uppercase tracking-widest text-xs text-white">
                                            Voir le tracé →
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <DifficultyBadge level={route.difficulty} />
                                    </div>
                                </Link>

                                <div className="p-4">
                                    <Link href={`/conquest/detail?id=${route.id}`}>
                                        <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide truncate hover:text-accent transition-colors">
                                            {route.name}
                                        </h3>
                                    </Link>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <Ruler size={11} className="text-ice" />
                                            {route.distance.toFixed(2)} km
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={11} className="text-accent" />
                                            {route.points?.length || 0} pts
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={11} className="text-gold" />
                                            {formatDate(route.createdAt)}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <BtnLink
                                            href={`/conquest/detail?id=${route.id}`}
                                            variant="ghost"
                                            className="flex-1 py-2.5! text-xs!"
                                        >
                                            Voir
                                        </BtnLink>
                                        <button
                                            onClick={() => deleteRoute(route.id)}
                                            className="grid place-items-center px-4 rounded-xl border border-line text-zinc-600 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </PageShell>
    );
}
