"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock, ChevronRight, Route, Eye, Plus } from "lucide-react";
import { motion } from "framer-motion";

// --- TYPES ---
type LatLng = [number, number];

type TougeCircuit = {
    id: string;
    name: string;
    location: string;
    country: string;
    length: string;
    lengthKm: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    record?: string;
    description: string;
    routePoints: LatLng[];
};

const difficultyColors = {
    EASY: "text-toxic-green border-toxic-green bg-toxic-green/10",
    MEDIUM: "text-toxic-cyan border-toxic-cyan bg-toxic-cyan/10",
    HARD: "text-toxic-magenta border-toxic-magenta bg-toxic-magenta/10",
    LEGENDARY: "text-toxic-yellow border-toxic-yellow bg-toxic-yellow/10 animate-pulse",
};

// Storage key matching the Route Builder
const ROUTES_STORAGE_KEY = "projectd_routes";

type UserRoute = {
    id: string;
    name: string;
    points: LatLng[];
    routeGeometry?: LatLng[];
    distance: number;
    createdAt: string;
    type: "DOWNHILL" | "UPHILL" | "MIXED";
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    region: string;
};

export default function TougePage() {
    const [circuits, setCircuits] = useState<TougeCircuit[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [regionFilter, setRegionFilter] = useState<string>("ALL");

    // Load user-created routes from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(ROUTES_STORAGE_KEY);
        if (saved) {
            try {
                const userRoutes: UserRoute[] = JSON.parse(saved);
                // Convert user routes to TougeCircuit format
                const convertedRoutes: TougeCircuit[] = userRoutes.map(route => ({
                    id: `user-${route.id}`,
                    name: route.name.toUpperCase(),
                    location: route.region || "Personnalisé",
                    country: "Mes Créations",
                    length: `${route.distance.toFixed(1)} km`,
                    lengthKm: route.distance,
                    difficulty: route.difficulty,
                    description: `Tracé créé le ${route.createdAt}. Type: ${route.type}.`,
                    routePoints: route.routeGeometry && route.routeGeometry.length > 0
                        ? route.routeGeometry
                        : route.points,
                }));
                setCircuits(convertedRoutes);
            } catch { }
        }
    }, []);

    // Get available regions
    const availableRegions = [...new Set(circuits.map(c => c.location))];

    // Filter circuits by region
    const filteredCircuits = circuits.filter(c =>
        regionFilter === "ALL" || c.location === regionFilter
    );

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-pixel">

            {/* HEADER */}
            <header className="mb-8 border-b-2 border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-toxic-magenta glitch-hover text-shadow-neon">
                    PROJECT D // TOUGE
                </h1>
                <p className="text-zinc-500 mt-2 font-bold tracking-widest">TES TRACÉS PERSONNELS</p>
            </header>

            {/* CREATE NEW BUTTON */}
            <Link
                href="/conquest/builder"
                className="inline-flex items-center gap-3 bg-toxic-green text-black hover:bg-white px-6 py-3 font-bold transition-colors mb-8 hard-border shadow-[0_0_15px_rgba(0,255,65,0.4)]"
            >
                <Plus size={20} />
                CRÉER UN NOUVEAU TOUGE (GPS)
            </Link>

            {/* FILTER - Region (only show if there are routes) */}
            {availableRegions.length > 0 && (
                <div className="flex items-center gap-3 mb-8 bg-zinc-950 border-2 border-zinc-800 p-2 hard-border w-max">
                    <span className="text-zinc-500 text-xs font-bold px-2">RÉGION</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setRegionFilter("ALL")}
                            className={`px-4 py-1.5 text-xs font-bold transition-colors hard-border border-2 ${regionFilter === "ALL"
                                ? "bg-toxic-cyan border-toxic-cyan text-black"
                                : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-500"
                                }`}
                        >
                            TOUS
                        </button>
                        {availableRegions.map((region) => (
                            <button
                                key={region}
                                onClick={() => setRegionFilter(region)}
                                className={`px-4 py-1.5 text-xs font-bold transition-colors hard-border border-2 uppercase ${regionFilter === region
                                    ? "bg-toxic-cyan border-toxic-cyan text-black"
                                    : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-500"
                                    }`}
                            >
                                {region}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* EMPTY STATE */}
            {circuits.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 hard-border bg-zinc-950/50">
                    <Route size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400 mb-2 uppercase">Aucun touge enregistré</h2>
                    <p className="text-zinc-600 mb-6 max-w-md mx-auto font-bold tracking-wide">
                        Crée ton premier touge en utilisant le mode GPS ! Roule sur ta route préférée et le site enregistrera ton tracé en temps réel.
                    </p>
                    <Link
                        href="/conquest/builder"
                        className="inline-flex items-center gap-2 bg-toxic-green text-black hover:bg-white px-6 py-3 font-bold transition-colors hard-border shadow-[0_0_15px_rgba(0,255,65,0.4)]"
                    >
                        <Plus size={20} />
                        CREATE FIRST ROUTE
                    </Link>
                </div>
            ) : (
                <>
                    {/* CIRCUIT LIST */}
                    <div className="space-y-4">
                        {filteredCircuits.map((circuit, index) => (
                            <motion.div
                                key={circuit.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    bg-zinc-950 border-2 border-zinc-800 hard-border
                                    hover:border-toxic-cyan transition-all duration-300
                                    ${selectedId === circuit.id ? "border-toxic-cyan bg-[#050510]" : ""}
                                `}
                            >
                                {/* Main Info - Clickable Header */}
                                <div
                                    onClick={() => setSelectedId(selectedId === circuit.id ? null : circuit.id)}
                                    className="p-4 cursor-pointer"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-600 text-xs w-8 font-bold">#{String(index + 1).padStart(2, "0")}</span>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{circuit.name}</h3>
                                                <div className="flex items-center gap-1 text-zinc-500 text-xs font-bold mt-1 uppercase">
                                                    <MapPin size={12} />
                                                    <span>{circuit.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Length */}
                                            <div className="hidden md:flex items-center gap-2 text-zinc-400 font-bold text-sm">
                                                <Route size={14} />
                                                <span>{circuit.length}</span>
                                            </div>

                                            {/* Difficulty Badge */}
                                            <span className={`
                                                px-3 py-1 text-xs font-bold border-2 hard-border shadow-[0_0_10px_currentColor]
                                                ${difficultyColors[circuit.difficulty]}
                                            `} style={{ opacity: 0.8 }}>
                                                {circuit.difficulty}
                                            </span>

                                            {/* Arrow */}
                                            <ChevronRight
                                                size={20}
                                                className={`
                                                    text-zinc-600 transition-transform duration-300
                                                    ${selectedId === circuit.id ? "rotate-90 text-toxic-cyan" : ""}
                                                `}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedId === circuit.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="px-4 pb-4 pt-0"
                                    >
                                        <div className="border-t-2 border-zinc-800 pt-4 mt-2">
                                            {/* Description */}
                                            <p className="text-zinc-400 text-sm mb-4 font-bold tracking-wide">{circuit.description}</p>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-black border-2 border-zinc-800 p-3 hard-border">
                                                    <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Longueur</div>
                                                    <div className="text-white font-bold text-lg">{circuit.length}</div>
                                                </div>
                                                <div className="bg-black border-2 border-zinc-800 p-3 hard-border">
                                                    <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Points GPS</div>
                                                    <div className="text-white font-bold text-lg">{circuit.routePoints.length}</div>
                                                </div>
                                                {circuit.record && (
                                                    <div className="bg-black border-2 border-zinc-800 p-3 hard-border">
                                                        <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                                                            <Clock size={10} /> Record
                                                        </div>
                                                        <div className="text-toxic-yellow font-bold text-lg">{circuit.record}</div>
                                                    </div>
                                                )}
                                                <div className="bg-black border-2 border-zinc-800 p-3 hard-border">
                                                    <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Difficulté</div>
                                                    <div className={`font-bold text-lg ${difficultyColors[circuit.difficulty].split(" ")[0]}`}>
                                                        {circuit.difficulty}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View Route Button */}
                                            <Link
                                                href={`/touge/${circuit.id}`}
                                                className="inline-flex items-center gap-2 bg-toxic-cyan text-black hover:bg-white px-6 py-3 font-bold transition-colors hard-border w-full justify-center md:w-auto shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                                            >
                                                <Eye size={18} />
                                                ACCESS GPS DATA
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* STATS FOOTER */}
                    <div className="mt-12 pt-6 border-t-2 border-zinc-800 flex flex-wrap gap-8 text-sm font-bold tracking-widest uppercase">
                        <div>
                            <span className="text-zinc-500">Total Tracés:</span>
                            <span className="text-white ml-2">{circuits.length}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500">Distance Totale:</span>
                            <span className="text-toxic-cyan ml-2">
                                {circuits.reduce((acc, c) => acc + c.lengthKm, 0).toFixed(1)} km
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
