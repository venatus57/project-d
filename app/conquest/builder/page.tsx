"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    Pencil, Upload, Save, Undo2, RotateCcw, MapPin,
    Ruler, FileDown, ChevronLeft, ChevronRight,
    TrendingDown, TrendingUp, Gauge, Navigation, Flag, Route, Zap,
    Disc, StopCircle, Navigation2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
type LatLng = [number, number];

type RouteData = {
    id: string;
    name: string;
    points: LatLng[];
    routeGeometry: LatLng[]; // Points interpolés suivant la route
    distance: number;
    createdAt: string;
    type: "DOWNHILL" | "UPHILL" | "MIXED";
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    region: string;
};

type RegionPreset = {
    name: string;
    center: LatLng;
    zoom: number;
    category?: string;
};

// Cols et routes mythiques de France 🇫🇷
const REGION_PRESETS: RegionPreset[] = [
    // === ALPES ===
    { name: "Col du Galibier", center: [45.0642, 6.4078], zoom: 14, category: "Alpes" },
    { name: "Col de l'Iseran", center: [45.4167, 7.0306], zoom: 14, category: "Alpes" },
    { name: "Col de la Bonette", center: [44.3261, 6.8072], zoom: 14, category: "Alpes" },
    { name: "Col du Lautaret", center: [45.0356, 6.4039], zoom: 13, category: "Alpes" },
    { name: "Col de l'Izoard", center: [44.8203, 6.7344], zoom: 14, category: "Alpes" },
    { name: "Col du Telegraphe", center: [45.2031, 6.4436], zoom: 14, category: "Alpes" },
    { name: "Alpe d'Huez", center: [45.0922, 6.0703], zoom: 13, category: "Alpes" },
    { name: "Col de la Croix de Fer", center: [45.2264, 6.2047], zoom: 14, category: "Alpes" },

    // === ALPES-MARITIMES / CÔTE D'AZUR ===
    { name: "Col de Turini", center: [43.9797, 7.3917], zoom: 14, category: "Côte d'Azur" },
    { name: "Col de la Bonette-Restefond", center: [44.3261, 6.8072], zoom: 13, category: "Côte d'Azur" },
    { name: "Col de Vence", center: [43.7567, 7.0667], zoom: 14, category: "Côte d'Azur" },
    { name: "Route Napoléon", center: [43.8333, 6.8833], zoom: 11, category: "Côte d'Azur" },
    { name: "Gorges du Verdon", center: [43.7500, 6.3333], zoom: 12, category: "Côte d'Azur" },
    { name: "Col de Braus", center: [43.8667, 7.3833], zoom: 14, category: "Côte d'Azur" },

    // === PROVENCE ===
    { name: "Mont Ventoux", center: [44.1736, 5.2789], zoom: 13, category: "Provence" },
    { name: "Col de la Cayolle", center: [44.2583, 6.7458], zoom: 14, category: "Provence" },

    // === PYRÉNÉES ===
    { name: "Col du Tourmalet", center: [42.9083, -0.1456], zoom: 14, category: "Pyrénées" },
    { name: "Col d'Aubisque", center: [42.9714, -0.3397], zoom: 14, category: "Pyrénées" },
    { name: "Col du Soulor", center: [42.9597, -0.3083], zoom: 14, category: "Pyrénées" },
    { name: "Col de Peyresourde", center: [42.7969, 0.4492], zoom: 14, category: "Pyrénées" },
    { name: "Col du Portet d'Aspet", center: [42.9297, 0.8742], zoom: 14, category: "Pyrénées" },
    { name: "Col de Vars", center: [44.5381, 6.7028], zoom: 14, category: "Pyrénées" },

    // === VOSGES ===
    { name: "Col de la Schlucht", center: [48.0631, 7.0228], zoom: 14, category: "Vosges" },
    { name: "Grand Ballon", center: [47.9019, 7.0989], zoom: 13, category: "Vosges" },
    { name: "Col du Ballon d'Alsace", center: [47.8208, 6.8372], zoom: 14, category: "Vosges" },

    // === MASSIF CENTRAL ===
    { name: "Puy de Dôme", center: [45.7725, 2.9644], zoom: 13, category: "Massif Central" },
    { name: "Col du Pas de Peyrol", center: [45.1094, 2.6817], zoom: 14, category: "Massif Central" },

    // === ÎLE-DE-FRANCE & ENVIRONS ===
    { name: "Forêt de Fontainebleau", center: [48.4047, 2.6989], zoom: 12, category: "Île-de-France" },
    { name: "Forêt de Rambouillet", center: [48.6439, 1.8250], zoom: 12, category: "Île-de-France" },
    { name: "Vallée de Chevreuse", center: [48.7072, 2.0347], zoom: 13, category: "Île-de-France" },
    { name: "Routes du Vexin", center: [49.1000, 1.7500], zoom: 12, category: "Île-de-France" },
    { name: "Forêt de Compiègne", center: [49.3833, 2.9000], zoom: 12, category: "Île-de-France" },
    { name: "Côtes de Beaune (Bourgogne)", center: [47.0167, 4.8333], zoom: 12, category: "Île-de-France" },
];

// Dynamically import the map component (Leaflet requires browser)
const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-500 font-mono animate-pulse">LOADING MAP...</div>
        </div>
    )
});

// Storage key
const STORAGE_KEY = "projectd_routes";

// OSRM API for road routing
async function getRouteFromOSRM(waypoints: LatLng[]): Promise<{ geometry: LatLng[]; distance: number } | null> {
    if (waypoints.length < 2) return null;

    // Format: lon,lat;lon,lat;...
    const coords = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
            const route = data.routes[0];
            // Convert GeoJSON coordinates [lon, lat] to LatLng [lat, lon]
            const geometry: LatLng[] = route.geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]] as LatLng
            );
            return {
                geometry,
                distance: route.distance / 1000 // Convert m to km
            };
        }
    } catch (error) {
        console.error('OSRM routing error:', error);
    }
    return null;
}

export default function RouteBuilderPage() {
    const router = useRouter();

    // États
    const [mode, setMode] = useState<"DRAW" | "IMPORT" | "TRACK">("DRAW");
    const [waypoints, setWaypoints] = useState<LatLng[]>([]); // Points cliqués par l'user
    const [routeGeometry, setRouteGeometry] = useState<LatLng[]>([]); // Route calculée
    const [routeName, setRouteName] = useState("");
    const [distance, setDistance] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [savedRoutes, setSavedRoutes] = useState<RouteData[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [snapToRoad, setSnapToRoad] = useState(true); // Active par défaut

    // GPS Tracking states
    const [isRecording, setIsRecording] = useState(false);
    const [gpsTrack, setGpsTrack] = useState<LatLng[]>([]);
    const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Nouveaux états pour améliorer le processus
    const [routeType, setRouteType] = useState<"DOWNHILL" | "UPHILL" | "MIXED">("DOWNHILL");
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "LEGENDARY">("MEDIUM");
    const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGION_PRESETS[0]);
    const [selectedCategory, setSelectedCategory] = useState<string>("Alpes");
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Catégories uniques
    const categories = [...new Set(REGION_PRESETS.map(r => r.category).filter(Boolean))] as string[];

    // Régions filtrées par catégorie
    const filteredRegions = REGION_PRESETS.filter(r => r.category === selectedCategory);

    // Charger routes existantes
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setSavedRoutes(JSON.parse(saved)); } catch { }
        }
    }, []);

    // Calculer la route quand les waypoints changent
    useEffect(() => {
        const calculateRoute = async () => {
            if (waypoints.length < 2) {
                setRouteGeometry([]);
                setDistance(0);
                return;
            }

            if (snapToRoad) {
                setIsCalculating(true);
                const result = await getRouteFromOSRM(waypoints);
                setIsCalculating(false);

                if (result) {
                    setRouteGeometry(result.geometry);
                    setDistance(result.distance);
                } else {
                    // Fallback: ligne droite
                    setRouteGeometry(waypoints);
                    setDistance(calculateStraightDistance(waypoints));
                }
            } else {
                setRouteGeometry(waypoints);
                setDistance(calculateStraightDistance(waypoints));
            }
        };

        calculateRoute();
    }, [waypoints, snapToRoad]);

    // Calcul distance en ligne droite (Haversine)
    const calculateStraightDistance = (pts: LatLng[]): number => {
        if (pts.length < 2) return 0;

        let total = 0;
        for (let i = 1; i < pts.length; i++) {
            const [lat1, lon1] = pts[i - 1];
            const [lat2, lon2] = pts[i];

            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            total += R * c;
        }
        return total;
    };

    // Ajouter un waypoint
    const addWaypoint = useCallback((latlng: LatLng) => {
        setWaypoints(prev => [...prev, latlng]);
    }, []);

    // Annuler dernier point
    const undoLastWaypoint = () => {
        if (waypoints.length === 0) return;
        setWaypoints(prev => prev.slice(0, -1));
    };

    // Reset
    const resetRoute = () => {
        setWaypoints([]);
        setRouteGeometry([]);
        setDistance(0);
    };

    // Reset complet
    const fullReset = () => {
        resetRoute();
        setRouteName("");
        setRouteType("DOWNHILL");
        setDifficulty("MEDIUM");
        setStep(1);
        // Also reset GPS tracking
        setGpsTrack([]);
        setCurrentPosition(null);
        setGpsError(null);
    };

    // === GPS TRACKING FUNCTIONS ===

    // Start GPS tracking with high accuracy
    const startGpsTracking = () => {
        if (!navigator.geolocation) {
            setGpsError("La géolocalisation n'est pas supportée par ce navigateur.");
            return;
        }

        setGpsError(null);
        setGpsTrack([]);
        setIsRecording(true);

        // High accuracy options for optimal precision
        const options: PositionOptions = {
            enableHighAccuracy: true, // Use GPS if available
            timeout: 10000, // Wait up to 10s for position
            maximumAge: 0 // Don't use cached position
        };

        // Success callback - called on each position update
        const onSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            const newPoint: LatLng = [latitude, longitude];

            setCurrentPosition(newPoint);
            setGpsAccuracy(accuracy);

            // Add point to track (filter out duplicates)
            setGpsTrack(prev => {
                if (prev.length === 0) return [newPoint];

                const lastPoint = prev[prev.length - 1];
                // Only add if moved more than 3 meters (to avoid GPS noise)
                const distance = calculatePointDistance(lastPoint, newPoint);
                if (distance > 0.003) { // ~3 meters
                    return [...prev, newPoint];
                }
                return prev;
            });
        };

        // Error callback
        const onError = (error: GeolocationPositionError) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setGpsError("Permission GPS refusée. Autorise l'accès à ta position.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setGpsError("Position GPS indisponible.");
                    break;
                case error.TIMEOUT:
                    setGpsError("Délai dépassé pour obtenir la position.");
                    break;
            }
            setIsRecording(false);
        };

        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    };

    // Stop GPS tracking
    const stopGpsTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsRecording(false);

        // Convert GPS track to waypoints
        if (gpsTrack.length >= 2) {
            setWaypoints(gpsTrack);
            setRouteGeometry(gpsTrack);
            setDistance(calculateStraightDistance(gpsTrack));
            setSnapToRoad(false); // Force line-of-sight to prevent OSRM crash on dense tracks
            setStep(3); // Move directly to naming step
        }
    };

    // Calculate distance between two points in km
    const calculatePointDistance = (p1: LatLng, p2: LatLng): number => {
        const R = 6371;
        const dLat = (p2[0] - p1[0]) * Math.PI / 180;
        const dLon = (p2[1] - p1[1]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Cleanup GPS tracking on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // Sauvegarder
    const saveRoute = () => {
        if (waypoints.length < 2 || !routeName.trim()) return;

        const newRoute: RouteData = {
            id: Date.now().toString(),
            name: routeName,
            points: waypoints,
            routeGeometry,
            distance,
            createdAt: new Date().toISOString().split('T')[0],
            type: routeType,
            difficulty,
            region: selectedRegion.name,
        };

        const updated = [...savedRoutes, newRoute];
        setSavedRoutes(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        fullReset();
        router.push("/conquest");
    };

    // GPX Import
    const handleGPXUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fakePoints: LatLng[] = [
            [43.9797, 7.3917],
            [43.9820, 7.3950],
            [43.9850, 7.4000],
            [43.9880, 7.4050],
        ];
        setWaypoints(fakePoints);
        setRouteName(file.name.replace(".gpx", ""));
        setStep(3);
    };

    const difficultyColors = {
        EASY: "text-toxic-green border-toxic-green",
        MEDIUM: "text-toxic-cyan border-toxic-cyan",
        HARD: "text-toxic-magenta border-toxic-magenta",
        LEGENDARY: "text-toxic-yellow border-toxic-yellow",
    };

    return (
        <div className="h-[calc(100vh-3.5rem)] w-full bg-black relative overflow-hidden font-pixel">

            {/* MAP (Full screen) */}
            <div className="absolute inset-0">
                <MapComponent
                    waypoints={waypoints}
                    routeGeometry={routeGeometry}
                    onMapClick={mode === "DRAW" && step >= 2 ? addWaypoint : undefined}
                    center={selectedRegion.center}
                    zoom={selectedRegion.zoom}
                    userLocation={currentPosition}
                />
            </div>

            {/* HUD OVERLAY - Top Left */}
            <div className="absolute top-6 left-6 z-[1000] pointer-events-none drop-shadow-md">
                <h1 className="text-xl font-bold text-white tracking-widest uppercase glitch-hover flex flex-col gap-1">
                    <span className="text-zinc-500 text-[10px] tracking-widest">PROJECT D // SYSTEM</span>
                    <span>ROUTE BUILDER_</span>
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-toxic-cyan text-[10px] uppercase">STATUS:</span>
                    <span className="text-white text-[10px] uppercase">{mode} MODE - STAGE {step}</span>
                </div>
            </div>

            {/* HUD OVERLAY - Stats */}
            <div className="absolute top-6 right-6 z-[1000] text-right pointer-events-none drop-shadow-md">
                <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-2">{selectedRegion.name}</div>
                <div className="flex justify-end items-center gap-2 text-sm font-bold tracking-widest uppercase">
                    <span className="text-zinc-500">WPT_</span>
                    <span className="text-white">{waypoints.length}</span>
                </div>
                <div className="flex justify-end items-center gap-2 text-sm font-bold tracking-widest uppercase">
                    <span className="text-zinc-500">DST_</span>
                    <span className="text-white">
                        {isCalculating ? "CALC..." : `${distance.toFixed(2)} KM`}
                    </span>
                </div>
                {snapToRoad && mode === "DRAW" && (
                    <div className="text-toxic-green text-[10px] font-bold tracking-widest uppercase mt-2">
                        OSRM_SNAP_ACTIVE
                    </div>
                )}
            </div>

            {/* GPS RECENTER BUTTON */}
            <button
                onClick={() => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const newLoc: LatLng = [position.coords.latitude, position.coords.longitude];
                                setCurrentPosition(newLoc);
                                setSelectedRegion((prev) => ({
                                    ...prev,
                                    center: newLoc,
                                    zoom: 15
                                }));
                            },
                            (error) => console.error("GPS Error", error),
                            { enableHighAccuracy: true }
                        );
                    }
                }}
                className="absolute bottom-6 right-6 z-[1000] bg-black/40 border-[1px] border-zinc-800 p-3 text-toxic-cyan hover:bg-toxic-cyan hover:text-black transition-colors backdrop-blur-sm drop-shadow-md flex items-center justify-center gap-2"
                title="Centrer sur ma position"
            >
                <Navigation2 size={16} />
                <span className="text-[10px] uppercase font-bold tracking-widest hidden md:inline-block">[ LOCATE ]</span>
            </button>

            {/* SIDE PANEL */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        initial={{ x: -400 }}
                        animate={{ x: 0 }}
                        exit={{ x: -400 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-14 md:top-20 left-0 md:left-4 bottom-0 md:bottom-4 w-full md:w-[340px] z-[1000] flex flex-col p-4 md:p-0"
                    >
                        <div className="bg-black/95 backdrop-blur-md border-2 border-zinc-800 hard-border flex-1 flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]">

                            {/* Mobile Close Button (inside panel) */}
                            <button
                                onClick={() => setIsPanelOpen(false)}
                                className="md:hidden w-full py-3 bg-red-500/10 border-b-2 border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest text-center hover:bg-red-500 hover:text-black transition-colors"
                            >
                                ↓ FERMER LE PANNEAU ↓
                            </button>

                            {/* Mode Tabs */}
                            <div className="flex border-b-2 border-zinc-800">
                                <button
                                    onClick={() => { setMode("DRAW"); setStep(1); }}
                                    className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${mode === "DRAW"
                                        ? "bg-toxic-cyan/20 text-toxic-cyan border-b-2 border-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Pencil size={14} /> TRACER
                                </button>
                                <button
                                    onClick={() => { setMode("TRACK"); setStep(1); fullReset(); }}
                                    className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${mode === "TRACK"
                                        ? "bg-toxic-green/20 text-toxic-green border-b-2 border-toxic-green shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Navigation2 size={14} /> GPS
                                </button>
                                <button
                                    onClick={() => { setMode("IMPORT"); setStep(1); }}
                                    className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-bold tracking-widest uppercase transition-colors ${mode === "IMPORT"
                                        ? "bg-toxic-magenta/20 text-toxic-magenta border-b-2 border-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Upload size={14} /> IMPORT
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">

                                {/* STEP 1: Configuration */}
                                {step === 1 && mode === "DRAW" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-toxic-cyan font-bold tracking-widest uppercase text-[10px]">
                                            {"// STAGE 1 : ROUTE CONF"}
                                        </div>

                                        {/* Région */}
                                        <div>
                                            <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase">RÉGION</label>

                                            {/* Category Tabs */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`px-3 py-1.5 text-xs font-bold transition-colors hard-border border-2 ${selectedCategory === cat
                                                            ? "bg-toxic-cyan text-black border-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                                                            : "bg-black text-zinc-500 border-zinc-800 hover:border-zinc-500"
                                                            } uppercase tracking-wider`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Cols in selected category */}
                                            <div className="bg-black border-2 border-zinc-800 hard-border p-2 max-h-40 overflow-y-auto space-y-1">
                                                {filteredRegions.map((region) => (
                                                    <button
                                                        key={region.name}
                                                        onClick={() => setSelectedRegion(region)}
                                                        className={`w-full text-left p-2 text-xs font-bold transition-colors flex items-center justify-between hard-border border-2 uppercase tracking-wide ${selectedRegion.name === region.name
                                                            ? "bg-toxic-cyan/20 border-toxic-cyan text-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                                            : "border-transparent hover:border-zinc-800 text-zinc-400"
                                                            }`}
                                                    >
                                                        <span>{region.name}</span>
                                                        {selectedRegion.name === region.name && (
                                                            <span className="text-toxic-cyan">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mode Snap to Road */}
                                        <div>
                                            <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase">MODE TRACÉ</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSnapToRoad(true)}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-3 font-bold border-2 hard-border transition-colors uppercase tracking-widest ${snapToRoad
                                                        ? "bg-toxic-green/20 border-toxic-green text-toxic-green shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                                                        : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-500"
                                                        }`}
                                                >
                                                    <Route size={16} />
                                                    <span className="text-xs font-bold">SUIVRE LA ROUTE</span>
                                                </button>
                                                <button
                                                    onClick={() => setSnapToRoad(false)}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-3 font-bold border-2 hard-border transition-colors uppercase tracking-widest ${!snapToRoad
                                                        ? "bg-toxic-yellow/20 border-toxic-yellow text-toxic-yellow shadow-[0_0_10px_rgba(255,255,0,0.2)]"
                                                        : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-500"
                                                        }`}
                                                >
                                                    <Zap size={16} />
                                                    <span className="text-xs font-bold">LIGNE DROITE</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase">TYPE</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: "DOWNHILL", label: "DESCENTE", icon: TrendingDown },
                                                    { value: "UPHILL", label: "MONTÉE", icon: TrendingUp },
                                                    { value: "MIXED", label: "MIXTE", icon: Navigation },
                                                ].map((t) => (
                                                    <button
                                                        key={t.value}
                                                        onClick={() => setRouteType(t.value as typeof routeType)}
                                                        className={`flex-1 flex flex-col items-center gap-1 p-3 font-bold border-2 hard-border transition-colors uppercase tracking-widest ${routeType === t.value
                                                            ? "bg-toxic-magenta/20 border-toxic-magenta text-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                                                            : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-500"
                                                            }`}
                                                    >
                                                        <t.icon size={18} />
                                                        <span className="text-xs font-bold">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Difficulté */}
                                        <div>
                                            <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase">DIFFICULTÉ</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {(["EASY", "MEDIUM", "HARD", "LEGENDARY"] as const).map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDifficulty(d)}
                                                        className={`p-2 text-xs font-bold border-2 hard-border transition-colors uppercase tracking-widest ${difficulty === d
                                                            ? `bg-opacity-20 ${difficultyColors[d]} bg-current shadow-[0_0_10px_currentColor]`
                                                            : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-500"
                                                            }`}
                                                    >
                                                        {d.slice(0, 4)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full border-[1px] border-toxic-cyan text-toxic-cyan hover:bg-toxic-cyan hover:text-black py-3 text-[10px] font-bold mt-4 transition-colors uppercase tracking-widest"
                                        >
                                            [ CONFIRM SETTINGS ]
                                        </button>
                                    </motion.div>
                                )}

                                {/* === GPS TRACK MODE === */}
                                {mode === "TRACK" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-toxic-green font-bold tracking-widest uppercase text-[10px]">
                                            {"// GPS TELEMETRY"}
                                        </div>

                                        <div className="border-[1px] border-toxic-green/30 bg-black/40 p-3 text-[10px] text-toxic-green tracking-widest uppercase">
                                            <p className="font-bold mb-1">WARNING // LIVE TRACKING</p>
                                            <p className="text-zinc-400">Press start and begin driving. Trajectory is recorded locally via device sensors.</p>
                                        </div>

                                        {/* GPS Error */}
                                        {gpsError && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-400">
                                                ⚠️ {gpsError}
                                            </div>
                                        )}

                                        {/* Recording Status */}
                                        {isRecording && (
                                            <div className="space-y-3">
                                                {/* Recording Indicator */}
                                                <div className="flex items-center gap-3 bg-zinc-900 border border-green-500 rounded p-4">
                                                    <div className="relative">
                                                        <Disc size={24} className="text-red-500 animate-pulse" />
                                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                                                    </div>
                                                    <div>
                                                        <div className="text-red-500 font-bold text-sm">ENREGISTREMENT EN COURS</div>
                                                        <div className="text-zinc-500 text-xs">Roule pour tracer ton touge !</div>
                                                    </div>
                                                </div>

                                                {/* Live Stats */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-zinc-800/50 p-3 rounded text-center">
                                                        <div className="text-2xl font-bold text-green-500">{gpsTrack.length}</div>
                                                        <div className="text-zinc-500 text-xs">Points</div>
                                                    </div>
                                                    <div className="bg-zinc-800/50 p-3 rounded text-center">
                                                        <div className="text-2xl font-bold text-yellow-500">{calculateStraightDistance(gpsTrack).toFixed(2)}</div>
                                                        <div className="text-zinc-500 text-xs">km</div>
                                                    </div>
                                                    <div className="bg-zinc-800/50 p-3 rounded text-center">
                                                        <div className="text-2xl font-bold text-blue-500">{gpsAccuracy.toFixed(0)}</div>
                                                        <div className="text-zinc-500 text-xs">Précision (m)</div>
                                                    </div>
                                                </div>

                                                {/* Current Position */}
                                                {currentPosition && (
                                                    <div className="text-xs text-zinc-500 font-mono text-center">
                                                        📍 {currentPosition[0].toFixed(6)}, {currentPosition[1].toFixed(6)}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Start/Stop Button */}
                                        {!isRecording ? (
                                            <button
                                                onClick={startGpsTracking}
                                                className="w-full border-[1px] border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-black font-bold text-[10px] py-3 uppercase tracking-widest transition-colors"
                                            >
                                                [ INIT TELEMETRY ]
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopGpsTracking}
                                                disabled={gpsTrack.length < 2}
                                                className="w-full border-[1px] border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold text-[10px] py-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-colors"
                                            >
                                                [ STOP RUN - Pts: {gpsTrack.length} ]
                                            </button>
                                        )}

                                        {/* Info */}
                                        <div className="text-zinc-600 text-xs space-y-1">
                                            <p>💡 <strong>Conseils pour une meilleure précision :</strong></p>
                                            <ul className="list-disc ml-4 space-y-0.5">
                                                <li>Active le GPS haute précision sur ton téléphone</li>
                                                <li>Autorise l'accès à la position en "précis"</li>
                                                <li>Attends que la précision soit &lt; 10m avant de démarrer</li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: Tracer */}
                                {step === 2 && mode === "DRAW" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-toxic-yellow font-bold tracking-widest uppercase text-[10px]">
                                            {"// STAGE 2 : MAP WAYPOINTS"}
                                        </div>

                                        {snapToRoad ? (
                                            <div className="border-[1px] border-toxic-green/30 bg-black/40 p-3 text-[10px] text-toxic-green tracking-widest uppercase">
                                                <p className="font-bold mb-1">OSRM SNAP TO ROAD // ONLINE</p>
                                                <p className="text-zinc-400">Algorithm is routing between waypoints.</p>
                                            </div>
                                        ) : (
                                            <div className="border-[1px] border-zinc-700/50 bg-black/40 p-3 text-[10px] text-zinc-400 tracking-widest uppercase">
                                                <p className="font-bold mb-1">DIRECT LINE // ONLINE</p>
                                                <p className="text-zinc-500">Waypoints are connected directly.</p>
                                            </div>
                                        )}

                                        {isCalculating && (
                                            <div className="text-toxic-yellow text-[10px] font-bold animate-pulse tracking-widest uppercase">
                                                {"// PROCESSING ROUTING ALGORITHM..."}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={undoLastWaypoint}
                                                disabled={waypoints.length === 0}
                                                className="py-2 border-[1px] border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold transition-colors tracking-widest uppercase bg-transparent hover:bg-zinc-800"
                                            >
                                                [ UNDO WPT ]
                                            </button>
                                            <button
                                                onClick={resetRoute}
                                                disabled={waypoints.length === 0}
                                                className="py-2 border-[1px] border-red-500 text-red-500 hover:bg-red-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold transition-colors tracking-widest uppercase bg-transparent"
                                            >
                                                [ CLEAR ROUTE ]
                                            </button>
                                        </div>

                                        {/* Waypoints List */}
                                        {waypoints.length > 0 && (
                                            <div className="border-[1px] border-zinc-800 bg-black/20 p-3 max-h-32 overflow-y-auto font-pixel">
                                                <div className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase mb-2 border-b-[1px] border-zinc-800 pb-1">SEQ_WAYPOINTS</div>
                                                {waypoints.map((pt, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-[10px] py-1 border-b-[1px] border-zinc-800/50 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                                                        <span className={`${i === 0 ? "text-toxic-green" : i === waypoints.length - 1 ? "text-red-500" : "text-toxic-yellow"
                                                            } w-4`}>
                                                            [{i + 1}]
                                                        </span>
                                                        <span className="text-zinc-400 tracking-widest">
                                                            N:{pt[0].toFixed(4)} E:{pt[1].toFixed(4)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-white border-[1px] border-zinc-800 hover:border-zinc-500 transition-colors"
                                            >
                                                [ &lt; RETOUR ]
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={waypoints.length < 2}
                                                className="flex-1 border-[1px] border-toxic-cyan text-toxic-cyan hover:bg-toxic-cyan hover:text-black py-3 text-[10px] font-bold transition-colors uppercase tracking-widest disabled:opacity-50 disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent"
                                            >
                                                [ BUILD FINAL ]
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Sauvegarder */}
                                {step === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="text-toxic-green font-bold tracking-widest uppercase text-[10px]">
                                            {"// STAGE 3 : FINAL SAVE"}
                                        </div>

                                        {/* Résumé */}
                                        <div className="border-[1px] border-zinc-800 bg-black/20 p-4 space-y-2 font-pixel tracking-widest uppercase">
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">DST_CALC</span>
                                                <span className="text-toxic-yellow">{distance.toFixed(2)} KM</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">WPT_SEQ</span>
                                                <span className="text-white">{waypoints.length}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">TERRAIN</span>
                                                <span className="text-toxic-magenta">[{routeType}]</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">DIFF</span>
                                                <span className={difficultyColors[difficulty].split(' ')[0]}>[{difficulty}]</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">ZONE</span>
                                                <span className="text-zinc-400">{selectedRegion.name}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] border-b-[1px] border-zinc-800/50 pb-1">
                                                <span className="text-zinc-600">ROUTING</span>
                                                <span className={snapToRoad ? "text-toxic-green" : "text-toxic-yellow"}>
                                                    [{snapToRoad ? "OSRM_SNAP" : "DIRECT_LINE"}]
                                                </span>
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="NOM DU TRACÉ (EX: COL DE TURINI)"
                                            className="w-full bg-black/40 border-[1px] border-zinc-700 p-3 text-white text-[10px] font-pixel uppercase tracking-widest focus:border-toxic-green outline-none transition-colors"
                                            value={routeName}
                                            onChange={(e) => setRouteName(e.target.value)}
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setStep(2)}
                                                className="flex-1 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-white border-[1px] border-zinc-800 hover:border-zinc-500 transition-colors"
                                            >
                                                [ &lt; RETOUR ]
                                            </button>
                                            <button
                                                onClick={saveRoute}
                                                disabled={!routeName.trim()}
                                                className="flex-1 border-[1px] border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-black font-bold text-[10px] py-3 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent"
                                            >
                                                [ SAVE ROUTE_ ]
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* MODE IMPORT */}
                                {mode === "IMPORT" && step === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-zinc-500 text-xs">
                                            Importe un fichier GPX pour charger un tracé existant.
                                        </p>

                                        <label className="block">
                                            <div className="border-2 border-dashed border-zinc-700 hover:border-yellow-500 rounded p-8 text-center cursor-pointer transition-colors">
                                                <FileDown size={40} className="mx-auto mb-3 text-zinc-500" />
                                                <span className="text-zinc-400 text-sm block">Cliquer pour uploader</span>
                                                <span className="text-zinc-600 text-xs">.GPX</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".gpx"
                                                onChange={handleGPXUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Panel Button (Desktop) */}
            <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="hidden md:block absolute top-1/2 -translate-y-1/2 z-[1001] bg-black/90 border-2 border-zinc-800 p-2 hard-border hover:border-toxic-cyan transition-colors shadow-[0_0_15px_rgba(0,0,0,0.8)] text-white hover:text-toxic-cyan"
                style={{ left: isPanelOpen ? "360px" : "16px" }}
            >
                {isPanelOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            {/* Toggle Panel Button (Mobile) */}
            <button
                onClick={() => setIsPanelOpen(true)}
                className={`md:hidden absolute z-[1001] bg-black/90 border-2 border-zinc-800 p-3 hard-border hover:border-toxic-cyan transition-colors shadow-[0_0_15px_rgba(0,0,0,0.8)] text-white font-bold tracking-widest uppercase text-xs ${isPanelOpen ? 'hidden' : 'flex'} items-center gap-2`}
                style={{ bottom: "24px", left: "50%", transform: "translateX(-50%)" }}
            >
                <Pencil size={16} /> OUVRIR LE PANNEAU
            </button>
        </div>
    );
}
