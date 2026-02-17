"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Trophy, Car as CarIcon, MapPin, Timer,
    Gauge, Play, Trash2, Plus, Cloud
} from "lucide-react";
import { motion } from "framer-motion";
import { GhostRun, WEATHER_INFO } from "../lib/types";

export default function GhostsPage() {
    const [ghosts, setGhosts] = useState<GhostRun[]>([]);

    // Load ghosts
    useEffect(() => {
        const saved = localStorage.getItem("projectd_ghosts");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Sort by date (newest first)
                setGhosts(parsed.sort((a: GhostRun, b: GhostRun) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ));
            } catch { }
        }
    }, []);

    const formatTime = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const deleteGhost = (id: string) => {
        const updated = ghosts.filter(g => g.id !== id);
        setGhosts(updated);
        localStorage.setItem("projectd_ghosts", JSON.stringify(updated));
    };

    // Group by touge
    const groupedByTouge = ghosts.reduce((acc, ghost) => {
        if (!acc[ghost.tougeName]) {
            acc[ghost.tougeName] = [];
        }
        acc[ghost.tougeName].push(ghost);
        return acc;
    }, {} as Record<string, GhostRun[]>);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* Header */}
            <header className="mb-8 border-b border-zinc-800 pb-4">
                <Link href="/" className="text-zinc-500 hover:text-yellow-500 text-sm flex items-center gap-2 mb-4">
                    <ArrowLeft size={14} /> Accueil
                </Link>
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500 flex items-center gap-3">
                    <Trophy size={36} />
                    GHOSTS
                </h1>
                <p className="text-zinc-500 mt-2">Tes runs enregistrés et leurs temps</p>
            </header>

            {/* New Run Button */}
            <Link
                href="/run"
                className="inline-flex items-center gap-2 bg-green-500 text-black px-6 py-3 font-bold hover:bg-green-400 transition-colors mb-8"
            >
                <Plus size={18} />
                NOUVEAU RUN
            </Link>

            {/* Empty State */}
            {ghosts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
                    <Trophy size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400 mb-2">Aucun ghost enregistré</h2>
                    <p className="text-zinc-600 mb-6">Lance ton premier run pour créer un ghost !</p>
                    <Link
                        href="/run"
                        className="inline-flex items-center gap-2 bg-green-500 text-black px-6 py-3 font-bold hover:bg-green-400 transition-colors"
                    >
                        <Play size={18} />
                        LANCER UN RUN
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedByTouge).map(([tougeName, tougeGhosts]) => (
                        <div key={tougeName}>
                            {/* Touge Header */}
                            <h2 className="text-lg font-bold text-zinc-400 flex items-center gap-2 mb-4">
                                <MapPin size={18} className="text-yellow-500" />
                                {tougeName}
                                <span className="text-zinc-600 text-sm font-normal">
                                    ({tougeGhosts.length} run{tougeGhosts.length > 1 ? "s" : ""})
                                </span>
                            </h2>

                            {/* Ghost List */}
                            <div className="space-y-3">
                                {tougeGhosts.map((ghost, index) => (
                                    <motion.div
                                        key={ghost.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-colors"
                                    >
                                        <div className="p-4 flex items-center justify-between">
                                            {/* Left: Driver & Car Info */}
                                            <div className="flex items-center gap-4">
                                                {/* Rank */}
                                                <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg rounded ${index === 0 ? "bg-yellow-500 text-black" :
                                                        index === 1 ? "bg-zinc-400 text-black" :
                                                            index === 2 ? "bg-orange-600 text-white" :
                                                                "bg-zinc-800 text-zinc-400"
                                                    }`}>
                                                    #{index + 1}
                                                </div>

                                                <div>
                                                    <div className="font-bold text-zinc-100">{ghost.driverName}</div>
                                                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                                                        <CarIcon size={12} />
                                                        {ghost.carName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center: Time */}
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-500 font-mono">
                                                    {formatTime(ghost.totalTime)}
                                                </div>
                                                <div className="text-xs text-zinc-500">{ghost.date}</div>
                                            </div>

                                            {/* Right: Stats & Actions */}
                                            <div className="flex items-center gap-4">
                                                {/* Weather */}
                                                <span className="text-2xl">{WEATHER_INFO[ghost.weather].icon}</span>

                                                {/* Speed Stats */}
                                                <div className="text-right text-xs">
                                                    <div className="text-green-500">
                                                        <Gauge size={10} className="inline mr-1" />
                                                        {ghost.maxSpeed.toFixed(0)} km/h max
                                                    </div>
                                                    <div className="text-zinc-500">
                                                        {ghost.avgSpeed.toFixed(0)} km/h moy
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/ghosts/${ghost.id}`}
                                                        className="px-4 py-2 bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-colors rounded flex items-center gap-1"
                                                    >
                                                        <Play size={14} />
                                                        REPLAY
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteGhost(ghost.id)}
                                                        className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            {ghosts.length > 0 && (
                <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-wrap gap-8 text-sm">
                    <div>
                        <span className="text-zinc-500">Total Runs:</span>
                        <span className="text-zinc-100 font-bold ml-2">{ghosts.length}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500">Touges explorés:</span>
                        <span className="text-yellow-500 font-bold ml-2">{Object.keys(groupedByTouge).length}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500">Meilleur temps:</span>
                        <span className="text-green-500 font-bold ml-2">
                            {formatTime(Math.min(...ghosts.map(g => g.totalTime)))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
