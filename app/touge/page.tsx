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
    EASY: "text-green-500 border-green-500/30 bg-green-500/10",
    MEDIUM: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    HARD: "text-orange-500 border-orange-500/30 bg-orange-500/10",
    LEGENDARY: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* HEADER */}
            <header className="mb-8 border-b border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                    PROJECT D // TOUGE
                </h1>
                <p className="text-zinc-500 mt-2">TES TRACÉS PERSONNELS</p>
            </header>

            {/* CREATE NEW BUTTON */}
            <Link
                href="/conquest/builder"
                className="inline-flex items-center gap-3 bg-green-500 text-black hover:bg-green-400 px-6 py-3 font-bold transition-colors mb-8"
            >
                <Plus size={20} />
                CRÉER UN NOUVEAU TOUGE (GPS)
            </Link>

            {/* FILTER - Region (only show if there are routes) */}
            {availableRegions.length > 0 && (
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-zinc-500 text-xs">RÉGION</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setRegionFilter("ALL")}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${regionFilter === "ALL"
                                ? "bg-yellow-500 text-black"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                }`}
                        >
                            TOUS
                        </button>
                        {availableRegions.map((region) => (
                            <button
                                key={region}
                                onClick={() => setRegionFilter(region)}
                                className={`px-3 py-1.5 text-xs font-bold transition-colors rounded ${regionFilter === region
                                    ? "bg-yellow-500 text-black"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
                    <Route size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400 mb-2">Aucun touge enregistré</h2>
                    <p className="text-zinc-600 mb-6 max-w-md mx-auto">
                        Crée ton premier touge en utilisant le mode GPS ! Roule sur ta route préférée et le site enregistrera ton tracé en temps réel.
                    </p>
                    <Link
                        href="/conquest/builder"
                        className="inline-flex items-center gap-2 bg-green-500 text-black hover:bg-green-400 px-6 py-3 font-bold transition-colors"
                    >
                        <Plus size={20} />
                        CRÉER MON PREMIER TOUGE
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
                                    bg-zinc-900/50 border border-zinc-800
                                    hover:border-yellow-500/50 transition-all duration-300
                                    ${selectedId === circuit.id ? "border-yellow-500" : ""}
                                `}
                            >
                                {/* Main Info - Clickable Header */}
                                <div
                                    onClick={() => setSelectedId(selectedId === circuit.id ? null : circuit.id)}
                                    className="p-4 cursor-pointer"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-600 text-xs w-8">#{String(index + 1).padStart(2, "0")}</span>
                                            <div>
                                                <h3 className="text-xl font-bold text-zinc-100">{circuit.name}</h3>
                                                <div className="flex items-center gap-1 text-zinc-500 text-sm mt-1">
                                                    <MapPin size={12} />
                                                    <span>{circuit.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Length */}
                                            <div className="hidden md:flex items-center gap-2 text-zinc-500 text-sm">
                                                <Route size={14} />
                                                <span>{circuit.length}</span>
                                            </div>

                                            {/* Difficulty Badge */}
                                            <span className={`
                                                px-2 py-1 text-xs font-bold border
                                                ${difficultyColors[circuit.difficulty]}
                                            `}>
                                                {circuit.difficulty}
                                            </span>

                                            {/* Arrow */}
                                            <ChevronRight
                                                size={20}
                                                className={`
                                                    text-zinc-600 transition-transform duration-300
                                                    ${selectedId === circuit.id ? "rotate-90 text-yellow-500" : ""}
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
                                        <div className="border-t border-zinc-800 pt-4">
                                            {/* Description */}
                                            <p className="text-zinc-400 text-sm mb-4">{circuit.description}</p>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-zinc-800/50 p-3 rounded">
                                                    <div className="text-zinc-500 text-xs">Longueur</div>
                                                    <div className="text-zinc-100 font-bold">{circuit.length}</div>
                                                </div>
                                                <div className="bg-zinc-800/50 p-3 rounded">
                                                    <div className="text-zinc-500 text-xs">Points GPS</div>
                                                    <div className="text-zinc-100 font-bold">{circuit.routePoints.length}</div>
                                                </div>
                                                {circuit.record && (
                                                    <div className="bg-zinc-800/50 p-3 rounded">
                                                        <div className="text-zinc-500 text-xs flex items-center gap-1">
                                                            <Clock size={10} /> Record
                                                        </div>
                                                        <div className="text-yellow-500 font-bold">{circuit.record}</div>
                                                    </div>
                                                )}
                                                <div className="bg-zinc-800/50 p-3 rounded">
                                                    <div className="text-zinc-500 text-xs">Difficulté</div>
                                                    <div className={`font-bold ${difficultyColors[circuit.difficulty].split(" ")[0]}`}>
                                                        {circuit.difficulty}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View Route Button */}
                                            <Link
                                                href={`/touge/${circuit.id}`}
                                                className="inline-flex items-center gap-2 bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 font-bold transition-colors"
                                            >
                                                <Eye size={18} />
                                                VOIR LE TRACÉ SUR LA CARTE
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* STATS FOOTER */}
                    <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-wrap gap-8 text-sm">
                        <div>
                            <span className="text-zinc-500">Total Tracés:</span>
                            <span className="text-zinc-100 font-bold ml-2">{circuits.length}</span>
                        </div>
                        <div>
                            <span className="text-zinc-500">Distance Totale:</span>
                            <span className="text-yellow-500 font-bold ml-2">
                                {circuits.reduce((acc, c) => acc + c.lengthKm, 0).toFixed(1)} km
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
