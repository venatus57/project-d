"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Car as CarIcon, MapPin, Play, Square, Trophy, Satellite, Camera, Siren,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Weather, GhostRun, GhostPoint, WEATHER_INFO, STORAGE_KEYS, LatLng, UserRoute } from "../lib/types";
import { addRewards } from "../lib/profile";
import { loadJSON, loadGhosts, saveGhosts, loadRoutes } from "../lib/storage";
import { formatTime } from "../lib/format";
import { distanceKm, pathDistanceKm, speedKmh } from "../lib/geo";
import { fetchRadars, routeBBox, Radar } from "../lib/radars";
import { loadSpots, PoliceSpot } from "../lib/spots";
import { PageShell, PageHeader, Btn, BtnLink, fadeUp, stagger } from "@/components/ui";

type HazardAlert = {
    kind: "radar" | "police";
    distM: number;
    maxspeed?: string;
};

const RunMapView = dynamic(() => import("./RunMapView"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full grid place-items-center">
            <div className="kicker text-ice animate-pulse">Chargement de la carte…</div>
        </div>
    ),
});

export default function RunPage() {
    const router = useRouter();

    // Setup state
    const [cars, setCars] = useState<Car[]>([]);
    const [touges, setTouges] = useState<UserRoute[]>([]);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [selectedTouge, setSelectedTouge] = useState<UserRoute | null>(null);
    const [selectedWeather, setSelectedWeather] = useState<Weather>("SEC");
    const [driverName, setDriverName] = useState("");
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [gpsPoints, setGpsPoints] = useState<GhostPoint[]>([]);
    const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(0);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Timer / speed state
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [maxSpeed, setMaxSpeed] = useState(0);

    const [runRewards, setRunRewards] = useState<{ ghostId: string } | null>(null);

    // Hazards (fixed speed cameras + personal police spots)
    const [radars, setRadars] = useState<Radar[]>([]);
    const [spots, setSpots] = useState<PoliceSpot[]>([]);
    const [hazardAlert, setHazardAlert] = useState<HazardAlert | null>(null);
    const alertedRef = useRef<Set<string>>(new Set());
    // Refs so the long-lived GPS callback always sees fresh data
    const radarsRef = useRef<Radar[]>([]);
    const spotsRef = useRef<PoliceSpot[]>([]);

    // Refs — GPS callbacks live outside React's render cycle, so mutable
    // values must be read from refs, never from captured state.
    const watchIdRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef(0);
    const maxSpeedRef = useRef(0);
    const lastPointRef = useRef<GhostPoint | null>(null);
    const pointsRef = useRef<GhostPoint[]>([]);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        setCars(loadJSON<Car[]>(STORAGE_KEYS.CARS, []));
        setTouges(loadRoutes());
    }, []);

    // Load hazards around the selected touge when entering the run screen
    useEffect(() => {
        if (!isSetupComplete || !selectedTouge) return;
        const currentSpots = loadSpots();
        spotsRef.current = currentSpots;
        setSpots(currentSpots);

        const bbox = routeBBox(selectedTouge.routeGeometry?.length ? selectedTouge.routeGeometry : selectedTouge.points);
        if (bbox) {
            fetchRadars(bbox, 200)
                .then((r) => {
                    radarsRef.current = r;
                    setRadars(r);
                })
                .catch(() => {
                    radarsRef.current = [];
                    setRadars([]);
                });
        }
    }, [isSetupComplete, selectedTouge]);

    // Waze-style proximity check against the latest GPS fix
    const checkHazards = (lat: number, lng: number) => {
        let best: (HazardAlert & { key: string }) | null = null;

        for (const r of radarsRef.current) {
            const d = distanceKm([lat, lng], [r.lat, r.lng]) * 1000;
            if (d < 600 && (!best || d < best.distM)) {
                best = { kind: "radar", distM: d, maxspeed: r.maxspeed, key: `radar-${r.id}` };
            }
        }
        for (const s of spotsRef.current) {
            const d = distanceKm([lat, lng], [s.lat, s.lng]) * 1000;
            if (d < 600 && (!best || d < best.distM)) {
                best = { kind: "police", distM: d, key: `police-${s.id}` };
            }
        }

        if (best) {
            setHazardAlert({ kind: best.kind, distM: best.distM, maxspeed: best.maxspeed });
            if (!alertedRef.current.has(best.key)) {
                alertedRef.current.add(best.key);
                navigator.vibrate?.(best.kind === "radar" ? [250, 120, 250] : [120, 80, 120, 80, 120]);
            }
        } else {
            setHazardAlert(null);
        }
    };

    const stopWatchers = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        wakeLockRef.current?.release().catch(() => { });
        wakeLockRef.current = null;
    }, []);

    // Cleanup on unmount
    useEffect(() => stopWatchers, [stopWatchers]);

    const startRun = async () => {
        if (!navigator.geolocation) {
            setGpsError("Géolocalisation non supportée par ce navigateur.");
            return;
        }

        setGpsError(null);
        setGpsPoints([]);
        setElapsedTime(0);
        setCurrentSpeed(0);
        setMaxSpeed(0);
        pointsRef.current = [];
        lastPointRef.current = null;
        maxSpeedRef.current = 0;
        startTimeRef.current = Date.now();
        setIsRecording(true);

        // Keep the screen on while recording (best effort)
        try {
            wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
        } catch { }

        timerRef.current = setInterval(() => {
            setElapsedTime(Date.now() - startTimeRef.current);
        }, 100);

        const onSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy, speed } = position.coords;
            const timestamp = Date.now() - startTimeRef.current;

            const newPoint: GhostPoint = {
                lat: latitude,
                lng: longitude,
                timestamp,
                speed: speed !== null && speed >= 0 ? speed * 3.6 : undefined,
            };

            // Derive speed from the previous point when the device doesn't provide it
            const last = lastPointRef.current;
            if (newPoint.speed === undefined && last) {
                newPoint.speed = speedKmh([last.lat, last.lng], [latitude, longitude], timestamp - last.timestamp);
            }

            if (newPoint.speed !== undefined) {
                setCurrentSpeed(newPoint.speed);
                if (newPoint.speed > maxSpeedRef.current) {
                    maxSpeedRef.current = newPoint.speed;
                    setMaxSpeed(newPoint.speed);
                }
            }

            lastPointRef.current = newPoint;
            pointsRef.current = [...pointsRef.current, newPoint];
            setCurrentPosition([latitude, longitude]);
            setGpsAccuracy(accuracy);
            setGpsPoints(pointsRef.current);
            checkHazards(latitude, longitude);
        };

        const onError = (error: GeolocationPositionError) => {
            setGpsError("Erreur GPS : " + error.message);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    };

    const stopRun = () => {
        stopWatchers();
        setIsRecording(false);

        const points = pointsRef.current;
        const totalTime = Date.now() - startTimeRef.current;

        if (points.length < 2 || !selectedCar || !selectedTouge) {
            setGpsError("Pas assez de points GPS pour enregistrer ce run.");
            return;
        }

        const totalDistance = pathDistanceKm(points.map((p) => [p.lat, p.lng] as LatLng));
        const avgSpeed = totalTime > 0 ? totalDistance / (totalTime / 3_600_000) : 0;

        const ghostRun: GhostRun = {
            id: Date.now().toString(),
            tougeId: selectedTouge.id,
            tougeName: selectedTouge.name,
            carId: selectedCar.id,
            carName: selectedCar.name,
            weather: selectedWeather,
            points,
            totalTime,
            totalDistance,
            avgSpeed,
            maxSpeed: maxSpeedRef.current,
            date: new Date().toISOString(),
            driverName: driverName.trim() || "Anonyme",
        };

        saveGhosts([...loadGhosts(), ghostRun]);
        addRewards(totalDistance, avgSpeed);
        setRunRewards({ ghostId: ghostRun.id });
    };

    /* ============================================================
       SETUP SCREEN
       ============================================================ */
    if (!isSetupComplete) {
        return (
            <PageShell className="max-w-3xl">
                <PageHeader
                    kicker="Telemetry link"
                    title="Start run"
                    sub="Configure ton pilote, ta machine et ton touge avant le départ."
                />

                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    {/* Driver name */}
                    <motion.div variants={fadeUp} className="glass p-5">
                        <label className="label text-ice block mb-2">Nom du pilote</label>
                        <input
                            type="text"
                            placeholder="Ton pseudo…"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="field text-lg"
                        />
                    </motion.div>

                    {/* Car */}
                    <motion.div variants={fadeUp} className="glass p-5">
                        <label className="label text-accent mb-3 flex items-center gap-2">
                            <CarIcon size={13} /> Sélectionne ta voiture
                        </label>
                        {cars.length === 0 ? (
                            <BtnLink href="/cars" variant="outline" className="w-full border-dashed">
                                Aucune voiture — aller au garage
                            </BtnLink>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {cars.map((car) => (
                                    <button
                                        key={car.id}
                                        onClick={() => setSelectedCar(car)}
                                        className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${selectedCar?.id === car.id
                                            ? "bg-accent/12 border-accent/60 shadow-[0_0_24px_-8px_rgba(216,79,196,0.5)]"
                                            : "bg-black/25 border-line hover:border-white/25"
                                            }`}
                                    >
                                        <div className={`font-display font-bold uppercase tracking-wide ${selectedCar?.id === car.id ? "text-white" : "text-zinc-300"}`}>
                                            {car.name}
                                        </div>
                                        <div className="label mt-1">
                                            {car.power} ch · {car.weight} kg · {car.drivetrain}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Touge */}
                    <motion.div variants={fadeUp} className="glass p-5">
                        <label className="label text-gold mb-3 flex items-center gap-2">
                            <MapPin size={13} /> Sélectionne le touge
                        </label>
                        {touges.length === 0 ? (
                            <BtnLink href="/conquest/builder" variant="outline" className="w-full border-dashed">
                                Aucun touge — ouvrir le Route Builder
                            </BtnLink>
                        ) : (
                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {touges.map((touge) => (
                                    <button
                                        key={touge.id}
                                        onClick={() => setSelectedTouge(touge)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${selectedTouge?.id === touge.id
                                            ? "bg-gold/12 border-gold/60 shadow-[0_0_24px_-8px_rgba(255,194,51,0.5)]"
                                            : "bg-black/25 border-line hover:border-white/25"
                                            }`}
                                    >
                                        <div className={`font-display font-bold uppercase tracking-wide ${selectedTouge?.id === touge.id ? "text-white" : "text-zinc-300"}`}>
                                            {touge.name}
                                        </div>
                                        <div className="label mt-1">
                                            {touge.distance.toFixed(1)} km · {touge.region}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Weather */}
                    <motion.div variants={fadeUp} className="glass p-5">
                        <label className="label text-mint block mb-3">Conditions</label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {(["SEC", "PLUIE", "NUIT"] as Weather[]).map((weather) => {
                                const selected = selectedWeather === weather;
                                return (
                                    <button
                                        key={weather}
                                        onClick={() => setSelectedWeather(weather)}
                                        className={`p-4 rounded-xl border text-center transition-all active:scale-[0.97] ${selected
                                            ? "bg-white/10 border-white/50"
                                            : "bg-black/25 border-line hover:border-white/25"
                                            }`}
                                    >
                                        <div className="text-2xl md:text-3xl mb-1.5">{WEATHER_INFO[weather].icon}</div>
                                        <div className={`text-xs font-display font-bold uppercase tracking-widest ${selected ? "text-white" : "text-zinc-500"}`}>
                                            {WEATHER_INFO[weather].label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                        <Btn
                            onClick={() => setIsSetupComplete(true)}
                            disabled={!selectedCar || !selectedTouge}
                            className="w-full py-4! text-base!"
                        >
                            <Play size={20} /> Connecter la télémétrie
                        </Btn>
                    </motion.div>
                </motion.div>
            </PageShell>
        );
    }

    /* ============================================================
       RECORDING SCREEN
       ============================================================ */
    return (
        <div className="map-screen">
            {/* Map behind the HUD */}
            <div className="absolute inset-0">
                <RunMapView
                    tougePoints={selectedTouge?.routeGeometry || selectedTouge?.points || []}
                    currentPosition={currentPosition}
                    ghostPoints={gpsPoints.map((p) => [p.lat, p.lng] as LatLng)}
                    radars={radars}
                    spots={spots}
                />
            </div>

            {/* ===== HAZARD ALERT (Waze-style) ===== */}
            <AnimatePresence>
                {hazardAlert && (
                    <motion.div
                        initial={{ y: -20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.95 }}
                        className="absolute top-32 md:top-36 inset-x-4 z-[600] flex justify-center pointer-events-none"
                    >
                        <div
                            className={`hud px-5 py-3 flex items-center gap-3 border-2! ${hazardAlert.kind === "radar"
                                ? "border-flame!"
                                : "border-blue-500!"
                                }`}
                        >
                            {hazardAlert.kind === "radar" ? (
                                <Camera size={22} className="text-flame animate-pulse" />
                            ) : (
                                <Siren size={22} className="text-blue-400 animate-pulse" />
                            )}
                            <div>
                                <div
                                    className={`font-display uppercase tracking-widest text-lg leading-none ${hazardAlert.kind === "radar" ? "text-flame" : "text-blue-400"
                                        }`}
                                >
                                    {hazardAlert.kind === "radar" ? "Radar" : "Police"} — {Math.round(hazardAlert.distM / 10) * 10} m
                                </div>
                                {hazardAlert.maxspeed && (
                                    <div className="label mt-0.5">Limite {hazardAlert.maxspeed} km/h</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== TOP HUD ===== */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-3 inset-x-3 z-[500]"
            >
                <div className="hud edge-accent p-3.5 max-w-3xl mx-auto">
                    {/* Context row */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-line text-[11px] font-semibold uppercase tracking-widest">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-ice truncate max-w-[7rem] md:max-w-[14rem]">{selectedCar?.name}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="text-zinc-400 truncate max-w-[7rem] md:max-w-[14rem]">{selectedTouge?.name}</span>
                            <span className="text-sm leading-none">{WEATHER_INFO[selectedWeather].icon}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {gpsError ? (
                                <span className="text-red-400 animate-pulse normal-case">{gpsError}</span>
                            ) : (
                                <>
                                    <Satellite size={11} className="text-mint" />
                                    <span className="text-mint mono-num">±{gpsAccuracy.toFixed(0)} m</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Telemetry row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-center w-14 md:w-20">
                            <div className="mono-num text-xl md:text-2xl font-bold text-haze">{gpsPoints.length}</div>
                            <div className="label">pts</div>
                        </div>

                        <div className="text-center flex-1">
                            <div className="mono-num text-4xl md:text-5xl font-bold text-gold [text-shadow:0_0_24px_rgba(255,194,51,0.35)]">
                                {formatTime(elapsedTime)}
                            </div>
                            {isRecording && (
                                <div className="flex items-center justify-center gap-1.5 mt-1 text-red-400 label text-red-400!">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot" />
                                    Rec
                                </div>
                            )}
                        </div>

                        <div className="text-center w-16 md:w-24 border-l border-line pl-3">
                            <div className="mono-num text-2xl md:text-3xl font-bold text-mint">{currentSpeed.toFixed(0)}</div>
                            <div className="label">km/h</div>
                            <div className="mono-num text-xs text-zinc-500 mt-0.5">max {maxSpeed.toFixed(0)}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ===== BOTTOM CONTROLS ===== */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-5 inset-x-4 z-[500] flex justify-center"
            >
                {!isRecording ? (
                    <Btn onClick={startRun} className="w-full md:w-auto md:min-w-[320px] py-4! text-base!">
                        <Play size={20} /> Démarrer le run
                    </Btn>
                ) : (
                    <Btn
                        onClick={stopRun}
                        variant="outline"
                        className="w-full md:w-auto md:min-w-[320px] py-4! text-base! border-red-500/60! text-red-400! hover:bg-red-500! hover:text-black!"
                    >
                        <Square size={20} /> Arrêter le run
                    </Btn>
                )}
            </motion.div>

            {/* ===== SUMMARY MODAL ===== */}
            <AnimatePresence>
                {runRewards && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[900] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 24 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 26 }}
                            className="hud edge-accent p-7 md:p-9 max-w-md w-full text-center"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
                                className="mx-auto mb-5 grid place-items-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/40"
                            >
                                <Trophy size={30} className="text-gold" />
                            </motion.div>
                            <h2 className="title-xl text-2xl md:text-3xl text-gold mb-2">Run terminé</h2>
                            <div className="mono-num text-4xl font-bold text-white mb-3">{formatTime(elapsedTime)}</div>
                            <p className="text-zinc-500 text-sm mb-7">
                                Télémétrie sauvegardée. Distance ajoutée à ton odomètre.
                            </p>
                            <Btn
                                onClick={() => router.push(`/ghosts/detail?id=${runRewards.ghostId}`)}
                                className="w-full py-4!"
                            >
                                Analyser la télémétrie →
                            </Btn>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
