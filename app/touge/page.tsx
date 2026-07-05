"use client";

import { useState, useEffect, useMemo } from "react";
import { MapPin, Clock, ChevronRight, Route, Eye, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { allCircuits } from "./data";
import type { TougeCircuit } from "./types";
import { loadRoutes } from "../lib/storage";
import { formatDate } from "../lib/format";
import {
    PageShell, PageHeader, BtnLink, DifficultyBadge, EmptyState, fadeUp, stagger,
} from "@/components/ui";

export default function TougePage() {
    const [circuits, setCircuits] = useState<TougeCircuit[]>(allCircuits);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState<string>("ALL");

    // Merge default circuits with user-created routes
    useEffect(() => {
        const userRoutes = loadRoutes();
        if (userRoutes.length === 0) return;

        const converted: TougeCircuit[] = userRoutes.map((route) => ({
            id: `user-${route.id}`,
            name: route.name.toUpperCase(),
            location: route.region || "Personnalisé",
            country: "Mes Créations",
            length: `${route.distance.toFixed(1)} km`,
            lengthKm: route.distance,
            difficulty: route.difficulty,
            description: `Tracé créé le ${formatDate(route.createdAt)} — type ${route.type}.`,
            routePoints:
                route.routeGeometry && route.routeGeometry.length > 0 ? route.routeGeometry : route.points || [],
        }));
        setCircuits([...allCircuits, ...converted]);
    }, []);

    const availableRegions = useMemo(() => [...new Set(circuits.map((c) => c.location))], [circuits]);
    const filteredCircuits = circuits.filter((c) => regionFilter === "ALL" || c.location === regionFilter);

    return (
        <PageShell>
            <PageHeader
                kicker="Mountain pass database"
                title="Touge"
                sub="Cols légendaires du Japon, de France — et tes propres tracés."
                actions={
                    <BtnLink href="/conquest/builder">
                        <Plus size={17} /> Nouveau touge
                    </BtnLink>
                }
            />

            {/* ===== REGION FILTER ===== */}
            {availableRegions.length > 1 && (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
                >
                    <button
                        onClick={() => setRegionFilter("ALL")}
                        className={`shrink-0 px-4 py-2 rounded-full text-xs font-display font-bold uppercase tracking-widest border transition-colors ${regionFilter === "ALL"
                            ? "bg-accent text-black border-accent"
                            : "bg-white/5 border-line text-zinc-400 hover:text-white hover:border-white/25"
                            }`}
                    >
                        Tous
                    </button>
                    {availableRegions.map((region) => (
                        <button
                            key={region}
                            onClick={() => setRegionFilter(region)}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-display font-bold uppercase tracking-widest border transition-colors ${regionFilter === region
                                ? "bg-accent text-black border-accent"
                                : "bg-white/5 border-line text-zinc-400 hover:text-white hover:border-white/25"
                                }`}
                        >
                            {region}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* ===== LIST ===== */}
            {filteredCircuits.length === 0 ? (
                <EmptyState
                    icon={Route}
                    title="Aucun touge"
                    text="Crée ton premier tracé avec le Route Builder ou en mode GPS."
                    action={
                        <BtnLink href="/conquest/builder">
                            <Plus size={17} /> Créer un tracé
                        </BtnLink>
                    }
                />
            ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {filteredCircuits.map((circuit, index) => {
                        const open = selectedId === circuit.id;
                        return (
                            <motion.div
                                key={circuit.id}
                                variants={fadeUp}
                                layout
                                className={`glass overflow-hidden transition-colors ${open ? "border-accent/50" : "hover:border-white/20"}`}
                            >
                                {/* Row header */}
                                <button
                                    onClick={() => setSelectedId(open ? null : circuit.id)}
                                    className="w-full p-4 md:p-5 text-left"
                                >
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <span className="mono-num text-zinc-600 text-sm w-8 shrink-0">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="font-display font-bold text-white text-lg md:text-2xl uppercase tracking-wide truncate">
                                                    {circuit.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold uppercase tracking-widest mt-0.5">
                                                    <MapPin size={11} />
                                                    <span className="truncate">{circuit.location}</span>
                                                    <span className="text-zinc-700 hidden md:inline">·</span>
                                                    <span className="hidden md:inline">{circuit.length}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 md:gap-5 shrink-0">
                                            <DifficultyBadge level={circuit.difficulty} />
                                            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                                <ChevronRight size={19} className={open ? "text-accent" : "text-zinc-600"} />
                                            </motion.span>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded details */}
                                <AnimatePresence initial={false}>
                                    {open && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 md:px-5 pb-5 border-t border-line pt-4">
                                                <p className="text-zinc-400 mb-5">{circuit.description}</p>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                                                    <div className="rounded-xl bg-black/30 border border-line p-3">
                                                        <div className="label">Longueur</div>
                                                        <div className="mono-num text-white font-bold text-lg mt-0.5">{circuit.length}</div>
                                                    </div>
                                                    <div className="rounded-xl bg-black/30 border border-line p-3">
                                                        <div className="label">Points GPS</div>
                                                        <div className="mono-num text-white font-bold text-lg mt-0.5">
                                                            {circuit.routePoints?.length || 0}
                                                        </div>
                                                    </div>
                                                    {circuit.record && (
                                                        <div className="rounded-xl bg-black/30 border border-line p-3">
                                                            <div className="label flex items-center gap-1">
                                                                <Clock size={10} /> Record
                                                            </div>
                                                            <div className="mono-num text-gold font-bold text-lg mt-0.5">{circuit.record}</div>
                                                        </div>
                                                    )}
                                                    <div className="rounded-xl bg-black/30 border border-line p-3">
                                                        <div className="label">Pays</div>
                                                        <div className="text-white font-bold text-lg mt-0.5 truncate">{circuit.country}</div>
                                                    </div>
                                                </div>

                                                <BtnLink href={`/touge/${circuit.id}`} className="w-full md:w-auto">
                                                    <Eye size={17} /> Voir le tracé GPS
                                                </BtnLink>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ===== STATS FOOTER ===== */}
            {circuits.length > 0 && (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="mt-10 pt-6 border-t border-line flex flex-wrap gap-x-10 gap-y-3"
                >
                    <div className="flex items-baseline gap-2">
                        <span className="label">Total tracés</span>
                        <span className="mono-num text-white font-bold text-xl">{circuits.length}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="label">Distance totale</span>
                        <span className="mono-num text-ice font-bold text-xl">
                            {circuits.reduce((acc, c) => acc + c.lengthKm, 0).toFixed(1)} km
                        </span>
                    </div>
                </motion.div>
            )}
        </PageShell>
    );
}
