"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-500 font-mono animate-pulse">LOADING REPLAY...</div>
        </div>
    )
});

export default function GhostDetailPage() {
    const params = useParams();
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
            const found = ghosts.find(g => g.id === params.id);
            if (found) setGhost(found);
        }
    }, [params.id]);

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
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <div className="text-zinc-500">Ghost non trouvé...</div>
            </div>
        );
    }

    const currentPoint = ghost.points[currentIndex];
    const currentPosition: LatLng = [currentPoint.lat, currentPoint.lng];
    const ghostPath: LatLng[] = ghost.points.slice(0, currentIndex + 1).map(p => [p.lat, p.lng]);
    const progress = (currentIndex / (ghost.points.length - 1)) * 100;

    return (
        <div className="h-screen w-full bg-zinc-950 relative overflow-hidden">

            {/* Map (full screen) */}
            <div className="absolute inset-0">
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
                className="absolute top-4 left-4 right-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/ghosts" className="text-zinc-400 hover:text-yellow-500">
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                                    <Trophy size={20} />
                                    GHOST REPLAY
                                </h1>
                                <div className="text-zinc-500 text-sm">
                                    {ghost.driverName} • {ghost.date}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <CarIcon size={16} />
                                {ghost.carName}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <MapPin size={16} />
                                {ghost.tougeName}
                            </div>
                            <div className="text-2xl">{WEATHER_INFO[ghost.weather].icon}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HUD - Timer Display */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-yellow-500 rounded-lg px-8 py-4 text-center">
                    <div className="text-4xl font-bold text-yellow-500 font-mono">
                        {formatTime(currentPoint.timestamp)}
                    </div>
                    <div className="text-zinc-500 text-xs mt-1">
                        / {formatTime(ghost.totalTime)}
                    </div>
                </div>
            </div>

            {/* HUD - Speed Display */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-40 right-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 text-center w-32">
                    <Gauge size={20} className="mx-auto text-zinc-500 mb-1" />
                    <div className="text-3xl font-bold text-green-500">
                        {(currentPoint.speed || 0).toFixed(0)}
                    </div>
                    <div className="text-zinc-600 text-xs">km/h</div>
                </div>
            </motion.div>

            {/* HUD - Stats Panel */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-40 left-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 space-y-3 w-40">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">{ghost.maxSpeed.toFixed(0)}</div>
                        <div className="text-zinc-600 text-xs">Vitesse Max</div>
                    </div>
                    <div className="text-center border-t border-zinc-800 pt-3">
                        <div className="text-xl font-bold text-blue-500">{ghost.avgSpeed.toFixed(0)}</div>
                        <div className="text-zinc-600 text-xs">Moyenne km/h</div>
                    </div>
                    <div className="text-center border-t border-zinc-800 pt-3">
                        <div className="text-xl font-bold text-green-500">{ghost.totalDistance.toFixed(2)}</div>
                        <div className="text-zinc-600 text-xs">km parcourus</div>
                    </div>
                </div>
            </motion.div>

            {/* HUD - Bottom Controls */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-lg p-4 flex flex-col items-center gap-4">

                    {/* Progress bar */}
                    <div className="w-80">
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-500 transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={restart}
                            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <RotateCcw size={20} />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="p-4 bg-yellow-500 text-black hover:bg-yellow-400 rounded-lg transition-colors"
                        >
                            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                        </button>

                        {/* Speed selector */}
                        <div className="flex gap-1">
                            {[0.5, 1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-3 py-2 text-xs rounded transition-colors ${playbackSpeed === speed
                                            ? "bg-yellow-500 text-black font-bold"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                        }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
