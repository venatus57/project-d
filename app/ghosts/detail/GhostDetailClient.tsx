"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, Play, Pause, RotateCcw, Car as CarIcon,
    MapPin, Timer, Gauge, Trophy, Cloud
} from "lucide-react";
import { motion } from "framer-motion";
import { GhostRun, WEATHER_INFO, LatLng } from "../../lib/types";

// Dynamic map import
const GhostReplayMap = dynamic(() => import("./GhostReplayMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black flex items-center justify-center font-pixel">
            <div className="text-toxic-cyan text-xl animate-pulse glitch-hover">LOADING REPLAY...</div>
        </div>
    )
});

interface GhostDetailClientProps {
    id: string;
}

export default function GhostDetailClient({ id }: GhostDetailClientProps) {
    const router = useRouter();
    const [ghost, setGhost] = useState<GhostRun | null>(null);

    // Replay state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    // Load ghost
    useEffect(() => {
        const savedGhosts = localStorage.getItem("projectd_ghosts");
        if (savedGhosts) {
            const ghosts: GhostRun[] = JSON.parse(savedGhosts);
            const found = ghosts.find(g => g.id === id);
            if (found) setGhost(found);
        }
    }, [id]);

    // Playback animation
    useEffect(() => {
        if (isPlaying && ghost) {
            const points = ghost.points;
            if (currentIndex >= points.length - 1) {
                setIsPlaying(false);
                return;
            }

            const currentPoint = points[currentIndex];
            const nextPoint = points[currentIndex + 1];
            const timeDiff = (nextPoint.timestamp - currentPoint.timestamp) / playbackSpeed;

            animationRef.current = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, Math.max(timeDiff, 50)); // Min 50ms between updates
        }

        return () => {
            if (animationRef.current) clearTimeout(animationRef.current);
        };
    }, [isPlaying, currentIndex, ghost, playbackSpeed]);

    const formatTime = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (currentIndex >= (ghost?.points.length || 1) - 1) {
            setCurrentIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    const restart = () => {
        setCurrentIndex(0);
        setIsPlaying(false);
    };

    if (!ghost) {
        return (
            <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-pixel uppercase tracking-widest text-xl">
                <div className="animate-pulse">Ghost introuvable...</div>
            </div>
        );
    }

    const currentPoint = ghost.points[currentIndex];
    const currentPosition: LatLng = [currentPoint.lat, currentPoint.lng];
    const ghostPath: LatLng[] = ghost.points.slice(0, currentIndex + 1).map(p => [p.lat, p.lng]);
    const progress = (currentIndex / (ghost.points.length - 1)) * 100;

    return (
        <div className="h-[100dvh] w-full bg-black relative overflow-hidden font-pixel">

            {/* Map (full screen) */}
            <div className="absolute inset-0 top-24 md:top-24 bottom-32 md:bottom-24">
                <GhostReplayMap
                    ghostPath={ghostPath}
                    fullPath={ghost.points.map(p => [p.lat, p.lng] as LatLng)}
                    currentPosition={currentPosition}
                />
            </div>

            {/* HUD - Top Info Bar */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-0 left-0 right-0 z-[1000]"
            >
                <div className="bg-black/95 backdrop-blur-md border-b-2 border-zinc-800 p-3 md:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4 max-w-7xl mx-auto">

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                            <Link href="/ghosts" className="text-zinc-500 hover:text-toxic-cyan transition-colors border-2 border-transparent hover:border-toxic-cyan p-1 hard-border shrink-0">
                                <ArrowLeft size={20} />
                            </Link>
                            <div className="truncate">
                                <h1 className="text-lg md:text-xl font-bold text-toxic-yellow flex items-center gap-2 uppercase tracking-widest text-shadow-[0_0_10px_rgba(255,255,0,0.4)] glitch-hover">
                                    <Trophy size={16} />
                                    REPLAY
                                </h1>
                                <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-widest truncate">
                                    {ghost.driverName} • {ghost.date}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4 text-[10px] md:text-xs font-bold tracking-widest uppercase border-t-2 md:border-t-0 border-zinc-800 pt-2 md:pt-0">
                            <div className="flex items-center gap-2 text-toxic-cyan">
                                <CarIcon size={14} />
                                <span className="truncate max-w-[100px] md:max-w-none">{ghost.carName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-toxic-magenta">
                                <MapPin size={14} />
                                <span className="truncate max-w-[100px] md:max-w-none">{ghost.tougeName}</span>
                            </div>
                            <div className="text-lg md:text-2xl">{WEATHER_INFO[ghost.weather].icon}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HUD - Data Overlays (Mobile absolute) */}
            <div className="absolute top-28 md:top-32 left-4 right-4 flex justify-between pointer-events-none z-[1000]">
                {/* Timer Display */}
                <div className="bg-black/90 backdrop-blur-md border-2 border-toxic-yellow hard-border px-4 py-2 text-center shadow-[0_0_15px_rgba(255,255,0,0.3)] pointer-events-auto">
                    <div className="text-2xl md:text-4xl font-bold text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.4)]">
                        {formatTime(currentPoint.timestamp)}
                    </div>
                    <div className="text-zinc-500 text-[10px] md:text-xs mt-1 uppercase tracking-widest">
                        / {formatTime(ghost.totalTime)}
                    </div>
                </div>

                {/* Speed Display */}
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 hard-border p-2 md:p-4 text-center w-24 md:w-32 shadow-[0_0_15px_rgba(0,0,0,0.8)] pointer-events-auto">
                    <Gauge size={16} className="mx-auto text-toxic-green mb-1" />
                    <div className="text-xl md:text-3xl font-bold text-toxic-green text-shadow-[0_0_10px_rgba(0,255,65,0.4)]">
                        {(currentPoint.speed || 0).toFixed(0)}
                    </div>
                    <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-widest">KM/H</div>
                </div>
            </div>

            {/* HUD - Stats Panel */}
            <div className="absolute top-52 md:top-64 left-4 z-[1000] pointer-events-none hidden md:block">
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 hard-border p-4 space-y-3 w-40 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto">
                    <div className="text-center font-bold uppercase tracking-widest">
                        <div className="text-xl text-toxic-yellow">{ghost.maxSpeed.toFixed(0)}</div>
                        <div className="text-zinc-600 text-[10px]">VMAX (KM/H)</div>
                    </div>
                    <div className="text-center border-t-2 border-zinc-800 pt-3 font-bold uppercase tracking-widest">
                        <div className="text-xl text-toxic-cyan">{ghost.avgSpeed.toFixed(0)}</div>
                        <div className="text-zinc-600 text-[10px]">MOY (KM/H)</div>
                    </div>
                    <div className="text-center border-t-2 border-zinc-800 pt-3 font-bold uppercase tracking-widest">
                        <div className="text-xl text-toxic-magenta">{ghost.totalDistance.toFixed(2)}</div>
                        <div className="text-zinc-600 text-[10px]">DISTANCE (KM)</div>
                    </div>
                </div>
            </div>

            {/* HUD - Bottom Controls */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-4 left-4 right-4 z-[1000]"
            >
                <div className="bg-black/95 backdrop-blur-xl border-2 border-zinc-800 hard-border p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-w-2xl mx-auto">

                    {/* Progress bar */}
                    <div className="w-full mb-4 md:mb-6">
                        <div className="h-4 bg-zinc-900 hard-border border border-zinc-800 overflow-hidden relative">
                            <div
                                className="h-full bg-toxic-yellow transition-all duration-100 shadow-[0_0_10px_rgba(255,255,0,0.8)] relative"
                                style={{ width: `${progress}%` }}
                            >
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                onClick={restart}
                                className="flex-1 md:flex-none p-3 md:p-4 bg-black border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white hard-border transition-colors flex justify-center items-center"
                            >
                                <RotateCcw size={20} />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="flex-[2] md:flex-none p-3 md:p-4 bg-toxic-yellow border-2 border-toxic-yellow text-black hover:bg-white hover:text-black hover:border-white hard-border transition-colors shadow-[0_0_15px_rgba(255,255,0,0.4)] glitch-hover flex justify-center items-center gap-2 font-bold uppercase tracking-widest"
                            >
                                {isPlaying ? (
                                    <><Pause size={24} /> <span className="hidden md:inline">PAUSE</span></>
                                ) : (
                                    <><Play size={24} /> <span className="hidden md:inline">PLAY</span></>
                                )}
                            </button>
                        </div>

                        {/* Speed selector */}
                        <div className="flex w-full md:w-auto border-2 border-zinc-800 hard-border">
                            {[0.5, 1, 2, 4].map((speed, i) => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`flex-1 md:w-16 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest font-bold transition-colors ${i < 3 ? 'border-r-2 border-zinc-800' : ''} ${playbackSpeed === speed
                                        ? "bg-toxic-cyan text-black shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                                        : "bg-black text-zinc-500 hover:text-white hover:bg-zinc-900"
                                        }`}
                                >
                                    {speed}X
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
