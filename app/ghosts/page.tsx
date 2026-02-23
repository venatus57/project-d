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
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-pixel">

            {/* Header */}
            <header className="mb-8 border-b-2 border-zinc-800 pb-4">
                <Link href="/" className="inline-flex text-zinc-500 hover:text-toxic-cyan text-sm items-center gap-2 mb-4 uppercase tracking-widest hard-border px-3 py-1 border-2 border-transparent hover:border-toxic-cyan transition-colors">
                    <ArrowLeft size={14} /> Accueil
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-toxic-yellow flex items-center gap-3 text-shadow-[0_0_15px_rgba(255,255,0,0.5)] glitch-hover">
                    <Trophy size={36} className="md:w-12 md:h-12" />
                    GHOSTS
                </h1>
                <p className="text-zinc-500 mt-2 uppercase tracking-widest text-xs">Tes runs enregistrés et leurs temps</p>
            </header>

            {/* Menu Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Link
                    href="/run"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-toxic-green text-black border-2 border-toxic-green px-8 py-4 font-bold hover:bg-white hover:border-white transition-colors hard-border uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,65,0.4)] glitch-hover"
                >
                    <Plus size={18} />
                    NOUVEAU RUN
                </Link>
                <Link
                    href="/conquest"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-zinc-400 border-2 border-zinc-800 px-8 py-4 font-bold hover:text-toxic-cyan hover:border-toxic-cyan transition-colors hard-border uppercase tracking-widest"
                >
                    <MapPin size={18} />
                    VOIR MAP OUTÉTERRE
                </Link>
            </div>

            {/* Empty State */}
            {ghosts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 hard-border">
                    <Trophy size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-zinc-500 mb-2">AUCUN GHOST ENREGISTRÉ</h2>
                    <p className="text-zinc-600 mb-6 uppercase text-xs tracking-widest border-b-2 border-zinc-800 pb-6 max-w-xs mx-auto">Lance ton premier run pour créer un ghost !</p>
                    <Link
                        href="/run"
                        className="inline-flex items-center justify-center gap-2 bg-toxic-green text-black border-2 border-toxic-green px-6 py-3 font-bold hover:bg-white hover:border-white transition-colors hard-border uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,65,0.4)] glitch-hover mt-4"
                    >
                        <Play size={18} />
                        LANCER UN RUN
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedByTouge).map(([tougeName, tougeGhosts]) => (
                        <div key={tougeName}>
                            {/* Touge Header */}
                            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-widest border-l-4 border-toxic-yellow pl-3">
                                <MapPin size={24} className="text-toxic-yellow" />
                                {tougeName}
                                <span className="text-zinc-500 text-sm md:text-base font-normal ml-2">
                                    // {tougeGhosts.length} RUNS
                                </span>
                            </h2>

                            {/* Ghost List */}
                            <div className="space-y-4">
                                {tougeGhosts.map((ghost, index) => (
                                    <motion.div
                                        key={ghost.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-black border-2 border-zinc-800 hard-border hover:border-toxic-yellow transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,255,0,0.2)]"
                                    >
                                        <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

                                            {/* Rank & Driver Info */}
                                            <div className="flex items-center gap-4">
                                                {/* Rank Badge */}
                                                <div className={`w-12 h-12 flex items-center justify-center font-bold text-xl hard-border border-2 ${index === 0 ? "bg-toxic-yellow/20 text-toxic-yellow border-toxic-yellow shadow-[0_0_10px_rgba(255,255,0,0.4)]" :
                                                        index === 1 ? "bg-zinc-400/20 text-zinc-300 border-zinc-400" :
                                                            index === 2 ? "bg-orange-600/20 text-orange-500 border-orange-600" :
                                                                "bg-black text-zinc-600 border-zinc-800"
                                                    }`}>
                                                    #{index + 1}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="font-bold text-xl text-white uppercase tracking-widest">{ghost.driverName}</div>
                                                    <div className="text-xs text-toxic-cyan flex items-center gap-2 uppercase tracking-widest mt-1 font-bold">
                                                        <CarIcon size={12} />
                                                        {ghost.carName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats & Time */}
                                            <div className="flex flex-row md:flex-col items-center justify-between md:justify-center bg-zinc-950 border-2 border-zinc-800 p-3 hard-border gap-4 md:gap-2">
                                                <div className="text-center md:text-right flex-1 md:flex-none">
                                                    <div className="text-3xl font-bold text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.3)]">
                                                        {formatTime(ghost.totalTime)}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{ghost.date}</div>
                                                </div>

                                                <div className="hidden md:block w-full h-[2px] bg-zinc-800"></div>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{WEATHER_INFO[ghost.weather].icon}</span>
                                                    <div className="text-right text-[10px] uppercase tracking-widest font-bold">
                                                        <div className="text-toxic-green w-24">
                                                            {ghost.maxSpeed.toFixed(0)} KM/H MAX
                                                        </div>
                                                        <div className="text-zinc-500 w-24">
                                                            {ghost.avgSpeed.toFixed(0)} KM/H AVG
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                <Link
                                                    href={`/ghosts/detail?id=${ghost.id}`}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-toxic-yellow border-2 border-toxic-yellow text-black font-bold text-sm hover:bg-white hard-border transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,0,0.2)]"
                                                >
                                                    <Play size={14} />
                                                    REPLAY
                                                </Link>
                                                <button
                                                    onClick={() => deleteGhost(ghost.id)}
                                                    className="px-4 py-4 bg-black border-2 border-zinc-800 text-zinc-500 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500 transition-colors hard-border"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
                <div className="mt-16 pt-8 border-t-2 border-zinc-800 flex flex-col md:flex-row gap-4 md:gap-12 uppercase tracking-widest font-bold">
                    <div className="bg-black border-2 border-zinc-800 p-4 hard-border flex justify-between md:block items-center md:items-start text-sm">
                        <span className="text-zinc-500 block text-xs mb-1">TOTAL RUNS</span>
                        <span className="text-toxic-cyan text-xl md:text-2xl">{ghosts.length}</span>
                    </div>
                    <div className="bg-black border-2 border-zinc-800 p-4 hard-border flex justify-between md:block items-center md:items-start text-sm">
                        <span className="text-zinc-500 block text-xs mb-1">TOUGES EXPLORÉS</span>
                        <span className="text-toxic-magenta text-xl md:text-2xl">{Object.keys(groupedByTouge).length}</span>
                    </div>
                    <div className="bg-black border-2 border-zinc-800 p-4 hard-border flex justify-between md:block items-center md:items-start text-sm">
                        <span className="text-zinc-500 block text-xs mb-1">MEILLEUR TEMPS</span>
                        <span className="text-toxic-green text-xl md:text-2xl text-shadow-[0_0_10px_rgba(0,255,65,0.4)]">
                            {formatTime(Math.min(...ghosts.map(g => g.totalTime)))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
