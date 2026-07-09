"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { allCircuits } from "@/app/touge/data";
import { Navigation2, Camera, Siren, Plus } from "lucide-react";
import { LatLng, UserRoute } from "@/app/lib/types";
import { loadRoutes } from "@/app/lib/storage";
import { fetchRadars, Radar } from "@/app/lib/radars";
import { loadSpots, addSpot, removeSpot, PoliceSpot } from "@/app/lib/spots";
import RadarMarkers from "@/components/map/RadarMarkers";
import SpotMarkers from "@/components/map/SpotMarkers";
import { DIFFICULTY_STYLE, Difficulty } from "@/components/ui";

type ExplorerRoute = UserRoute & { isOfficial?: boolean };

type RadarStatus = "idle" | "loading" | "zoom" | "error";

const RADAR_MIN_ZOOM = 9;

function LocationManager({ center, zoom }: { center: LatLng; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.4 });
    }, [center, zoom, map]);
    return null;
}

// Loads fixed speed cameras (OpenStreetMap) for the visible area
function RadarLayer({
    enabled,
    onRadars,
    onStatus,
}: {
    enabled: boolean;
    onRadars: (r: Radar[]) => void;
    onStatus: (s: RadarStatus) => void;
}) {
    const map = useMap();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const load = () => {
        if (!enabled) return;
        if (map.getZoom() < RADAR_MIN_ZOOM) {
            onRadars([]);
            onStatus("zoom");
            return;
        }
        const id = ++requestIdRef.current;
        onStatus("loading");
        const b = map.getBounds();
        fetchRadars({
            south: b.getSouth(),
            west: b.getWest(),
            north: b.getNorth(),
            east: b.getEast(),
        })
            .then((radars) => {
                if (id !== requestIdRef.current) return;
                onRadars(radars);
                onStatus("idle");
            })
            .catch(() => {
                if (id !== requestIdRef.current) return;
                onStatus("error");
            });
    };

    useMapEvents({
        moveend: () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(load, 700);
        },
    });

    useEffect(() => {
        if (enabled) load();
        else {
            onRadars([]);
            onStatus("idle");
        }
    }, [enabled]);

    return null;
}

// Click-to-report police spots
function ReportHandler({ active, onReport }: { active: boolean; onReport: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            if (active) onReport([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

export default function MapExplorerClient() {
    const router = useRouter();
    const [routes, setRoutes] = useState<ExplorerRoute[]>([]);
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLng>([46.2276, 2.2137]); // France
    const [mapZoom, setMapZoom] = useState(5);

    // Radars
    const [showRadars, setShowRadars] = useState(false);
    const [radars, setRadars] = useState<Radar[]>([]);
    const [radarStatus, setRadarStatus] = useState<RadarStatus>("idle");

    // Police spots
    const [spots, setSpots] = useState<PoliceSpot[]>([]);
    const [reportMode, setReportMode] = useState(false);
    const [pendingSpot, setPendingSpot] = useState<LatLng | null>(null);

    useEffect(() => {
        const customRoutes: ExplorerRoute[] = loadRoutes().map((r) => ({ ...r, isOfficial: false }));

        const officialRoutes: ExplorerRoute[] = allCircuits
            .map((c) => ({
                id: c.id,
                name: c.name,
                points: c.routePoints || [],
                routeGeometry: c.routePoints || [],
                distance: c.lengthKm || 0,
                createdAt: "OFFICIAL",
                type: "MIXED" as const,
                difficulty: (c.difficulty || "MEDIUM") as Difficulty,
                region: c.location,
                isOfficial: true,
            }))
            .filter((r) => r.points.length > 0);

        setRoutes([...officialRoutes, ...customRoutes]);
        setSpots(loadSpots());
    }, []);

    const locateMe = () => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                const loc: LatLng = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(loc);
                setMapCenter(loc);
                setMapZoom(11);
            },
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    };

    const radarButtonLabel = () => {
        if (!showRadars) return "Radars off";
        if (radarStatus === "loading") return "Scan…";
        if (radarStatus === "zoom") return "Zoome +";
        if (radarStatus === "error") return "Erreur réseau";
        return `${radars.length} radar${radars.length > 1 ? "s" : ""}`;
    };

    return (
        <div className={`map-screen ${reportMode ? "report-mode" : ""}`}>
            <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full" zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <LocationManager center={mapCenter} zoom={mapZoom} />
                <RadarLayer enabled={showRadars} onRadars={setRadars} onStatus={setRadarStatus} />
                <ReportHandler active={reportMode} onReport={(ll) => setPendingSpot(ll)} />

                {/* User GPS marker */}
                {userLocation && (
                    <>
                        <CircleMarker
                            center={userLocation}
                            radius={18}
                            pathOptions={{ fillColor: "#38e1ff", fillOpacity: 0.15, stroke: false }}
                        />
                        <CircleMarker
                            center={userLocation}
                            radius={6}
                            pathOptions={{ color: "#ffffff", fillColor: "#38e1ff", fillOpacity: 1, weight: 2 }}
                        />
                    </>
                )}

                {/* Routes */}
                {routes.map((route) => {
                    const displayPoints =
                        route.routeGeometry && route.routeGeometry.length > 0 ? route.routeGeometry : route.points;
                    if (!displayPoints || displayPoints.length === 0) return null;

                    const color = DIFFICULTY_STYLE[route.difficulty]?.hex || "#d84fc4";

                    return (
                        <Fragment key={`${route.isOfficial ? "off" : "usr"}-${route.id}`}>
                            <Polyline
                                positions={displayPoints}
                                pathOptions={{
                                    color,
                                    weight: route.isOfficial ? 6 : 4,
                                    opacity: 0.6,
                                    lineCap: "round",
                                    lineJoin: "round",
                                }}
                            />
                            <CircleMarker
                                center={displayPoints[0]}
                                radius={8}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
                            >
                                <Popup className="pd-popup">
                                    <div className="hud rounded-xl! p-4 min-w-[210px]">
                                        <div className="label mb-1">
                                            {route.isOfficial ? "Touge officiel" : "Tracé personnalisé"}
                                        </div>
                                        <h3
                                            className="font-display uppercase tracking-wider text-base mb-1"
                                            style={{ color }}
                                        >
                                            {route.name}
                                        </h3>
                                        <div className="text-xs text-zinc-400 mb-3 font-semibold uppercase tracking-widest">
                                            {route.distance.toFixed(2)} km · {route.difficulty}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                router.push(
                                                    route.isOfficial ? `/touge/${route.id}` : `/conquest/detail?id=${route.id}`
                                                );
                                            }}
                                            className="w-full py-2.5 rounded-lg bg-white/8 border border-line hover:border-white/40 text-white text-xs font-display uppercase tracking-widest transition-colors"
                                        >
                                            Examiner
                                        </button>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </Fragment>
                    );
                })}

                {/* Radars + police spots */}
                {showRadars && <RadarMarkers radars={radars} />}
                <SpotMarkers spots={spots} onDelete={(id) => setSpots(removeSpot(id))} />
            </MapContainer>

            {/* HUD title */}
            <div className="absolute top-3 left-3 z-[500] pointer-events-none">
                <div className="hud px-4 py-3">
                    <div className="label mb-0.5">Project D — Réseau</div>
                    <div className="font-display uppercase tracking-widest text-white text-lg">Carte globale</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                        <span className="label text-accent!">{routes.length} routes</span>
                        {spots.length > 0 && (
                            <span className="label text-ice! ml-2">{spots.length} spot{spots.length > 1 ? "s" : ""}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Layer toggles */}
            <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2 items-end">
                <button
                    onClick={() => setShowRadars((v) => !v)}
                    className={`hud rounded-xl! px-3.5 py-2.5 flex items-center gap-2 transition-colors text-xs font-display uppercase tracking-widest ${showRadars ? "text-black bg-white! border-white!" : "text-zinc-300 hover:text-white"
                        }`}
                >
                    <Camera size={15} className={showRadars && radarStatus === "loading" ? "animate-pulse" : ""} />
                    {radarButtonLabel()}
                </button>
                <button
                    onClick={() => setReportMode((v) => !v)}
                    className={`hud rounded-xl! px-3.5 py-2.5 flex items-center gap-2 transition-colors text-xs font-display uppercase tracking-widest ${reportMode ? "text-white bg-blue-700! border-blue-400!" : "text-zinc-300 hover:text-white"
                        }`}
                >
                    <Siren size={15} className={reportMode ? "animate-pulse" : ""} />
                    {reportMode ? "Touche la carte" : "Signaler police"}
                </button>
            </div>

            {/* Pending spot confirmation */}
            {pendingSpot && (
                <div className="absolute inset-x-3 bottom-20 md:bottom-5 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-[700]">
                    <div className="hud p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:min-w-[420px]">
                        <div className="flex items-center gap-2.5 flex-1">
                            <span className="police-pin" style={{ width: 24, height: 24, fontSize: 12 }}>P</span>
                            <span className="text-sm font-semibold text-white">Spot police ici ?</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSpots(addSpot(pendingSpot[0], pendingSpot[1], false));
                                    setPendingSpot(null);
                                    setReportMode(false);
                                }}
                                className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-display uppercase tracking-widest hover:bg-blue-500 transition-colors"
                            >
                                1 heure
                            </button>
                            <button
                                onClick={() => {
                                    setSpots(addSpot(pendingSpot[0], pendingSpot[1], true));
                                    setPendingSpot(null);
                                    setReportMode(false);
                                }}
                                className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-blue-400/50 text-blue-300 text-xs font-display uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                            >
                                <Plus size={12} className="inline mr-1 -mt-0.5" />
                                Permanent
                            </button>
                            <button
                                onClick={() => setPendingSpot(null)}
                                className="px-4 py-2.5 rounded-lg border border-line text-zinc-400 text-xs font-display uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Locate button */}
            <button
                onClick={locateMe}
                className="absolute bottom-5 right-3 z-[500] hud rounded-xl! p-3 text-ice hover:bg-ice hover:text-black transition-colors flex items-center gap-2"
                title="Centrer sur ma position"
            >
                <Navigation2 size={16} />
                <span className="label text-inherit! hidden md:inline">Localiser</span>
            </button>
        </div>
    );
}
