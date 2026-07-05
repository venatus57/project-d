"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    Pencil, Upload, ChevronLeft, ChevronRight, TrendingDown, TrendingUp,
    Navigation, Route, Zap, Disc, Navigation2, FileDown, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRoute, LatLng } from "../../lib/types";
import { loadRoutes, saveRoutes } from "../../lib/storage";
import { pathDistanceKm, distanceKm } from "../../lib/geo";
import { DIFFICULTY_STYLE, Difficulty } from "@/components/ui";

type RegionPreset = {
    name: string;
    center: LatLng;
    zoom: number;
    category?: string;
};

// Cols et routes mythiques de France
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
    // === CÔTE D'AZUR ===
    { name: "Col de Turini", center: [43.9797, 7.3917], zoom: 14, category: "Côte d'Azur" },
    { name: "Col de Vence", center: [43.7567, 7.0667], zoom: 14, category: "Côte d'Azur" },
    { name: "Route Napoléon", center: [43.8333, 6.8833], zoom: 11, category: "Côte d'Azur" },
    { name: "Gorges du Verdon", center: [43.75, 6.3333], zoom: 12, category: "Côte d'Azur" },
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
    // === ÎLE-DE-FRANCE ===
    { name: "Forêt de Fontainebleau", center: [48.4047, 2.6989], zoom: 12, category: "Île-de-France" },
    { name: "Forêt de Rambouillet", center: [48.6439, 1.825], zoom: 12, category: "Île-de-France" },
    { name: "Vallée de Chevreuse", center: [48.7072, 2.0347], zoom: 13, category: "Île-de-France" },
    { name: "Routes du Vexin", center: [49.1, 1.75], zoom: 12, category: "Île-de-France" },
    { name: "Forêt de Compiègne", center: [49.3833, 2.9], zoom: 12, category: "Île-de-France" },
];

const MapComponent = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full grid place-items-center">
            <div className="kicker text-ice animate-pulse">Chargement de la carte…</div>
        </div>
    ),
});

// OSRM road routing
async function getRouteFromOSRM(waypoints: LatLng[]): Promise<{ geometry: LatLng[]; distance: number } | null> {
    if (waypoints.length < 2) return null;
    const coords = waypoints.map((p) => `${p[1]},${p[0]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === "Ok" && data.routes?.[0]) {
            const route = data.routes[0];
            const geometry: LatLng[] = route.geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]] as LatLng
            );
            return { geometry, distance: route.distance / 1000 };
        }
    } catch (error) {
        console.error("OSRM routing error:", error);
    }
    return null;
}

// Real GPX parsing (trkpt / rtept / wpt)
function parseGPX(xmlText: string): LatLng[] {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) return [];

    let nodes = Array.from(doc.querySelectorAll("trkpt"));
    if (nodes.length === 0) nodes = Array.from(doc.querySelectorAll("rtept"));
    if (nodes.length === 0) nodes = Array.from(doc.querySelectorAll("wpt"));

    const points = nodes
        .map((el) => [parseFloat(el.getAttribute("lat") || ""), parseFloat(el.getAttribute("lon") || "")] as LatLng)
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));

    // Downsample very dense tracks to keep the app snappy
    const MAX_POINTS = 600;
    if (points.length > MAX_POINTS) {
        const step = Math.ceil(points.length / MAX_POINTS);
        const sampled = points.filter((_, i) => i % step === 0);
        if (sampled[sampled.length - 1] !== points[points.length - 1]) sampled.push(points[points.length - 1]);
        return sampled;
    }
    return points;
}

type Mode = "DRAW" | "TRACK" | "IMPORT";

export default function RouteBuilderPage() {
    const router = useRouter();

    // Route state
    const [mode, setMode] = useState<Mode>("DRAW");
    const [waypoints, setWaypoints] = useState<LatLng[]>([]);
    const [routeGeometry, setRouteGeometry] = useState<LatLng[]>([]);
    const [routeName, setRouteName] = useState("");
    const [distance, setDistance] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    const [snapToRoad, setSnapToRoad] = useState(true);
    const [importError, setImportError] = useState<string | null>(null);

    // GPS tracking state
    const [isRecording, setIsRecording] = useState(false);
    const [gpsTrack, setGpsTrack] = useState<LatLng[]>([]);
    const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(0);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const gpsTrackRef = useRef<LatLng[]>([]);

    // Config state
    const [routeType, setRouteType] = useState<UserRoute["type"]>("DOWNHILL");
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGION_PRESETS[0]);
    const [selectedCategory, setSelectedCategory] = useState("Alpes");
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const categories = [...new Set(REGION_PRESETS.map((r) => r.category).filter(Boolean))] as string[];
    const filteredRegions = REGION_PRESETS.filter((r) => r.category === selectedCategory);

    // Recompute route when waypoints change
    useEffect(() => {
        let cancelled = false;

        const calculateRoute = async () => {
            if (waypoints.length < 2) {
                setRouteGeometry([]);
                setDistance(0);
                return;
            }
            if (snapToRoad) {
                setIsCalculating(true);
                const result = await getRouteFromOSRM(waypoints);
                if (cancelled) return;
                setIsCalculating(false);
                if (result) {
                    setRouteGeometry(result.geometry);
                    setDistance(result.distance);
                    return;
                }
            }
            setRouteGeometry(waypoints);
            setDistance(pathDistanceKm(waypoints));
        };

        calculateRoute();
        return () => {
            cancelled = true;
        };
    }, [waypoints, snapToRoad]);

    const addWaypoint = useCallback((latlng: LatLng) => {
        setWaypoints((prev) => [...prev, latlng]);
    }, []);

    const undoLastWaypoint = () => setWaypoints((prev) => prev.slice(0, -1));

    const resetRoute = () => {
        setWaypoints([]);
        setRouteGeometry([]);
        setDistance(0);
    };

    const fullReset = () => {
        resetRoute();
        setRouteName("");
        setRouteType("DOWNHILL");
        setDifficulty("MEDIUM");
        setStep(1);
        setGpsTrack([]);
        gpsTrackRef.current = [];
        setCurrentPosition(null);
        setGpsError(null);
        setImportError(null);
    };

    /* === GPS TRACKING === */
    const startGpsTracking = () => {
        if (!navigator.geolocation) {
            setGpsError("La géolocalisation n'est pas supportée par ce navigateur.");
            return;
        }
        setGpsError(null);
        setGpsTrack([]);
        gpsTrackRef.current = [];
        setIsRecording(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const newPoint: LatLng = [latitude, longitude];
                setCurrentPosition(newPoint);
                setGpsAccuracy(accuracy);

                const track = gpsTrackRef.current;
                const last = track[track.length - 1];
                // Ignore GPS noise below ~3 m
                if (!last || distanceKm(last, newPoint) > 0.003) {
                    gpsTrackRef.current = [...track, newPoint];
                    setGpsTrack(gpsTrackRef.current);
                }
            },
            (error) => {
                const messages: Record<number, string> = {
                    1: "Permission GPS refusée. Autorise l'accès à ta position.",
                    2: "Position GPS indisponible.",
                    3: "Délai dépassé pour obtenir la position.",
                };
                setGpsError(messages[error.code] || "Erreur GPS inconnue.");
                setIsRecording(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const stopGpsTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsRecording(false);

        const track = gpsTrackRef.current;
        if (track.length >= 2) {
            setWaypoints(track);
            setRouteGeometry(track);
            setDistance(pathDistanceKm(track));
            setSnapToRoad(false); // dense track: keep raw geometry
            setStep(3);
        }
    };

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    /* === SAVE === */
    const saveRoute = () => {
        if (waypoints.length < 2 || !routeName.trim()) return;

        const newRoute: UserRoute = {
            id: Date.now().toString(),
            name: routeName.trim(),
            points: waypoints,
            routeGeometry,
            distance,
            createdAt: new Date().toISOString(),
            type: routeType,
            difficulty,
            region: selectedRegion.name,
        };

        saveRoutes([...loadRoutes(), newRoute]);
        fullReset();
        router.push("/conquest");
    };

    /* === GPX IMPORT === */
    const handleGPXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setImportError(null);
        try {
            const text = await file.text();
            const points = parseGPX(text);
            if (points.length < 2) {
                setImportError("Fichier GPX invalide ou sans points de trace.");
                return;
            }
            setWaypoints(points);
            setRouteGeometry(points);
            setDistance(pathDistanceKm(points));
            setSnapToRoad(false);
            setRouteName(file.name.replace(/\.gpx$/i, ""));
            setStep(3);
        } catch {
            setImportError("Impossible de lire ce fichier.");
        }
    };

    const modeTabs: { key: Mode; label: string; icon: typeof Pencil; tone: string }[] = [
        { key: "DRAW", label: "Tracer", icon: Pencil, tone: "text-ice" },
        { key: "TRACK", label: "GPS", icon: Navigation2, tone: "text-mint" },
        { key: "IMPORT", label: "Import", icon: Upload, tone: "text-haze" },
    ];

    return (
        <div className="map-screen">
            {/* MAP */}
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

            {/* TOP-RIGHT STATS */}
            <div className="absolute top-3 right-3 z-[500] pointer-events-none">
                <div className="hud px-4 py-3 text-right">
                    <div className="label mb-1">{selectedRegion.name}</div>
                    <div className="flex justify-end items-baseline gap-4">
                        <div>
                            <span className="mono-num text-white font-bold text-lg">{waypoints.length}</span>
                            <span className="label ml-1">wpt</span>
                        </div>
                        <div>
                            <span className="mono-num text-gold font-bold text-lg">
                                {isCalculating ? "…" : distance.toFixed(2)}
                            </span>
                            <span className="label ml-1">km</span>
                        </div>
                    </div>
                    {snapToRoad && mode === "DRAW" && (
                        <div className="label text-mint! mt-1">Snap route actif</div>
                    )}
                </div>
            </div>

            {/* LOCATE BUTTON */}
            <button
                onClick={() => {
                    navigator.geolocation?.getCurrentPosition(
                        (position) => {
                            const loc: LatLng = [position.coords.latitude, position.coords.longitude];
                            setCurrentPosition(loc);
                            setSelectedRegion((prev) => ({ ...prev, center: loc, zoom: 15 }));
                        },
                        (error) => console.error("GPS Error", error),
                        { enableHighAccuracy: true }
                    );
                }}
                className="absolute bottom-5 right-3 z-[500] hud rounded-xl! p-3 text-ice hover:bg-ice hover:text-black transition-colors flex items-center gap-2"
                title="Centrer sur ma position"
            >
                <Navigation2 size={16} />
                <span className="label text-inherit! hidden md:inline">Localiser</span>
            </button>

            {/* ===== PANEL ===== */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        initial={{ x: -420, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -420, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 32 }}
                        className="absolute inset-x-2 bottom-2 top-auto max-h-[62dvh] md:inset-auto md:top-3 md:left-3 md:bottom-3 md:w-[360px] md:max-h-none z-[600] flex flex-col"
                    >
                        <div className="hud flex-1 flex flex-col overflow-hidden">
                            {/* Mobile close */}
                            <button
                                onClick={() => setIsPanelOpen(false)}
                                className="md:hidden flex items-center justify-center gap-2 py-2.5 border-b border-line text-zinc-500 hover:text-white transition-colors label"
                            >
                                <X size={13} /> Fermer le panneau
                            </button>

                            {/* Mode tabs */}
                            <div className="flex border-b border-line">
                                {modeTabs.map((tab) => {
                                    const active = mode === tab.key;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setMode(tab.key);
                                                setStep(1);
                                                if (tab.key === "TRACK") fullReset();
                                            }}
                                            className={`relative flex-1 flex items-center justify-center gap-1.5 py-3.5 font-display font-semibold uppercase tracking-widest text-xs transition-colors ${active ? tab.tone : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="builder-tab"
                                                    className="absolute bottom-0 inset-x-4 h-0.5 bg-current"
                                                />
                                            )}
                                            <Icon size={13} /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                {/* === STEP 1: CONFIG (DRAW) === */}
                                {step === 1 && mode === "DRAW" && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="kicker text-ice">Étape 1 — Configuration</div>

                                        {/* Region */}
                                        <div>
                                            <label className="label block mb-2">Région</label>
                                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-display font-bold uppercase tracking-wider border transition-colors ${selectedCategory === cat
                                                            ? "bg-ice text-black border-ice"
                                                            : "bg-white/5 border-line text-zinc-400 hover:text-white"
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="rounded-xl border border-line bg-black/25 p-1.5 max-h-40 overflow-y-auto space-y-1">
                                                {filteredRegions.map((region) => (
                                                    <button
                                                        key={region.name}
                                                        onClick={() => setSelectedRegion(region)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors flex items-center justify-between ${selectedRegion.name === region.name
                                                            ? "bg-ice/12 text-ice"
                                                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                                            }`}
                                                    >
                                                        <span>{region.name}</span>
                                                        {selectedRegion.name === region.name && <span>✓</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Snap mode */}
                                        <div>
                                            <label className="label block mb-2">Mode tracé</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setSnapToRoad(true)}
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-display font-bold uppercase tracking-wider transition-colors ${snapToRoad
                                                        ? "bg-mint/12 border-mint/50 text-mint"
                                                        : "bg-black/25 border-line text-zinc-500 hover:text-zinc-300"
                                                        }`}
                                                >
                                                    <Route size={14} /> Suivre la route
                                                </button>
                                                <button
                                                    onClick={() => setSnapToRoad(false)}
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-display font-bold uppercase tracking-wider transition-colors ${!snapToRoad
                                                        ? "bg-gold/12 border-gold/50 text-gold"
                                                        : "bg-black/25 border-line text-zinc-500 hover:text-zinc-300"
                                                        }`}
                                                >
                                                    <Zap size={14} /> Ligne droite
                                                </button>
                                            </div>
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="label block mb-2">Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: "DOWNHILL", label: "Descente", icon: TrendingDown },
                                                    { value: "UPHILL", label: "Montée", icon: TrendingUp },
                                                    { value: "MIXED", label: "Mixte", icon: Navigation },
                                                ].map((t) => (
                                                    <button
                                                        key={t.value}
                                                        onClick={() => setRouteType(t.value as UserRoute["type"])}
                                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-[11px] font-display font-bold uppercase tracking-wider transition-colors ${routeType === t.value
                                                            ? "bg-accent/12 border-accent/50 text-accent"
                                                            : "bg-black/25 border-line text-zinc-500 hover:text-zinc-300"
                                                            }`}
                                                    >
                                                        <t.icon size={16} />
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <label className="label block mb-2">Difficulté</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {(["EASY", "MEDIUM", "HARD", "LEGENDARY"] as const).map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDifficulty(d)}
                                                        className={`py-2.5 rounded-xl border text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${difficulty === d
                                                            ? DIFFICULTY_STYLE[d].badge
                                                            : "bg-black/25 border-line text-zinc-500 hover:text-zinc-300"
                                                            }`}
                                                    >
                                                        {d.slice(0, 4)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full py-3.5 rounded-xl bg-ice text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors active:scale-[0.98]"
                                        >
                                            Confirmer →
                                        </button>
                                    </motion.div>
                                )}

                                {/* === GPS TRACK MODE === */}
                                {mode === "TRACK" && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="kicker text-mint">Télémétrie GPS</div>

                                        <div className="rounded-xl border border-mint/25 bg-mint/5 p-3.5 text-xs">
                                            <p className="font-display font-bold uppercase tracking-widest text-mint mb-1">
                                                Live tracking
                                            </p>
                                            <p className="text-zinc-400">
                                                Appuie sur démarrer puis roule : ta trajectoire est enregistrée en temps réel via le GPS.
                                            </p>
                                        </div>

                                        {gpsError && (
                                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-semibold">
                                                {gpsError}
                                            </div>
                                        )}

                                        {isRecording && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-black/30 p-3.5">
                                                    <div className="relative">
                                                        <Disc size={22} className="text-red-500 animate-spin [animation-duration:3s]" />
                                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                    </div>
                                                    <div>
                                                        <div className="text-red-400 font-display font-bold uppercase tracking-widest text-xs">
                                                            Enregistrement…
                                                        </div>
                                                        <div className="text-zinc-500 text-xs">Roule pour tracer ton touge</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                                        <div className="mono-num text-lg font-bold text-mint">{gpsTrack.length}</div>
                                                        <div className="label">pts</div>
                                                    </div>
                                                    <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                                        <div className="mono-num text-lg font-bold text-gold">
                                                            {pathDistanceKm(gpsTrack).toFixed(2)}
                                                        </div>
                                                        <div className="label">km</div>
                                                    </div>
                                                    <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                                        <div className="mono-num text-lg font-bold text-ice">±{gpsAccuracy.toFixed(0)}</div>
                                                        <div className="label">m</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!isRecording ? (
                                            <button
                                                onClick={startGpsTracking}
                                                className="w-full py-3.5 rounded-xl bg-mint text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors active:scale-[0.98]"
                                            >
                                                Démarrer la télémétrie
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopGpsTracking}
                                                disabled={gpsTrack.length < 2}
                                                className="w-full py-3.5 rounded-xl border border-red-500/60 text-red-400 font-display font-bold uppercase tracking-widest text-sm hover:bg-red-500 hover:text-black transition-colors active:scale-[0.98] disabled:opacity-40"
                                            >
                                                Stop — {gpsTrack.length} pts
                                            </button>
                                        )}

                                        <div className="text-zinc-600 text-xs space-y-1">
                                            <p className="font-bold text-zinc-500">Conseils précision :</p>
                                            <ul className="list-disc ml-4 space-y-0.5">
                                                <li>Active le GPS haute précision sur ton téléphone</li>
                                                <li>Autorise la position en mode « précis »</li>
                                                <li>Attends une précision &lt; 10 m avant de démarrer</li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}

                                {/* === STEP 2: WAYPOINTS === */}
                                {step === 2 && mode === "DRAW" && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="kicker text-gold">Étape 2 — Waypoints</div>

                                        <div className={`rounded-xl border p-3.5 text-xs ${snapToRoad ? "border-mint/25 bg-mint/5" : "border-line bg-black/25"}`}>
                                            <p className={`font-display font-bold uppercase tracking-widest mb-1 ${snapToRoad ? "text-mint" : "text-zinc-400"}`}>
                                                {snapToRoad ? "Snap route — actif" : "Ligne directe"}
                                            </p>
                                            <p className="text-zinc-500">
                                                {snapToRoad
                                                    ? "Clique sur la carte : l'itinéraire suit automatiquement la route."
                                                    : "Clique sur la carte : les points sont reliés en ligne droite."}
                                            </p>
                                        </div>

                                        {isCalculating && (
                                            <div className="kicker text-gold animate-pulse">Calcul de l&apos;itinéraire…</div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={undoLastWaypoint}
                                                disabled={waypoints.length === 0}
                                                className="py-2.5 rounded-xl border border-line text-zinc-400 hover:text-white hover:border-white/25 text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                                            >
                                                Annuler point
                                            </button>
                                            <button
                                                onClick={resetRoute}
                                                disabled={waypoints.length === 0}
                                                className="py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-black text-xs font-display font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
                                            >
                                                Tout effacer
                                            </button>
                                        </div>

                                        {waypoints.length > 0 && (
                                            <div className="rounded-xl border border-line bg-black/25 p-3 max-h-32 overflow-y-auto">
                                                <div className="label mb-2 border-b border-line pb-1.5">Séquence</div>
                                                {waypoints.map((pt, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-[11px] py-1 mono-num">
                                                        <span
                                                            className={`w-6 ${i === 0 ? "text-mint" : i === waypoints.length - 1 ? "text-gold" : "text-ice"}`}
                                                        >
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-zinc-500">
                                                            {pt[0].toFixed(4)}, {pt[1].toFixed(4)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="flex-1 py-3 rounded-xl border border-line text-zinc-400 hover:text-white text-xs font-display font-bold uppercase tracking-wider transition-colors"
                                            >
                                                ← Retour
                                            </button>
                                            <button
                                                onClick={() => setStep(3)}
                                                disabled={waypoints.length < 2}
                                                className="flex-1 py-3 rounded-xl bg-ice text-black text-xs font-display font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-40"
                                            >
                                                Finaliser →
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* === STEP 3: SAVE === */}
                                {step === 3 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="kicker text-mint">Étape 3 — Sauvegarde</div>

                                        <div className="rounded-xl border border-line bg-black/25 p-4 space-y-2 text-xs uppercase tracking-widest">
                                            {[
                                                ["Distance", `${distance.toFixed(2)} km`, "text-gold"],
                                                ["Waypoints", `${waypoints.length}`, "text-white"],
                                                ["Type", routeType, "text-accent"],
                                                ["Difficulté", difficulty, DIFFICULTY_STYLE[difficulty].badge.split(" ")[0]],
                                                ["Zone", selectedRegion.name, "text-zinc-300"],
                                            ].map(([label, value, tone]) => (
                                                <div key={label as string} className="flex justify-between border-b border-line/60 pb-1.5 last:border-0 last:pb-0">
                                                    <span className="text-zinc-600 font-bold">{label}</span>
                                                    <span className={`font-bold mono-num ${tone}`}>{value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Nom du tracé (ex: Col de Turini)"
                                            className="field"
                                            value={routeName}
                                            onChange={(e) => setRouteName(e.target.value)}
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setStep(mode === "DRAW" ? 2 : 1)}
                                                className="flex-1 py-3 rounded-xl border border-line text-zinc-400 hover:text-white text-xs font-display font-bold uppercase tracking-wider transition-colors"
                                            >
                                                ← Retour
                                            </button>
                                            <button
                                                onClick={saveRoute}
                                                disabled={!routeName.trim() || waypoints.length < 2}
                                                className="flex-1 py-3 rounded-xl bg-mint text-black text-xs font-display font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-40"
                                            >
                                                Sauvegarder
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* === IMPORT MODE === */}
                                {mode === "IMPORT" && step === 1 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="kicker text-haze">Import GPX</div>
                                        <p className="text-zinc-500 text-sm">
                                            Importe un fichier GPX (trace GPS exportée depuis Strava, Garmin, etc.) pour charger un tracé existant.
                                        </p>

                                        {importError && (
                                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-semibold">
                                                {importError}
                                            </div>
                                        )}

                                        <label className="block cursor-pointer">
                                            <div className="rounded-2xl border-2 border-dashed border-line hover:border-haze/60 p-8 text-center transition-colors group">
                                                <FileDown size={36} className="mx-auto mb-3 text-zinc-600 group-hover:text-haze transition-colors" />
                                                <span className="text-zinc-300 text-sm font-semibold block">Cliquer pour uploader</span>
                                                <span className="label mt-1">.gpx</span>
                                            </div>
                                            <input type="file" accept=".gpx" onChange={handleGPXUpload} className="hidden" />
                                        </label>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panel toggle (desktop) */}
            <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="hidden md:grid place-items-center absolute top-1/2 -translate-y-1/2 z-[610] hud rounded-xl! w-9 h-14 text-zinc-400 hover:text-white transition-all"
                style={{ left: isPanelOpen ? "376px" : "12px" }}
            >
                {isPanelOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Panel open (mobile) */}
            {!isPanelOpen && (
                <button
                    onClick={() => setIsPanelOpen(true)}
                    className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-[610] hud rounded-full! px-5 py-3 flex items-center gap-2 text-white font-display font-bold uppercase tracking-widest text-xs"
                >
                    <Pencil size={14} className="text-accent" /> Ouvrir le panneau
                </button>
            )}
        </div>
    );
}
