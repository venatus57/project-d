"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    ArrowLeft, Car as CarIcon, MapPin, Play, Square,
    Timer, Gauge, Navigation2, AlertCircle, Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Car, Weather, GhostRun, GhostPoint,
    WEATHER_INFO, STORAGE_KEYS, LatLng
} from "../lib/types";

// Dynamic map import
const RunMapView = dynamic(() => import("./RunMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
            <div className="text-zinc-500 font-mono animate-pulse">LOADING MAP...</div>
        </div>
    )
});

type UserRoute = {
    id: string;
    name: string;
    points: LatLng[];
    routeGeometry?: LatLng[];
    distance: number;
    createdAt: string;
    type: string;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    region: string;
};

export default function RunPage() {
    const router = useRouter();

    // Selection state
    const [cars, setCars] = useState<Car[]>([]);
    const [touges, setTouges] = useState<UserRoute[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [selectedTouge, setSelectedTouge] = useState<UserRoute | null>(null);
    const [selectedWeather, setSelectedWeather] = useState<Weather>("SEC");
    const [driverName, setDriverName] = useState("");

    // Recording state
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [gpsPoints, setGpsPoints] = useState<GhostPoint[]>([]);
    const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Timer state
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [currentSpeed, setCurrentSpeed] = useState<number>(0);
    const [maxSpeed, setMaxSpeed] = useState<number>(0);

    // Refs
    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load cars and touges
    useEffect(() => {
        const savedCars = localStorage.getItem(STORAGE_KEYS.CARS);
        const savedRoutes = localStorage.getItem(STORAGE_KEYS.ROUTES);

        if (savedCars) {
            try { setCars(JSON.parse(savedCars)); } catch { }
        }
        if (savedRoutes) {
            try { setTouges(JSON.parse(savedRoutes)); } catch { }
        }
    }, []);

    // Timer effect
    useEffect(() => {
        if (isRecording && startTime > 0) {
            timerRef.current = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, 100);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording, startTime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const calculateSpeed = (p1: GhostPoint, p2: GhostPoint): number => {
        const R = 6371; // km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // km
        const timeDiff = (p2.timestamp - p1.timestamp) / 3600000; // hours
        return timeDiff > 0 ? distance / timeDiff : 0;
    };

    const startRun = () => {
        if (!navigator.geolocation) {
            setGpsError("Géolocalisation non supportée");
            return;
        }

        setGpsError(null);
        setGpsPoints([]);
        setMaxSpeed(0);
        const now = Date.now();
        setStartTime(now);
        setIsRecording(true);

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const onSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy, speed } = position.coords;
            const timestamp = Date.now() - startTime;

            const newPoint: GhostPoint = {
                lat: latitude,
                lng: longitude,
                timestamp,
                speed: speed ? speed * 3.6 : undefined // m/s to km/h
            };

            setCurrentPosition([latitude, longitude]);
            setGpsAccuracy(accuracy);

            setGpsPoints(prev => {
                if (prev.length === 0) return [newPoint];

                const lastPoint = prev[prev.length - 1];
                // Calculate speed if not provided
                if (!newPoint.speed && prev.length > 0) {
                    newPoint.speed = calculateSpeed(lastPoint, newPoint);
                }

                if (newPoint.speed) {
                    setCurrentSpeed(newPoint.speed);
                    if (newPoint.speed > maxSpeed) {
                        setMaxSpeed(newPoint.speed);
                    }
                }

                return [...prev, newPoint];
            });
        };

        const onError = (error: GeolocationPositionError) => {
            setGpsError("Erreur GPS: " + error.message);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    };

    const stopRun = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);

        // Save the ghost run
        if (gpsPoints.length >= 2 && selectedCar && selectedTouge) {
            const totalDistance = gpsPoints.reduce((acc, point, i) => {
                if (i === 0) return 0;
                const prev = gpsPoints[i - 1];
                const R = 6371;
                const dLat = (point.lat - prev.lat) * Math.PI / 180;
                const dLon = (point.lng - prev.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(prev.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                    Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return acc + R * c;
            }, 0);

            const avgSpeed = totalDistance / (elapsedTime / 3600000);

            const ghostRun: GhostRun = {
                id: Date.now().toString(),
                tougeId: selectedTouge.id,
                tougeName: selectedTouge.name,
                carId: selectedCar.id,
                carName: selectedCar.name,
                weather: selectedWeather,
                points: gpsPoints,
                totalTime: elapsedTime,
                totalDistance,
                avgSpeed,
                maxSpeed,
                date: new Date().toLocaleDateString('fr-FR'),
                driverName: driverName || "Anonyme"
            };

            // Save to localStorage
            const savedGhosts = localStorage.getItem("projectd_ghosts");
            const ghosts: GhostRun[] = savedGhosts ? JSON.parse(savedGhosts) : [];
            ghosts.push(ghostRun);
            localStorage.setItem("projectd_ghosts", JSON.stringify(ghosts));

            // Redirect to ghosts page
            router.push(`/ghosts/detail?id=${ghostRun.id}`);
        }
    };

    // Setup screen
    if (!isSetupComplete) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
                {/* Header */}
                <header className="mb-8 border-b border-zinc-800 pb-4">
                    <Link href="/" className="text-zinc-500 hover:text-yellow-500 text-sm flex items-center gap-2 mb-4">
                        <ArrowLeft size={14} /> Accueil
                    </Link>
                    <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                        NOUVEAU RUN
                    </h1>
                    <p className="text-zinc-500 mt-2">Configure ton run MF Ghost</p>
                </header>

                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Driver Name */}
                    <div>
                        <label className="text-zinc-400 text-sm block mb-2">NOM DU PILOTE</label>
                        <input
                            type="text"
                            placeholder="Ton pseudo..."
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-3 text-lg"
                        />
                    </div>

                    {/* Car Selection */}
                    <div>
                        <label className="text-zinc-400 text-sm block mb-2 flex items-center gap-2">
                            <CarIcon size={14} /> SÉLECTIONNE TA VOITURE
                        </label>
                        {cars.length === 0 ? (
                            <Link
                                href="/cars"
                                className="block w-full bg-zinc-900 border-2 border-dashed border-zinc-700 rounded p-6 text-center text-zinc-500 hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                            >
                                Aucune voiture → Ajouter une voiture
                            </Link>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cars.map(car => (
                                    <button
                                        key={car.id}
                                        onClick={() => setSelectedCar(car)}
                                        className={`p-4 border rounded text-left transition-colors ${selectedCar?.id === car.id
                                            ? "bg-yellow-500/20 border-yellow-500"
                                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                            }`}
                                    >
                                        <div className="font-bold">{car.name}</div>
                                        <div className="text-sm text-zinc-500">
                                            {car.power}ch • {car.weight}kg • {car.drivetrain}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Touge Selection */}
                    <div>
                        <label className="text-zinc-400 text-sm block mb-2 flex items-center gap-2">
                            <MapPin size={14} /> SÉLECTIONNE LE TOUGE
                        </label>
                        {touges.length === 0 ? (
                            <Link
                                href="/conquest/builder"
                                className="block w-full bg-zinc-900 border-2 border-dashed border-zinc-700 rounded p-6 text-center text-zinc-500 hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                            >
                                Aucun touge → Créer un touge
                            </Link>
                        ) : (
                            <div className="space-y-2">
                                {touges.map(touge => (
                                    <button
                                        key={touge.id}
                                        onClick={() => setSelectedTouge(touge)}
                                        className={`w-full p-4 border rounded text-left transition-colors ${selectedTouge?.id === touge.id
                                            ? "bg-yellow-500/20 border-yellow-500"
                                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                            }`}
                                    >
                                        <div className="font-bold">{touge.name}</div>
                                        <div className="text-sm text-zinc-500">
                                            {touge.distance.toFixed(1)}km • {touge.region}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Weather Selection */}
                    <div>
                        <label className="text-zinc-400 text-sm block mb-2">CONDITIONS MÉTÉO</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(["SEC", "PLUIE", "NUIT"] as Weather[]).map(weather => (
                                <button
                                    key={weather}
                                    onClick={() => setSelectedWeather(weather)}
                                    className={`p-4 border rounded text-center transition-colors ${selectedWeather === weather
                                        ? `bg-opacity-20 border-2 ${WEATHER_INFO[weather].color}`
                                        : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{WEATHER_INFO[weather].icon}</div>
                                    <div className={`text-sm font-bold ${WEATHER_INFO[weather].color}`}>
                                        {WEATHER_INFO[weather].label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => setIsSetupComplete(true)}
                        disabled={!selectedCar || !selectedTouge}
                        className="w-full py-4 bg-green-500 text-black font-bold text-lg rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                    >
                        <Play size={24} />
                        PRÉPARER LE RUN
                    </button>
                </div>
            </div>
        );
    }

    // Recording screen
    return (
        <div className="h-screen w-full bg-zinc-950 relative overflow-hidden">

            {/* Map (full screen) */}
            <div className="absolute inset-0">
                <RunMapView
                    tougePoints={selectedTouge?.routeGeometry || selectedTouge?.points || []}
                    currentPosition={currentPosition}
                    ghostPoints={gpsPoints.map(p => [p.lat, p.lng] as LatLng)}
                />
            </div>

            {/* HUD - Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4">
                    <div className="flex items-center justify-between">
                        {/* Car & Touge Info */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-yellow-500">
                                <CarIcon size={20} />
                                <span className="font-bold">{selectedCar?.name}</span>
                            </div>
                            <div className="text-zinc-500">|</div>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <MapPin size={16} />
                                <span>{selectedTouge?.name}</span>
                            </div>
                            <div className="text-2xl">{WEATHER_INFO[selectedWeather].icon}</div>
                        </div>

                        {/* GPS Status */}
                        <div className="flex items-center gap-2 text-xs">
                            {gpsError ? (
                                <span className="text-red-500 flex items-center gap-1">
                                    <AlertCircle size={14} /> {gpsError}
                                </span>
                            ) : (
                                <span className="text-green-500">
                                    GPS: ±{gpsAccuracy.toFixed(0)}m
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* HUD - Timer (center top) */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-yellow-500 rounded-lg px-8 py-4 text-center">
                    <div className="text-5xl font-bold text-yellow-500 font-mono">
                        {formatTime(elapsedTime)}
                    </div>
                    {isRecording && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-red-500">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            RECORDING
                        </div>
                    )}
                </div>
            </div>

            {/* HUD - Speed (right side) */}
            <div className="absolute top-40 right-4 z-[1000]">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 text-center w-32">
                    <Gauge size={20} className="mx-auto text-zinc-500 mb-1" />
                    <div className="text-3xl font-bold text-green-500">{currentSpeed.toFixed(0)}</div>
                    <div className="text-zinc-600 text-xs">km/h</div>
                    <div className="border-t border-zinc-800 mt-2 pt-2">
                        <div className="text-lg font-bold text-yellow-500">{maxSpeed.toFixed(0)}</div>
                        <div className="text-zinc-600 text-xs">MAX</div>
                    </div>
                </div>
            </div>

            {/* HUD - Stats (left side) */}
            <div className="absolute top-40 left-4 z-[1000]">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded p-4 w-32 space-y-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{gpsPoints.length}</div>
                        <div className="text-zinc-600 text-xs">Points GPS</div>
                    </div>
                    {currentPosition && (
                        <div className="text-center text-xs text-zinc-500 font-mono">
                            {currentPosition[0].toFixed(4)}<br />
                            {currentPosition[1].toFixed(4)}
                        </div>
                    )}
                </div>
            </div>

            {/* HUD - Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
                {!isRecording ? (
                    <button
                        onClick={startRun}
                        className="flex items-center gap-3 px-12 py-6 bg-green-500 text-black font-bold text-xl rounded-lg hover:bg-green-400 transition-colors shadow-lg shadow-green-500/30"
                    >
                        <Play size={32} />
                        DÉMARRER LE RUN
                    </button>
                ) : (
                    <button
                        onClick={stopRun}
                        disabled={gpsPoints.length < 2}
                        className="flex items-center gap-3 px-12 py-6 bg-red-500 text-white font-bold text-xl rounded-lg hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-500/30"
                    >
                        <Square size={32} />
                        TERMINER ({formatTime(elapsedTime)})
                    </button>
                )}
            </div>
        </div>
    );
}
