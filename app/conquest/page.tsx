"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MapPin, Ruler, Trash2, Calendar, Route } from "lucide-react";
import { motion } from "framer-motion";

type RouteData = {
    id: string;
    name: string;
    points: [number, number][];
    distance: number;
    createdAt: string;
};

const STORAGE_KEY = "projectd_routes";

export default function ConquestPage() {
    const [routes, setRoutes] = useState<RouteData[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setRoutes(JSON.parse(saved)); } catch { }
        }
    }, []);

    const deleteRoute = (id: string) => {
        const updated = routes.filter(r => r.id !== id);
        setRoutes(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* HEADER */}
            <header className="mb-12 border-b border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                    PROJECT D // CONQUEST
                </h1>
                <p className="text-zinc-500 mt-2">MES TRACÉS PERSONNALISÉS</p>
            </header>

            {/* CREATE NEW BUTTON */}
            <Link
                href="/conquest/builder"
                className="inline-flex items-center gap-3 bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 font-bold transition-colors mb-8"
            >
                <Plus size={20} />
                CRÉER UN NOUVEAU TRACÉ
            </Link>

            {/* ROUTES GRID */}
            {routes.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 p-12 text-center">
                    <Route size={48} className="mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Aucun tracé enregistré.</p>
                    <p className="text-zinc-600 text-sm mt-2">Utilise le Route Builder pour créer ton premier circuit !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route, index) => (
                        <motion.div
                            key={route.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-zinc-900/50 border border-zinc-800 hover:border-yellow-500/50 transition-colors group"
                        >
                            {/* Clickable preview area */}
                            <Link href={`/conquest/${route.id}`} className="block">
                                {/* Mini Map Preview Placeholder */}
                                <div className="h-32 bg-zinc-800 relative overflow-hidden cursor-pointer">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Route size={32} className="text-zinc-700 group-hover:text-yellow-500/50 transition-colors" />
                                    </div>
                                    {/* Simple path visualization */}
                                    <svg className="absolute inset-0 w-full h-full">
                                        <polyline
                                            fill="none"
                                            stroke="#facc15"
                                            strokeWidth="2"
                                            strokeOpacity="0.6"
                                            points={route.points.slice(0, 20).map((p, i) => {
                                                const x = 20 + (i * 12);
                                                const y = 60 + Math.sin(i * 0.5) * 20;
                                                return `${x},${y}`;
                                            }).join(" ")}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/5 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 text-yellow-500 text-sm font-bold transition-opacity">
                                            VOIR LE TRACÉ →
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            <div className="p-4">
                                <Link href={`/conquest/${route.id}`}>
                                    <h3 className="text-lg font-bold text-zinc-100 mb-2 hover:text-yellow-500 transition-colors cursor-pointer">
                                        {route.name}
                                    </h3>
                                </Link>

                                <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} className="text-yellow-500" />
                                        {route.points.length} pts
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Ruler size={14} className="text-yellow-500" />
                                        {route.distance.toFixed(2)} km
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {route.createdAt}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/conquest/${route.id}`}
                                        className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 text-center py-2 text-sm font-bold transition-colors"
                                    >
                                        VOIR
                                    </Link>
                                    <button
                                        onClick={() => deleteRoute(route.id)}
                                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
