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
import { addRewards } from "../lib/profile";

// Dynamic map import
const RunMapView = dynamic(() => import("./RunMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-black flex items-center justify-center font-pixel">
            <div className="text-toxic-cyan text-xl animate-pulse glitch-hover">LOADING MAP...</div>
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

    // Rewards state
    const [runRewards, setRunRewards] = useState<{ xp: number, cr: number, ghostId: string } | null>(null);

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

            // Award XP and CR based on distance and speed and weather
            let weatherBonus = 1.0;
            if (selectedWeather === "PLUIE") weatherBonus = 1.2; // 20% bonus for rain
            if (selectedWeather === "NUIT") weatherBonus = 1.1;  // 10% bonus for night

            const rewards = addRewards(totalDistance, avgSpeed, weatherBonus);

            // Show rewards modal instead of redirecting immediately
            setRunRewards({ xp: rewards.gainedXp, cr: rewards.gainedCr, ghostId: ghostRun.id });
        }
    };

    // Setup screen
    if (!isSetupComplete) {
        return (
            <div className="min-h-screen bg-black text-white p-4 md:p-8 font-pixel">
                {/* Header */}
                <header className="mb-8 border-b-2 border-zinc-800 pb-4">
                    <Link href="/" className="inline-flex text-zinc-500 hover:text-toxic-cyan text-sm items-center gap-2 mb-4 uppercase tracking-widest hard-border px-3 py-1 border-2 border-transparent hover:border-toxic-cyan transition-colors">
                        <ArrowLeft size={14} /> Accueil
                    </Link>
                    <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest text-toxic-magenta text-shadow-neon glitch-hover">
                        START RUN
                    </h1>
                    <p className="text-zinc-500 mt-2 uppercase text-xs tracking-widest">Configure telemetry link</p>
                </header>

                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Driver Name */}
                    <div className="bg-zinc-950 p-4 border-2 border-zinc-800 hard-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <label className="text-toxic-cyan text-[10px] md:text-xs font-bold tracking-widest uppercase block mb-2">NOM DU PILOTE</label>
                        <input
                            type="text"
                            placeholder="Ton pseudo..."
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="w-full bg-black border-2 border-zinc-800 hard-border focus:border-toxic-cyan placeholder-zinc-700 outline-none px-4 py-3 text-lg text-white"
                        />
                    </div>

                    {/* Car Selection */}
                    <div className="bg-zinc-950 p-4 border-2 border-zinc-800 hard-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <label className="text-toxic-magenta text-[10px] md:text-xs font-bold tracking-widest uppercase block mb-3 flex items-center gap-2">
                            <CarIcon size={14} /> SÉLECTIONNE TA VOITURE
                        </label>
                        {cars.length === 0 ? (
                            <Link
                                href="/cars"
                                className="block w-full bg-black border-2 border-dashed border-zinc-800 hard-border p-6 text-center text-zinc-500 hover:border-toxic-cyan hover:text-toxic-cyan transition-colors uppercase tracking-widest text-sm"
                            >
                                Aucune voiture → Aller au Garage
                            </Link>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cars.map(car => (
                                    <button
                                        key={car.id}
                                        onClick={() => setSelectedCar(car)}
                                        className={`p-4 border-2 text-left hard-border transition-colors ${selectedCar?.id === car.id
                                            ? "bg-toxic-magenta/20 border-toxic-magenta text-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                                            : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-500"
                                            }`}
                                    >
                                        <div className="font-bold uppercase tracking-widest">{car.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-1 uppercase">
                                            {car.power}ch • {car.weight}kg • {car.drivetrain}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Touge Selection */}
                    <div className="bg-zinc-950 p-4 border-2 border-zinc-800 hard-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <label className="text-toxic-yellow text-[10px] md:text-xs font-bold tracking-widest uppercase block mb-3 flex items-center gap-2">
                            <MapPin size={14} /> SÉLECTIONNE LE TOUGE
                        </label>
                        {touges.length === 0 ? (
                            <Link
                                href="/conquest/builder"
                                className="block w-full bg-black border-2 border-dashed border-zinc-800 hard-border p-6 text-center text-zinc-500 hover:border-toxic-yellow hover:text-toxic-yellow transition-colors uppercase tracking-widest text-sm"
                            >
                                Aucun touge → Route Builder
                            </Link>
                        ) : (
                            <div className="space-y-2">
                                {touges.map(touge => (
                                    <button
                                        key={touge.id}
                                        onClick={() => setSelectedTouge(touge)}
                                        className={`w-full p-4 border-2 text-left hard-border transition-colors ${selectedTouge?.id === touge.id
                                            ? "bg-toxic-yellow/20 border-toxic-yellow text-toxic-yellow shadow-[0_0_10px_rgba(255,255,0,0.2)]"
                                            : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-500"
                                            }`}
                                    >
                                        <div className="font-bold uppercase tracking-widest">{touge.name}</div>
                                        <div className="text-[10px] text-zinc-500 mt-1 uppercase">
                                            {touge.distance.toFixed(1)}km • {touge.region}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Weather Selection */}
                    <div className="bg-zinc-950 p-4 border-2 border-zinc-800 hard-border shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <label className="text-toxic-green text-[10px] md:text-xs font-bold tracking-widest uppercase block mb-3">CONDITIONS MÉTÉO</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(["SEC", "PLUIE", "NUIT"] as Weather[]).map(weather => {
                                const isSelected = selectedWeather === weather;
                                let colorClass = "";
                                if (weather === "SEC") colorClass = isSelected ? "border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.4)] bg-white/10" : "text-zinc-500";
                                if (weather === "PLUIE") colorClass = isSelected ? "border-toxic-cyan text-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.4)] bg-toxic-cyan/10" : "text-zinc-500";
                                if (weather === "NUIT") colorClass = isSelected ? "border-toxic-magenta text-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.4)] bg-toxic-magenta/10" : "text-zinc-500";

                                return (
                                    <button
                                        key={weather}
                                        onClick={() => setSelectedWeather(weather)}
                                        className={`p-4 border-2 hard-border text-center transition-all flex flex-col items-center justify-center ${isSelected
                                            ? colorClass
                                            : "bg-black border-zinc-800 hover:border-zinc-500"
                                            }`}
                                    >
                                        <div className="text-2xl md:text-3xl mb-1">{WEATHER_INFO[weather].icon}</div>
                                        <div className={`text-[10px] md:text-xs font-bold uppercase tracking-widest`}>
                                            {WEATHER_INFO[weather].label}
                                        </div>
                                        {weather === "PLUIE" && <div className="text-[8px] md:text-[10px] text-toxic-cyan mt-1 font-bold tracking-widest">+20% XP/CR</div>}
                                        {weather === "NUIT" && <div className="text-[8px] md:text-[10px] text-toxic-magenta mt-1 font-bold tracking-widest">+10% XP/CR</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => setIsSetupComplete(true)}
                        disabled={!selectedCar || !selectedTouge}
                        className="w-full py-4 bg-toxic-green text-black font-bold text-xl hard-border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors flex items-center justify-center gap-3 uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,65,0.4)] glitch-hover"
                    >
                        <Play size={24} />
                        CONNECT TELEMETRY
                    </button>
                    <div className="h-12" /> {/* Mobile bottom spacer */}
                </div>
            </div>
        );
    }

    // Recording screen
    return (
        <div className="h-[100dvh] w-full bg-black relative overflow-hidden font-pixel">

            {/* Map (full screen, behind HUD) */}
            <div className="absolute inset-0 top-24 md:top-32 bottom-24">
                <RunMapView
                    tougePoints={selectedTouge?.routeGeometry || selectedTouge?.points || []}
                    currentPosition={currentPosition}
                    ghostPoints={gpsPoints.map(p => [p.lat, p.lng] as LatLng)}
                />
            </div>

            {/* UNIFIED HUD - Top (Mobile friendly) */}
            <div className="absolute top-0 left-0 right-0 z-[1000]">
                <div className="bg-black/95 backdrop-blur-md border-b-2 border-zinc-800 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">

                    {/* Info Row */}
                    <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2 mb-2">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">
                            <span className="text-toxic-cyan font-bold truncate max-w-[80px] md:max-w-[200px]">{selectedCar?.name}</span>
                            <span className="text-zinc-600">|</span>
                            <span className="text-zinc-400 truncate max-w-[80px] md:max-w-[200px] pl-1">{selectedTouge?.name}</span>
                            <span className="text-base leading-none pl-1">{WEATHER_INFO[selectedWeather].icon}</span>
                        </div>
                        <div className="text-[10px] md:text-xs font-bold tracking-widest">
                            {gpsError ? (
                                <span className="text-red-500 animate-pulse">{gpsError}</span>
                            ) : (
                                <span className="text-toxic-green text-shadow-[0_0_5px_rgba(0,255,65,0.5)]">GPS: ±{gpsAccuracy.toFixed(0)}m</span>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                        {/* Left: Waypoints */}
                        <div className="text-center w-16 md:w-24">
                            <div className="text-xl md:text-2xl font-bold text-toxic-magenta">{gpsPoints.length}</div>
                            <div className="text-zinc-600 text-[10px] uppercase tracking-widest">PTS</div>
                        </div>

                        {/* Center: Timer */}
                        <div className="text-center flex-1">
                            <div className="text-4xl md:text-5xl font-bold text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.3)]">
                                {formatTime(elapsedTime)}
                            </div>
                            {isRecording && (
                                <div className="text-red-500 text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1 mt-1 font-bold">
                                    <span className="w-2 h-2 bg-red-500 rounded-none animate-pulse"></span>
                                    REC
                                </div>
                            )}
                        </div>

                        {/* Right: Speed */}
                        <div className="text-center w-20 md:w-24 border-l-2 border-zinc-800 pl-2">
                            <div className="text-2xl md:text-3xl font-bold text-toxic-green">{currentSpeed.toFixed(0)}</div>
                            <div className="text-zinc-600 text-[10px] uppercase tracking-widest border-b-2 border-zinc-800 pb-1 mb-1">KM/H</div>
                            <div className="text-xs md:text-sm font-bold text-zinc-400">{maxSpeed.toFixed(0)} <span className="text-[8px] text-zinc-600">MAX</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HUD - Bottom Controls */}
            <div className="absolute bottom-6 inset-x-4 flex justify-center z-[1000]">
                {!isRecording ? (
                    <button
                        onClick={startRun}
                        className="w-full md:w-auto md:min-w-[300px] flex justify-center items-center gap-2 px-8 py-3 md:py-4 bg-toxic-green text-black font-bold text-xl hard-border border-2 border-toxic-green hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,65,0.4)] glitch-hover uppercase tracking-widest"
                    >
                        <Play size={24} />
                        START RUN
                    </button>
                ) : (
                    <button
                        onClick={stopRun}
                        disabled={gpsPoints.length < 2}
                        className="w-full md:w-auto md:min-w-[300px] flex justify-center items-center gap-2 px-8 py-3 md:py-4 bg-toxic-magenta text-white font-bold text-xl hard-border border-2 border-toxic-magenta hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_rgba(255,0,255,0.4)] glitch-hover uppercase tracking-widest"
                    >
                        <Square size={24} />
                        STOP RUN
                    </button>
                )}
            </div>

            {/* REWARDS MODAL */}
            <AnimatePresence>
                {runRewards && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-black border-2 border-toxic-yellow hard-border p-6 md:p-8 max-w-md w-full text-center shadow-[0_0_30px_rgba(255,255,0,0.3)]"
                        >
                            <Trophy size={48} className="text-toxic-yellow mx-auto mb-4" />
                            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-toxic-yellow mb-2 text-shadow-[0_0_10px_rgba(255,255,0,0.5)] glitch-hover">
                                TELEMETRY SAVED
                            </h2>
                            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-widest mb-8 border-b-2 border-zinc-800 pb-4">
                                Données de télémétrie transférées au Network.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-zinc-950 border-2 border-zinc-800 hard-border p-3">
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">EXPÉRIENCE</div>
                                    <div className="text-xl md:text-2xl font-bold text-toxic-yellow">+{runRewards.xp} <span className="text-xs">XP</span></div>
                                </div>
                                <div className="bg-zinc-950 border-2 border-zinc-800 hard-border p-3">
                                    <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">CRÉDITS</div>
                                    <div className="text-xl md:text-2xl font-bold text-toxic-green">+{runRewards.cr} <span className="text-xs">CR</span></div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/ghosts/detail?id=${runRewards.ghostId}`)}
                                className="w-full py-4 bg-toxic-yellow border-2 border-toxic-yellow text-black uppercase tracking-widest font-bold text-sm md:text-lg hover:bg-white hard-border transition-colors shadow-[0_0_15px_rgba(255,255,0,0.4)]"
                            >
                                CONTINUER ({selectedWeather === "PLUIE" ? "BONUS PLUIE" : selectedWeather === "NUIT" ? "BONUS NUIT" : "BASE"}) →
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
