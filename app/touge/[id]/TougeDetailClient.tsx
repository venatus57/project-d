"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Mountain, Route as RouteIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { TougeCircuit } from "../types";
import { allCircuits } from "../data";
import { loadRoutes } from "../../lib/storage";
import { formatDate } from "../../lib/format";
import { BtnLink, DifficultyBadge } from "@/components/ui";

const TougeMapView = dynamic(() => import("./TougeMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full grid place-items-center">
            <div className="kicker text-ice animate-pulse">Chargement de la carte…</div>
        </div>
    ),
});

interface TougeDetailClientProps {
    id: string;
}

export default function TougeDetailClient({ id }: TougeDetailClientProps) {
    const [circuit, setCircuit] = useState<TougeCircuit | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let found = allCircuits.find((c) => c.id === id);

        if (!found) {
            // User-created routes are exposed under the "user-" prefix
            const userRoute = loadRoutes().find((r) => `user-${r.id}` === id);
            if (userRoute) {
                found = {
                    id: `user-${userRoute.id}`,
                    name: userRoute.name.toUpperCase(),
                    location: userRoute.region || "Personnalisé",
                    country: "Mes Créations",
                    length: `${userRoute.distance.toFixed(1)} km`,
                    lengthKm: userRoute.distance,
                    difficulty: userRoute.difficulty,
                    description: `Tracé créé le ${formatDate(userRoute.createdAt)} — type ${userRoute.type}.`,
                    routePoints:
                        userRoute.routeGeometry && userRoute.routeGeometry.length > 0
                            ? userRoute.routeGeometry
                            : userRoute.points || [],
                };
            }
        }

        if (found && found.routePoints.length > 0) setCircuit(found);
        else setNotFound(true);
    }, [id]);

    if (notFound) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="text-center">
                    <div className="kicker text-accent mb-4">Erreur 404</div>
                    <p className="font-display font-bold uppercase tracking-widest text-white text-xl mb-6">
                        Circuit introuvable
                    </p>
                    <BtnLink href="/touge" variant="outline">
                        <ArrowLeft size={16} /> Retour aux touges
                    </BtnLink>
                </div>
            </div>
        );
    }

    if (!circuit) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="kicker text-ice animate-pulse">Chargement…</div>
            </div>
        );
    }

    return (
        <div className="map-screen">
            {/* Map */}
            <div className="absolute inset-0">
                <TougeMapView routePoints={circuit.routePoints} />
            </div>

            {/* ===== HEADER HUD ===== */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-3 inset-x-3 z-[500]"
            >
                <div className="hud edge-accent p-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/touge"
                            className="shrink-0 grid place-items-center w-9 h-9 rounded-lg border border-line text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                        >
                            <ArrowLeft size={17} />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="title-xl text-xl md:text-2xl text-white truncate">{circuit.name}</h1>
                                <DifficultyBadge level={circuit.difficulty} />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                                <MapPin size={11} />
                                {circuit.location}
                                <span className="text-zinc-700">·</span>
                                {circuit.country}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ===== STATS HUD ===== */}
            <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="absolute bottom-4 inset-x-3 md:inset-x-auto md:right-3 md:top-24 md:bottom-auto z-[500]"
            >
                <div className="hud p-4 md:w-72 space-y-4">
                    {/* Distance */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 md:text-center">
                        <div>
                            <span className="mono-num text-3xl md:text-5xl font-bold text-gold">{circuit.lengthKm}</span>
                            <span className="label ml-2 md:ml-0 md:block md:mt-1">kilomètres</span>
                        </div>
                        {circuit.record && (
                            <div className="md:hidden text-right">
                                <span className="mono-num text-xl font-bold text-mint">{circuit.record}</span>
                                <span className="label block">record</span>
                            </div>
                        )}
                    </div>

                    <p className="hidden md:block text-zinc-400 text-sm leading-relaxed border-t border-line pt-3">
                        {circuit.description}
                    </p>

                    <div className="hidden md:grid grid-cols-2 gap-2.5 border-t border-line pt-3">
                        <div className="rounded-xl bg-black/30 border border-line p-3">
                            <div className="label flex items-center gap-1">
                                <RouteIcon size={10} /> Points
                            </div>
                            <div className="mono-num text-white font-bold mt-0.5">{circuit.routePoints.length}</div>
                        </div>
                        <div className="rounded-xl bg-black/30 border border-line p-3">
                            <div className="label flex items-center gap-1">
                                <Mountain size={10} /> Pays
                            </div>
                            <div className="text-white font-bold mt-0.5 truncate">{circuit.country}</div>
                        </div>
                        {circuit.record && (
                            <div className="rounded-xl bg-black/30 border border-line p-3 col-span-2">
                                <div className="label flex items-center gap-1">
                                    <Clock size={10} /> Record
                                </div>
                                <div className="mono-num text-mint font-bold text-lg mt-0.5">{circuit.record}</div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 border-t border-line pt-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-mint" /> Départ
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gold" /> Arrivée
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-5 h-1 rounded-full bg-accent" /> Tracé
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
