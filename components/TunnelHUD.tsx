"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, Square, Camera, Siren, Satellite } from "lucide-react";
import { formatTime } from "@/app/lib/format";

export type TunnelHazard = {
    kind: "radar" | "police";
    distM: number;
    maxspeed?: string;
} | null;

function formatDelta(ms: number): string {
    const sign = ms >= 0 ? "+" : "−";
    return `${sign}${(Math.abs(ms) / 1000).toFixed(1)}`;
}

export default function TunnelHUD({
    elapsedTime,
    currentSpeed,
    maxSpeed,
    ghostDelta,
    hazard,
    gpsAccuracy,
    gpsError,
    isRecording,
    pointsCount,
    tougeName,
    onStop,
    onExit,
}: {
    elapsedTime: number;
    currentSpeed: number;
    maxSpeed: number;
    ghostDelta: number | null;
    hazard: TunnelHazard;
    gpsAccuracy: number;
    gpsError: string | null;
    isRecording: boolean;
    pointsCount: number;
    tougeName: string;
    onStop: () => void;
    onExit: () => void;
}) {
    // Neon scroll speed follows real GPS speed: crawling glide → highway blur
    const railDuration = Math.min(Math.max(45 / Math.max(currentSpeed, 2), 0.25), 6);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[800] overflow-hidden select-none"
            style={{ background: "#050507" }}
        >
            {/* Tunnel scenery */}
            <div className="tunnel-rail tunnel-rail--left" style={{ animationDuration: `${railDuration}s` }} />
            <div className="tunnel-rail tunnel-rail--right" style={{ animationDuration: `${railDuration}s` }} />
            <div className="tunnel-ceiling" style={{ animationDuration: `${railDuration * 1.4}s` }} />
            <div className="tunnel-road" />

            {/* Hazard full-screen flash */}
            <AnimatePresence>
                {hazard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.08, 0.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, repeat: Infinity }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                hazard.kind === "radar"
                                    ? "radial-gradient(80% 80% at 50% 50%, transparent 40%, rgba(244,86,74,0.55))"
                                    : "radial-gradient(80% 80% at 50% 50%, transparent 40%, rgba(59,130,246,0.55))",
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Top row */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                    {isRecording && <span className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-dot" />}
                    <div>
                        <div className="label !text-zinc-500 truncate max-w-[45vw]">{tougeName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {gpsError ? (
                                <span className="text-[11px] font-semibold text-red-400">{gpsError}</span>
                            ) : (
                                <>
                                    <Satellite size={10} className="text-mint" />
                                    <span className="mono-num text-[11px] text-mint">±{gpsAccuracy.toFixed(0)} m</span>
                                    <span className="mono-num text-[11px] text-zinc-600 ml-2">{pointsCount} pts</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-line bg-black/40 text-zinc-400 hover:text-white transition-colors text-[11px] font-display font-semibold uppercase tracking-widest"
                >
                    <MapIcon size={13} /> Carte
                </button>
            </div>

            {/* Hazard banner */}
            <AnimatePresence>
                {hazard && (
                    <motion.div
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        className="absolute top-20 inset-x-0 flex justify-center pointer-events-none"
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 bg-black/70 ${hazard.kind === "radar" ? "border-flame" : "border-blue-500"
                                }`}
                        >
                            {hazard.kind === "radar" ? (
                                <Camera size={26} className="text-flame animate-pulse" />
                            ) : (
                                <Siren size={26} className="text-blue-400 animate-pulse" />
                            )}
                            <div>
                                <div
                                    className={`font-display font-semibold uppercase tracking-widest text-2xl leading-none ${hazard.kind === "radar" ? "text-flame" : "text-blue-400"
                                        }`}
                                >
                                    {hazard.kind === "radar" ? "Radar" : "Police"} · {Math.round(hazard.distM / 10) * 10} m
                                </div>
                                {hazard.maxspeed && <div className="label mt-1">Limite {hazard.maxspeed} km/h</div>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center: chrono + ghost delta */}
            <div className="absolute inset-x-0 top-[30%] text-center px-4">
                <div className="mono-num headlight font-semibold text-7xl md:text-8xl tracking-wide">
                    {formatTime(elapsedTime)}
                </div>
                <div className="mt-3 h-9">
                    {ghostDelta !== null ? (
                        <span
                            className={`mono-num font-display font-semibold text-3xl ${ghostDelta <= 0 ? "text-mint" : "text-flame"
                                }`}
                        >
                            {formatDelta(ghostDelta)}
                            <span className="text-base text-zinc-500 ml-1.5">s vs ghost</span>
                        </span>
                    ) : (
                        <span className="label">Pas de ghost sur ce tracé</span>
                    )}
                </div>
            </div>

            {/* Speed */}
            <div className="absolute inset-x-0 bottom-[24%] text-center">
                <div className="mono-num font-semibold text-6xl md:text-7xl text-ice [text-shadow:0_0_30px_rgba(111,214,234,0.35)]">
                    {currentSpeed.toFixed(0)}
                </div>
                <div className="label mt-1">
                    km/h · max <span className="mono-num text-zinc-400">{maxSpeed.toFixed(0)}</span>
                </div>
            </div>

            {/* Stop */}
            <div className="absolute bottom-6 inset-x-6 flex justify-center">
                <button
                    onClick={onStop}
                    className="w-full md:w-auto md:min-w-[300px] flex justify-center items-center gap-2.5 px-8 py-4 rounded-2xl border-2 border-red-500/60 text-red-400 bg-black/40 hover:bg-red-500 hover:text-black transition-colors font-display font-semibold uppercase tracking-widest text-base active:scale-[0.98]"
                >
                    <Square size={19} /> Arrêter le run
                </button>
            </div>
        </motion.div>
    );
}
