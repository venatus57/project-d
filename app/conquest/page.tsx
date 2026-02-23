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
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-pixel">

            {/* HEADER */}
            <header className="mb-12 border-b-2 border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-toxic-magenta glitch-hover text-shadow-neon">
                    PROJECT D // CONQUEST
                </h1>
                <p className="text-zinc-500 mt-2 font-bold tracking-widest">MES TRACÉS PERSONNALISÉS</p>
            </header>

            {/* CREATE NEW BUTTON */}
            <Link
                href="/conquest/builder"
                className="inline-flex items-center gap-3 bg-toxic-green text-black hover:bg-white px-6 py-3 font-bold transition-colors mb-8 hard-border shadow-[0_0_15px_rgba(0,255,65,0.4)] uppercase"
            >
                <Plus size={20} />
                CRÉER UN NOUVEAU TRACÉ
            </Link>

            {/* ROUTES GRID */}
            {routes.length === 0 ? (
                <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-800 p-12 text-center hard-border">
                    <Route size={48} className="mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest mt-2">Aucun tracé enregistré.</p>
                    <p className="text-zinc-600 text-sm mt-2 font-bold">Utilise le Route Builder pour créer ton premier circuit !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map((route, index) => (
                        <motion.div
                            key={route.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-zinc-950 border-2 border-zinc-800 hover:border-toxic-cyan transition-colors group hard-border"
                        >
                            {/* Clickable preview area */}
                            <Link href={`/conquest/detail?id=${route.id}`} className="block">
                                {/* Mini Map Preview Placeholder */}
                                <div className="h-32 bg-black border-b-2 border-zinc-800 relative overflow-hidden cursor-pointer">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Route size={32} className="text-zinc-800 group-hover:text-toxic-cyan transition-colors" />
                                    </div>
                                    {/* Simple path visualization */}
                                    <svg className="absolute inset-0 w-full h-full">
                                        <polyline
                                            fill="none"
                                            stroke="#00ffff"
                                            strokeWidth="2"
                                            strokeOpacity="0.6"
                                            points={route.points.slice(0, 20).map((p, i) => {
                                                const x = 20 + (i * 12);
                                                const y = 60 + Math.sin(i * 0.5) * 20;
                                                return `${x},${y}`;
                                            }).join(" ")}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 bg-toxic-cyan/0 group-hover:bg-toxic-cyan/10 transition-colors flex items-center justify-center">
                                        <span className="opacity-0 group-hover:opacity-100 text-toxic-cyan text-sm font-bold transition-opacity tracking-widest uppercase">
                                            VOIR LE TRACÉ →
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            <div className="p-4">
                                <Link href={`/conquest/detail?id=${route.id}`}>
                                    <h3 className="text-2xl font-bold text-white mb-2 hover:text-toxic-cyan transition-colors cursor-pointer uppercase tracking-wider">
                                        {route.name}
                                    </h3>
                                </Link>

                                <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 mb-4 tracking-widest uppercase">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={12} className="text-toxic-magenta" />
                                        {route.points.length} pts
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Ruler size={12} className="text-toxic-cyan" />
                                        {route.distance.toFixed(2)} km
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} className="text-toxic-yellow" />
                                        {route.createdAt}
                                    </div>
                                </div>

                                <div className="flex gap-2 font-bold tracking-widest uppercase text-sm">
                                    <Link
                                        href={`/conquest/detail?id=${route.id}`}
                                        className="flex-1 bg-toxic-cyan text-black hover:bg-white text-center py-2 transition-colors hard-border shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                    >
                                        VOIR
                                    </Link>
                                    <button
                                        onClick={() => deleteRoute(route.id)}
                                        className="bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black px-4 transition-colors hard-border shadow-[0_0_10px_rgba(239,68,68,0.2)]"
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
