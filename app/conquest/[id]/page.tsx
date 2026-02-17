"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function RouteViewPage() {
    const params = useParams();
    const router = useRouter();
    const [route, setRoute] = useState<RouteData | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const routes: RouteData[] = JSON.parse(saved);
                const found = routes.find(r => r.id === params.id);
                if (found) {
                    setRoute(found);
                }
            } catch { }
        }
    }, [params.id]);

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
        EASY: "bg-green-500/20 text-green-500 border-green-500",
        MEDIUM: "bg-blue-500/20 text-blue-500 border-blue-500",
        HARD: "bg-orange-500/20 text-orange-500 border-orange-500",
        LEGENDARY: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
    };

    const typeIcons = {
        DOWNHILL: TrendingDown,
        UPHILL: TrendingUp,
        MIXED: Navigation,
    };

    if (!route) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
                <div className="text-zinc-500">Tracé non trouvé...</div>
            </div>
        );
    }

    const TypeIcon = typeIcons[route.type];
    const displayPoints = route.routeGeometry && route.routeGeometry.length > 0
        ? route.routeGeometry
        : route.points;

    return (
        <div className="h-screen w-full bg-zinc-950 relative overflow-hidden">

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
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/conquest"
                                className="text-zinc-400 hover:text-yellow-500 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-yellow-500">{route.name}</h1>
                                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
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
                                className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded transition-colors"
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
                className="absolute top-28 right-4 z-[1000]"
            >
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 space-y-4 w-64">

                    {/* Distance */}
                    <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-500">{route.distance.toFixed(2)}</div>
                        <div className="text-zinc-500 text-sm">KILOMÈTRES</div>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Stats */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-sm flex items-center gap-2">
                                <MapPin size={14} /> Waypoints
                            </span>
                            <span className="text-zinc-100 font-bold">{route.points.length}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-sm flex items-center gap-2">
                                <TypeIcon size={14} /> Type
                            </span>
                            <span className="text-zinc-100 font-bold">{route.type}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-sm">Difficulté</span>
                            <span className={`px-2 py-1 text-xs font-bold rounded border ${difficultyColors[route.difficulty]}`}>
                                {route.difficulty}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Start/End coordinates */}
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span className="text-zinc-400">
                                {route.points[0][0].toFixed(4)}, {route.points[0][1].toFixed(4)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
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
