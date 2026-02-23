"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, MapPin, Ruler, Calendar, TrendingDown,
    TrendingUp, Navigation, Mountain, Edit, Trash2
} from "lucide-react";
import { motion } from "framer-motion";

type LatLng = [number, number];

type RouteData = {
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

const STORAGE_KEY = "projectd_routes";

// Map component (client-side only)
const RouteMapView = dynamic(() => import("./RouteMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-500 font-mono animate-pulse">LOADING MAP...</div>
        </div>
    )
});

interface ConquestDetailClientProps {
    id: string;
}

export default function ConquestDetailClient({ id }: ConquestDetailClientProps) {
    const router = useRouter();
    const [route, setRoute] = useState<RouteData | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const routes: RouteData[] = JSON.parse(saved);
                const found = routes.find(r => r.id === id);
                if (found) {
                    setRoute(found);
                }
            } catch { }
        }
    }, [id]);

    const deleteRoute = () => {
        if (!route) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const routes: RouteData[] = JSON.parse(saved);
                const updated = routes.filter(r => r.id !== route.id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                router.push("/conquest");
            } catch { }
        }
    };

    const difficultyColors = {
        EASY: "bg-toxic-green/20 text-toxic-green border-toxic-green shadow-[0_0_10px_rgba(0,255,65,0.2)]",
        MEDIUM: "bg-toxic-cyan/20 text-toxic-cyan border-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]",
        HARD: "bg-toxic-magenta/20 text-toxic-magenta border-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]",
        LEGENDARY: "bg-toxic-yellow/20 text-toxic-yellow border-toxic-yellow shadow-[0_0_10px_rgba(255,255,0,0.2)]",
    };

    const typeIcons = {
        DOWNHILL: TrendingDown,
        UPHILL: TrendingUp,
        MIXED: Navigation,
    };

    if (!route) {
        return (
            <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center font-pixel">
                <div className="text-zinc-500 uppercase font-bold tracking-widest">TRACÉ NON TROUVÉ...</div>
            </div>
        );
    }

    const TypeIcon = typeIcons[route.type];
    const displayPoints = route.routeGeometry && route.routeGeometry.length > 0
        ? route.routeGeometry
        : route.points;

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden font-pixel">

            {/* MAP (Full screen) */}
            <div className="absolute inset-0">
                <RouteMapView
                    points={route.points}
                    routeGeometry={displayPoints}
                />
            </div>

            {/* HUD - Header */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-4 right-4 z-[1000]"
            >
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 hard-border p-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/conquest"
                                className="text-zinc-500 hover:text-toxic-cyan transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-toxic-magenta uppercase tracking-wider text-shadow-neon glitch-hover">{route.name}</h1>
                                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-zinc-500 tracking-widest uppercase">
                                    <span className="flex items-center gap-1">
                                        <Mountain size={14} />
                                        {route.region}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {route.createdAt}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={deleteRoute}
                                className="p-2 bg-black border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black hard-border transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HUD - Stats Panel */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-32 right-4 z-[1000]"
            >
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 hard-border p-4 space-y-4 w-64 shadow-[0_0_20px_rgba(0,0,0,0.8)]">

                    {/* Distance */}
                    <div className="text-center bg-zinc-950 border-2 border-zinc-800 hard-border p-3">
                        <div className="text-4xl font-bold text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.3)]">{route.distance.toFixed(2)}</div>
                        <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mt-1">KILOMÈTRES</div>
                    </div>

                    <div className="border-t-2 border-zinc-800" />

                    {/* Stats */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                <MapPin size={14} className="text-toxic-cyan" /> Waypoints
                            </span>
                            <span className="text-white font-bold text-lg">{route.points.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                <TypeIcon size={14} className="text-toxic-magenta" /> Type
                            </span>
                            <span className="text-white font-bold text-sm tracking-wider uppercase">{route.type}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Difficulté</span>
                            <span className={`px-2 py-1 text-[10px] font-bold border-2 hard-border ${difficultyColors[route.difficulty]}`}>
                                {route.difficulty}
                            </span>
                        </div>
                    </div>

                    <div className="border-t-2 border-zinc-800" />

                    {/* Start/End coordinates */}
                    <div className="space-y-2 text-xs font-bold tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 hard-border bg-toxic-green shadow-[0_0_5px_rgba(0,255,65,0.5)]"></span>
                            <span className="text-zinc-400">
                                {route.points[0][0].toFixed(4)}, {route.points[0][1].toFixed(4)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 hard-border bg-toxic-magenta shadow-[0_0_5px_rgba(255,0,255,0.5)]"></span>
                            <span className="text-zinc-400">
                                {route.points[route.points.length - 1][0].toFixed(4)}, {route.points[route.points.length - 1][1].toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
