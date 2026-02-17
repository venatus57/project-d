"use client";

import { useState, useEffect } from "react";
// Remove useParams since we can pass id as prop
// import { useParams, useRouter } from "next/navigation"; 
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, MapPin, Ruler, Clock, TrendingDown,
    Mountain, Flag, Route as RouteIcon
} from "lucide-react";
import { motion } from "framer-motion";
import type { TougeCircuit } from "../types";
import { allCircuits } from "../data";

// Dynamic import for the map
const TougeMapView = dynamic(() => import("./TougeMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-500 font-mono animate-pulse">LOADING MAP...</div>
        </div>
    )
});

const difficultyColors = {
    EASY: "bg-green-500/20 text-green-500 border-green-500",
    MEDIUM: "bg-blue-500/20 text-blue-500 border-blue-500",
    HARD: "bg-orange-500/20 text-orange-500 border-orange-500",
    LEGENDARY: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
};

interface TougeDetailClientProps {
    id: string;
}

export default function TougeDetailClient({ id }: TougeDetailClientProps) {
    // const params = useParams(); // No longer needed
    const router = useRouter();
    const [circuit, setCircuit] = useState<TougeCircuit | null>(null);

    useEffect(() => {
        const found = allCircuits.find(c => c.id === id);
        if (found) {
            setCircuit(found);
        }
    }, [id]);

    if (!circuit) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <div className="text-zinc-500">Circuit non trouvé...</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-zinc-950 relative overflow-hidden">

            {/* MAP (Full screen) */}
            <div className="absolute inset-0">
                <TougeMapView routePoints={circuit.routePoints} />
            </div>

            {/* HUD - Header */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-4 right-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/touge"
                                className="text-zinc-400 hover:text-yellow-500 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-yellow-500">{circuit.name}</h1>
                                    <span className={`px-2 py-1 text-xs font-bold border ${difficultyColors[circuit.difficulty]}`}>
                                        {circuit.difficulty}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        {circuit.location}
                                    </span>
                                    <span className="text-zinc-700">|</span>
                                    <span>{circuit.country}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HUD - Stats Panel */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-28 right-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 space-y-4 w-72">

                    {/* Distance */}
                    <div className="text-center py-2">
                        <div className="text-5xl font-bold text-yellow-500">{circuit.lengthKm}</div>
                        <div className="text-zinc-500 text-sm">KILOMÈTRES</div>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Description */}
                    <p className="text-zinc-400 text-sm leading-relaxed">{circuit.description}</p>

                    <div className="border-t border-zinc-800" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-800/50 p-3 rounded">
                            <div className="text-zinc-500 text-xs flex items-center gap-1">
                                <RouteIcon size={10} /> Points
                            </div>
                            <div className="text-zinc-100 font-bold">{circuit.routePoints.length}</div>
                        </div>
                        <div className="bg-zinc-800/50 p-3 rounded">
                            <div className="text-zinc-500 text-xs flex items-center gap-1">
                                <Mountain size={10} /> Pays
                            </div>
                            <div className="text-zinc-100 font-bold">{circuit.country}</div>
                        </div>
                        {circuit.record && (
                            <div className="bg-zinc-800/50 p-3 rounded col-span-2">
                                <div className="text-zinc-500 text-xs flex items-center gap-1">
                                    <Clock size={10} /> Record
                                </div>
                                <div className="text-yellow-500 font-bold text-lg">{circuit.record}</div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Coordinates */}
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <Flag size={12} className="text-green-500" />
                            <span className="text-zinc-500">Départ:</span>
                            <span className="text-zinc-300 font-mono">
                                {circuit.routePoints[0][0].toFixed(4)}, {circuit.routePoints[0][1].toFixed(4)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Flag size={12} className="text-red-500" />
                            <span className="text-zinc-500">Arrivée:</span>
                            <span className="text-zinc-300 font-mono">
                                {circuit.routePoints[circuit.routePoints.length - 1][0].toFixed(4)}, {circuit.routePoints[circuit.routePoints.length - 1][1].toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Legend */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-4 left-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded px-4 py-2 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-zinc-400">Départ</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-zinc-400">Arrivée</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-1 bg-yellow-500 rounded"></span>
                        <span className="text-zinc-400">Tracé</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
