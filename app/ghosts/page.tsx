"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Trophy, Car as CarIcon, MapPin, Play, Trash2, Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostRun, WEATHER_INFO } from "../lib/types";
import { loadGhosts, saveGhosts } from "../lib/storage";
import { formatTime, formatDate } from "../lib/format";
import {
    PageShell, PageHeader, BtnLink, EmptyState, Stat, fadeUp, stagger,
} from "@/components/ui";

const rankStyle = (rank: number) => {
    if (rank === 0) return "bg-gold/15 text-gold border-gold/50 shadow-[0_0_16px_-4px_rgba(255,194,51,0.5)]";
    if (rank === 1) return "bg-zinc-400/10 text-zinc-300 border-zinc-400/40";
    if (rank === 2) return "bg-orange-600/10 text-orange-400 border-orange-600/40";
    return "bg-black/30 text-zinc-600 border-line";
};

export default function GhostsPage() {
    const [ghosts, setGhosts] = useState<GhostRun[]>([]);

    useEffect(() => {
        setGhosts(loadGhosts());
    }, []);

    const deleteGhost = (id: string) => {
        const updated = ghosts.filter((g) => g.id !== id);
        setGhosts(updated);
        saveGhosts(updated);
    };

    // Group by touge, each group sorted by best time (real leaderboard)
    const groupedByTouge = useMemo(() => {
        const groups = ghosts.reduce((acc, ghost) => {
            (acc[ghost.tougeName] ||= []).push(ghost);
            return acc;
        }, {} as Record<string, GhostRun[]>);
        for (const runs of Object.values(groups)) {
            runs.sort((a, b) => a.totalTime - b.totalTime);
        }
        return groups;
    }, [ghosts]);

    const bestTime = ghosts.length > 0 ? Math.min(...ghosts.map((g) => g.totalTime)) : 0;

    return (
        <PageShell>
            <PageHeader
                kicker="Time attack records"
                title="Ghosts"
                sub="Tes runs enregistrés, classés par meilleur chrono sur chaque touge."
                actions={
                    <>
                        <BtnLink href="/run">
                            <Plus size={17} /> Nouveau run
                        </BtnLink>
                        <BtnLink href="/map" variant="outline">
                            <MapPin size={17} /> Carte
                        </BtnLink>
                    </>
                }
            />

            {ghosts.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title="Aucun ghost enregistré"
                    text="Lance ton premier run GPS pour créer un ghost et démarrer les classements."
                    action={
                        <BtnLink href="/run">
                            <Play size={17} /> Lancer un run
                        </BtnLink>
                    }
                />
            ) : (
                <>
                    {/* ===== GLOBAL STATS ===== */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-3 gap-3 md:gap-4 mb-10"
                    >
                        <motion.div variants={fadeUp}>
                            <Stat label="Total runs" value={ghosts.length} tone="text-ice" />
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <Stat label="Touges explorés" value={Object.keys(groupedByTouge).length} tone="text-haze" />
                        </motion.div>
                        <motion.div variants={fadeUp}>
                            <Stat label="Meilleur temps" value={formatTime(bestTime)} tone="text-mint" />
                        </motion.div>
                    </motion.div>

                    {/* ===== LEADERBOARDS ===== */}
                    <div className="space-y-10">
                        {Object.entries(groupedByTouge).map(([tougeName, tougeGhosts]) => (
                            <motion.section key={tougeName} variants={fadeUp} initial="hidden" animate="show">
                                <h2 className="flex items-center gap-3 mb-4">
                                    <span className="grid place-items-center w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 text-gold">
                                        <MapPin size={15} />
                                    </span>
                                    <span className="font-display font-bold uppercase tracking-widest text-lg text-white">
                                        {tougeName}
                                    </span>
                                    <span className="label">— {tougeGhosts.length} run{tougeGhosts.length > 1 ? "s" : ""}</span>
                                </h2>

                                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
                                    <AnimatePresence>
                                        {tougeGhosts.map((ghost, index) => (
                                            <motion.div
                                                key={ghost.id}
                                                layout
                                                variants={fadeUp}
                                                exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                                                className={`glass glass-hover p-4 ${index === 0 ? "border-gold/40" : ""}`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                    {/* Rank + driver */}
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div
                                                            className={`shrink-0 grid place-items-center w-11 h-11 rounded-xl border font-display font-bold ${rankStyle(index)}`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-display font-bold text-white text-lg uppercase tracking-wide truncate">
                                                                {ghost.driverName}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-ice font-semibold uppercase tracking-widest mt-0.5">
                                                                <CarIcon size={11} />
                                                                <span className="truncate">{ghost.carName}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Time + speeds */}
                                                    <div className="flex items-center justify-between md:justify-end gap-5">
                                                        <div className="text-left md:text-right">
                                                            <div className={`mono-num text-2xl font-bold ${index === 0 ? "text-gold" : "text-white"}`}>
                                                                {formatTime(ghost.totalTime)}
                                                            </div>
                                                            <div className="label">{formatDate(ghost.date)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-xl">{WEATHER_INFO[ghost.weather].icon}</span>
                                                            <div className="text-[11px] font-bold uppercase tracking-widest">
                                                                <div className="text-mint mono-num">{ghost.maxSpeed.toFixed(0)} km/h max</div>
                                                                <div className="text-zinc-500 mono-num">{ghost.avgSpeed.toFixed(0)} km/h moy</div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex gap-2">
                                                            <BtnLink
                                                                href={`/ghosts/detail?id=${ghost.id}`}
                                                                variant={index === 0 ? "primary" : "ghost"}
                                                                className="px-4! py-2.5! text-xs!"
                                                            >
                                                                <Play size={13} /> Replay
                                                            </BtnLink>
                                                            <button
                                                                onClick={() => deleteGhost(ghost.id)}
                                                                className="grid place-items-center px-3 rounded-xl border border-line text-zinc-600 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                                                aria-label="Supprimer"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </motion.section>
                        ))}
                    </div>
                </>
            )}
        </PageShell>
    );
}
