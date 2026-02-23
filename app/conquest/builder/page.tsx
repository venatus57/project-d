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
            setStep(2); // Move to naming step
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
        <div className="h-screen w-full bg-black relative overflow-hidden font-pixel">

            {/* MAP (Full screen) */}
            <div className="absolute inset-0">
                <MapComponent
                    waypoints={waypoints}
                    routeGeometry={routeGeometry}
                    onMapClick={mode === "DRAW" && step >= 2 ? addWaypoint : undefined}
                    center={selectedRegion.center}
                    zoom={selectedRegion.zoom}
                />
            </div>

            {/* HUD OVERLAY - Top */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 px-6 py-3 hard-border shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                    <h1 className="text-2xl font-bold text-toxic-magenta tracking-widest text-center uppercase text-shadow-neon glitch-hover">
                        ROUTE BUILDER
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-1 ${step >= s ? "bg-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.8)]" : "bg-zinc-800"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* HUD OVERLAY - Stats */}
            <div className="absolute top-4 right-4 z-[1000]">
                <div className="bg-black/90 backdrop-blur-md border-2 border-zinc-800 p-4 hard-border shadow-[0_0_15px_rgba(0,0,0,0.8)] space-y-2">
                    <div className="flex items-center gap-2 text-zinc-500 font-bold tracking-widest uppercase text-xs">
                        <MapPin size={16} className="text-toxic-cyan" />
                        <span className="text-white">{waypoints.length} WAYPOINTS</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold tracking-widest uppercase text-xs">
                        <Ruler size={16} className="text-toxic-magenta" />
                        <span className="text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.5)]">
                            {isCalculating ? "..." : `${distance.toFixed(2)} KM`}
                        </span>
                    </div>
                    {snapToRoad && (
                        <div className="flex items-center gap-2 text-toxic-green text-[10px] font-bold tracking-widest uppercase">
                            <Route size={12} />
                            <span>SNAP TO ROAD</span>
                        </div>
                    )}
                    <div className="border-t-2 border-zinc-800 pt-2 mt-2">
                        <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">{selectedRegion.name}</div>
                    </div>
                </div>
            </div>

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
                                        <div className="flex items-center gap-2 text-toxic-cyan font-bold tracking-widest uppercase text-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                                            <Flag size={16} />
                                            ÉTAPE 1 : CONFIGURATION
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
                                            className="w-full bg-toxic-cyan text-black hover:bg-white py-3 text-sm font-bold mt-4 hard-border transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                                        >
                                            CONTINUER →
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
                                        <div className="flex items-center gap-2 text-green-500 font-bold">
                                            <Navigation2 size={16} />
                                            MODE GPS EN DIRECT
                                        </div>

                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-xs text-green-400">
                                            <p className="font-bold mb-1">📍 Enregistrement GPS</p>
                                            <p>Appuie sur DÉMARRER puis roule ! Le site enregistrera ton trajet en temps réel grâce au GPS de ton téléphone.</p>
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
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 text-black font-bold text-lg rounded hover:bg-green-400 transition-colors"
                                            >
                                                <Navigation2 size={24} />
                                                DÉMARRER L'ENREGISTREMENT
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopGpsTracking}
                                                disabled={gpsTrack.length < 2}
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-red-500 text-white font-bold text-lg rounded hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <StopCircle size={24} />
                                                ARRÊTER ({gpsTrack.length} points)
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
                                        <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                            <Pencil size={16} />
                                            ÉTAPE 2 : TRACER
                                        </div>

                                        {snapToRoad ? (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-xs text-green-400">
                                                <Route size={14} className="inline mr-2" />
                                                Mode <strong>SNAP TO ROAD</strong> activé — le tracé suit automatiquement les routes !
                                            </div>
                                        ) : (
                                            <p className="text-zinc-500 text-xs">
                                                Mode ligne droite — le tracé relie les points directement.
                                            </p>
                                        )}

                                        {isCalculating && (
                                            <div className="text-yellow-500 text-xs animate-pulse">
                                                Calcul de l&apos;itinéraire...
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={undoLastWaypoint}
                                                disabled={waypoints.length === 0}
                                                className="flex items-center justify-center gap-2 py-3 bg-black border-2 border-zinc-800 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors hard-border uppercase tracking-widest text-zinc-400"
                                            >
                                                <Undo2 size={16} /> ANNULER
                                            </button>
                                            <button
                                                onClick={resetRoute}
                                                disabled={waypoints.length === 0}
                                                className="flex items-center justify-center gap-2 py-3 bg-black border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition-colors hard-border uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)] disabled:shadow-none"
                                            >
                                                <RotateCcw size={16} /> RESET
                                            </button>
                                        </div>

                                        {/* Waypoints List */}
                                        {waypoints.length > 0 && (
                                            <div className="bg-black border-2 border-zinc-800 hard-border p-3 max-h-32 overflow-y-auto">
                                                <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-2">WAYPOINTS</div>
                                                {waypoints.map((pt, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-zinc-800 last:border-0">
                                                        <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold hard-border border-2 ${i === 0 ? "bg-toxic-green/20 text-toxic-green border-toxic-green shadow-[0_0_5px_rgba(0,255,65,0.5)]" : i === waypoints.length - 1 ? "bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-toxic-yellow/20 text-toxic-yellow border-toxic-yellow"
                                                            }`}>
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-zinc-400 font-pixel text-xs tracking-widest">
                                                            {pt[0].toFixed(4)}, {pt[1].toFixed(4)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="flex-1 bg-black border-2 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white py-3 text-sm font-bold transition-colors hard-border uppercase tracking-widest"
                                            >
                                                ← RETOUR
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={waypoints.length < 2}
                                                className="flex-1 bg-toxic-cyan text-black hover:bg-white disabled:bg-zinc-800 disabled:border-zinc-800 disabled:text-zinc-500 disabled:shadow-none py-3 text-sm font-bold transition-colors hard-border uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,255,0.4)] border-2 border-toxic-cyan"
                                            >
                                                CONTINUER →
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
                                        <div className="flex items-center gap-2 text-toxic-green font-bold text-shadow-[0_0_10px_rgba(0,255,65,0.5)] uppercase tracking-widest">
                                            <Save size={16} />
                                            ÉTAPE 3 : FINALISER
                                        </div>

                                        {/* Résumé */}
                                        <div className="bg-black border-2 border-zinc-800 hard-border p-4 space-y-3 font-bold uppercase tracking-widest">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">DISTANCE</span>
                                                <span className="text-toxic-yellow text-shadow-[0_0_5px_rgba(255,255,0,0.5)]">{distance.toFixed(2)} KM</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">WAYPOINTS</span>
                                                <span className="text-white">{waypoints.length}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">TYPE</span>
                                                <span className="text-white uppercase px-2 bg-toxic-magenta/20 border border-toxic-magenta text-toxic-magenta">{routeType}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">DIFFICULTÉ</span>
                                                <span className={`px-2 text-[10px] hard-border border-2 ${difficultyColors[difficulty].split(' ')[0]} ${difficultyColors[difficulty].split(' ')[1]}`}>{difficulty}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">RÉGION</span>
                                                <span className="text-white bg-black border border-zinc-800 px-2">{selectedRegion.name}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-500">MODE</span>
                                                <span className={snapToRoad ? "text-toxic-green" : "text-toxic-yellow"}>
                                                    {snapToRoad ? "ROUTE RÉELLE" : "LIGNE DROITE"}
                                                </span>
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="NOM DU TRACÉ (EX: COL DE TURINI)"
                                            className="w-full bg-black border-2 border-zinc-800 p-3 text-white font-bold uppercase tracking-widest focus:border-toxic-cyan outline-none hard-border transition-colors"
                                            value={routeName}
                                            onChange={(e) => setRouteName(e.target.value)}
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setStep(2)}
                                                className="flex-1 bg-black border-2 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white py-3 text-sm font-bold transition-colors hard-border uppercase tracking-widest"
                                            >
                                                ← RETOUR
                                            </button>
                                            <button
                                                onClick={saveRoute}
                                                disabled={!routeName.trim()}
                                                className="flex-1 bg-toxic-green text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm font-bold flex items-center justify-center gap-2 hard-border uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:shadow-none border-2 border-toxic-green disabled:border-zinc-800 disabled:bg-zinc-800 disabled:text-zinc-500"
                                            >
                                                <Save size={16} /> SAUVEGARDER
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
