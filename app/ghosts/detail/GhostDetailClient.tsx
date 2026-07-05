"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, Play, Pause, RotateCcw, Car as CarIcon, MapPin, Gauge, Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { GhostRun, WEATHER_INFO, LatLng } from "../../lib/types";
import { loadGhosts } from "../../lib/storage";
import { formatTime, formatDate } from "../../lib/format";
import { BtnLink } from "@/components/ui";

const GhostReplayMap = dynamic(() => import("./GhostReplayMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full grid place-items-center">
            <div className="kicker text-ice animate-pulse">Chargement du replay…</div>
        </div>
    ),
});

interface GhostDetailClientProps {
    id: string;
}

export default function GhostDetailClient({ id }: GhostDetailClientProps) {
    const [ghost, setGhost] = useState<GhostRun | null>(null);
    const [notFound, setNotFound] = useState(false);

    // Replay state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const found = loadGhosts().find((g) => g.id === id);
        if (found && found.points.length > 0) setGhost(found);
        else setNotFound(true);
    }, [id]);

    // Playback loop
    useEffect(() => {
        if (isPlaying && ghost) {
            const points = ghost.points;
            if (currentIndex >= points.length - 1) {
                setIsPlaying(false);
                return;
            }
            const timeDiff = (points[currentIndex + 1].timestamp - points[currentIndex].timestamp) / playbackSpeed;
            animationRef.current = setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
            }, Math.min(Math.max(timeDiff, 30), 2000));
        }
        return () => {
            if (animationRef.current) clearTimeout(animationRef.current);
        };
    }, [isPlaying, currentIndex, ghost, playbackSpeed]);

    const togglePlay = () => {
        if (!ghost) return;
        if (currentIndex >= ghost.points.length - 1) setCurrentIndex(0);
        setIsPlaying((v) => !v);
    };

    const restart = () => {
        setCurrentIndex(0);
        setIsPlaying(false);
    };

    if (notFound) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="text-center">
                    <div className="kicker text-accent mb-4">Erreur 404</div>
                    <p className="font-display font-bold uppercase tracking-widest text-white text-xl mb-6">
                        Ghost introuvable
                    </p>
                    <BtnLink href="/ghosts" variant="outline">
                        <ArrowLeft size={16} /> Retour aux ghosts
                    </BtnLink>
                </div>
            </div>
        );
    }

    if (!ghost) {
        return (
            <div className="map-screen grid place-items-center">
                <div className="kicker text-ice animate-pulse">Chargement…</div>
            </div>
        );
    }

    const currentPoint = ghost.points[currentIndex];
    const currentPosition: LatLng = [currentPoint.lat, currentPoint.lng];
    const ghostPath: LatLng[] = ghost.points.slice(0, currentIndex + 1).map((p) => [p.lat, p.lng]);
    const progress = ghost.points.length > 1 ? (currentIndex / (ghost.points.length - 1)) * 100 : 100;

    return (
        <div className="map-screen">
            {/* Map */}
            <div className="absolute inset-0">
                <GhostReplayMap
                    ghostPath={ghostPath}
                    fullPath={ghost.points.map((p) => [p.lat, p.lng] as LatLng)}
                    currentPosition={currentPosition}
                />
            </div>

            {/* ===== TOP HUD ===== */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-3 inset-x-3 z-[500]"
            >
                <div className="hud edge-accent p-3.5 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href="/ghosts"
                                className="shrink-0 grid place-items-center w-9 h-9 rounded-lg border border-line text-zinc-500 hover:text-white hover:border-white/30 transition-colors"
                            >
                                <ArrowLeft size={17} />
                            </Link>
                            <div className="min-w-0">
                                <h1 className="font-display font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                                    <Trophy size={14} /> Replay
                                </h1>
                                <div className="label truncate">
                                    {ghost.driverName} · {formatDate(ghost.date)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest shrink-0">
                            <span className="hidden md:flex items-center gap-1.5 text-ice">
                                <CarIcon size={12} />
                                <span className="truncate max-w-[9rem]">{ghost.carName}</span>
                            </span>
                            <span className="hidden md:flex items-center gap-1.5 text-haze">
                                <MapPin size={12} />
                                <span className="truncate max-w-[9rem]">{ghost.tougeName}</span>
                            </span>
                            <span className="text-lg">{WEATHER_INFO[ghost.weather].icon}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ===== LIVE DATA ===== */}
            <div className="absolute top-[5.5rem] inset-x-3 z-[500] flex justify-between pointer-events-none">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="hud px-4 py-2.5 text-center"
                >
                    <div className="mono-num text-2xl md:text-4xl font-bold text-gold [text-shadow:0_0_20px_rgba(255,194,51,0.35)]">
                        {formatTime(currentPoint.timestamp)}
                    </div>
                    <div className="label">/ {formatTime(ghost.totalTime)}</div>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="hud px-4 py-2.5 text-center w-24 md:w-28"
                >
                    <Gauge size={14} className="mx-auto text-mint mb-0.5" />
                    <div className="mono-num text-xl md:text-3xl font-bold text-mint">
                        {(currentPoint.speed || 0).toFixed(0)}
                    </div>
                    <div className="label">km/h</div>
                </motion.div>
            </div>

            {/* ===== SIDE STATS (desktop) ===== */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="absolute top-56 left-3 z-[500] hidden md:block"
            >
                <div className="hud p-4 space-y-3 w-40">
                    <div className="text-center">
                        <div className="mono-num text-xl font-bold text-gold">{ghost.maxSpeed.toFixed(0)}</div>
                        <div className="label">Vmax (km/h)</div>
                    </div>
                    <div className="text-center border-t border-line pt-3">
                        <div className="mono-num text-xl font-bold text-ice">{ghost.avgSpeed.toFixed(0)}</div>
                        <div className="label">Moy (km/h)</div>
                    </div>
                    <div className="text-center border-t border-line pt-3">
                        <div className="mono-num text-xl font-bold text-haze">{ghost.totalDistance.toFixed(2)}</div>
                        <div className="label">Distance (km)</div>
                    </div>
                </div>
            </motion.div>

            {/* ===== BOTTOM CONTROLS ===== */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 inset-x-3 z-[500]"
            >
                <div className="hud p-4 max-w-2xl mx-auto">
                    {/* Progress bar (seekable) */}
                    <div
                        className="w-full mb-4 cursor-pointer group"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                            setCurrentIndex(Math.round(ratio * (ghost.points.length - 1)));
                        }}
                    >
                        <div className="h-2.5 rounded-full bg-white/8 overflow-hidden group-hover:h-3.5 transition-all">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-accent to-gold shadow-[0_0_12px_rgba(255,194,51,0.6)] transition-[width] duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={restart}
                                className="grid place-items-center w-12 h-12 rounded-xl border border-line text-zinc-500 hover:text-white hover:border-white/30 transition-colors active:scale-95"
                                aria-label="Recommencer"
                            >
                                <RotateCcw size={19} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="grid place-items-center w-14 h-12 rounded-xl bg-accent text-black hover:bg-white transition-colors active:scale-95 shadow-[0_8px_28px_-8px_rgba(255,59,87,0.6)]"
                                aria-label={isPlaying ? "Pause" : "Lecture"}
                            >
                                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                            </button>
                        </div>

                        {/* Speed selector */}
                        <div className="flex rounded-xl border border-line overflow-hidden">
                            {[0.5, 1, 2, 4].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`w-12 md:w-14 py-3 text-xs font-display font-bold transition-colors ${playbackSpeed === speed
                                        ? "bg-ice text-black"
                                        : "bg-transparent text-zinc-500 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {speed}×
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
