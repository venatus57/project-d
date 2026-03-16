"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { allCircuits } from "@/app/touge/data";
import { Navigation2 } from "lucide-react";

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
    isOfficial?: boolean;
};

// Component to handle flying to user location
function LocationManager({ center, zoom }: { center: LatLng, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

export default function MapExplorerClient() {
    const router = useRouter();
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLng>([46.2276, 2.2137]); // France center
    const [mapZoom, setMapZoom] = useState<number>(5);

    useEffect(() => {
        // Load custom routes
        let customRoutes: RouteData[] = [];
        try {
            const saved = window.localStorage.getItem("projectd_routes");
            if (saved) {
                customRoutes = JSON.parse(saved).map((r: any) => ({
                    ...r,
                    isOfficial: false
                }));
            }
        } catch { }

        // Format official routes
        const officialRoutes: RouteData[] = allCircuits.map(c => ({
            id: c.id,
            name: c.name,
            points: c.routePoints || [],
            routeGeometry: c.routePoints || [],
            distance: c.lengthKm || 0,
            createdAt: "OFFICIAL",
            type: "MIXED" as "MIXED",
            difficulty: c.difficulty as "EASY" | "MEDIUM" | "HARD" | "LEGENDARY" || "MEDIUM",
            region: c.location,
            isOfficial: true
        })).filter(r => r.points && r.points.length > 0);

        setRoutes([...officialRoutes, ...customRoutes]);
    }, []);

    const locateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const loc: LatLng = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(loc);
                setMapCenter(loc);
                setMapZoom(11);
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
    };

    const difficultyColors = {
        EASY: "#22c55e",
        MEDIUM: "#06b6d4",
        HARD: "#d946ef",
        LEGENDARY: "#eab308",
    };

    return (
        <div className="h-[calc(100vh-3.5rem)] w-full bg-black relative overflow-hidden font-pixel">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-full z-0"
                style={{ background: "#0a0a0a" }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <LocationManager center={mapCenter} zoom={mapZoom} />

                {/* User GPS Marker */}
                {userLocation && (
                    <>
                        <CircleMarker
                            center={userLocation}
                            radius={20}
                            pathOptions={{
                                color: "#06b6d4",
                                fillColor: "transparent",
                                weight: 2,
                                className: "animate-ping opacity-75"
                            }}
                        />
                        <CircleMarker
                            center={userLocation}
                            radius={6}
                            pathOptions={{
                                color: "#ffffff",
                                fillColor: "#ef4444",
                                fillOpacity: 1,
                                weight: 2,
                            }}
                        />
                    </>
                )}

                {/* Routes Markers & Lines */}
                {routes.map((route, i) => {
                    const displayPoints = route.routeGeometry && route.routeGeometry.length > 0 ? route.routeGeometry : route.points;
                    if (!displayPoints || displayPoints.length === 0) return null;

                    const startPoint = displayPoints[0];
                    const color = difficultyColors[route.difficulty] || "#facc15";

                    return (
                        <div key={route.id}>
                            <Polyline
                                positions={displayPoints}
                                pathOptions={{
                                    color: color,
                                    weight: route.isOfficial ? 6 : 4,
                                    opacity: 0.6,
                                }}
                            />

                            <CircleMarker
                                center={startPoint}
                                radius={8}
                                pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.8,
                                    weight: 2,
                                }}
                            >
                                <Popup className="custom-popup">
                                    <div className="bg-black/90 p-3 border-2 border-zinc-700 hard-border font-pixel text-white min-w-[200px]">
                                        <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">
                                            {route.isOfficial ? "OFFICIAL TOUGE" : "CUSTOM ROUTE"}
                                        </div>
                                        <h3 className="font-bold uppercase tracking-wider mb-2 text-sm" style={{ color }}>{route.name}</h3>
                                        <div className="text-xs text-zinc-400 mb-3 uppercase tracking-widest">
                                            {route.distance.toFixed(2)} KM - {route.difficulty}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const url = route.isOfficial ? `/touge/${route.id}` : `/conquest/detail?id=${route.id}`;
                                                router.push(url);
                                            }}
                                            className="w-full py-2 bg-zinc-900 border-[1px] border-zinc-600 hover:border-white text-xs font-bold transition-colors uppercase tracking-widest"
                                        >
                                            [ EXAMINE ]
                                        </button>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </div>
                    );
                })}
            </MapContainer>

            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 z-[1000] pointer-events-none drop-shadow-md">
                <h1 className="text-xl font-bold text-white tracking-widest uppercase glitch-hover flex flex-col gap-1">
                    <span className="text-zinc-500 text-[10px] tracking-widest">PROJECT D // SYSTEM</span>
                    <span>GLOBAL MAP_</span>
                </h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-toxic-cyan text-[10px] uppercase">STATUS:</span>
                    <span className="text-white text-[10px] uppercase">SCANNING {routes.length} ROUTES</span>
                </div>
            </div>

            {/* Locate Button */}
            <button
                onClick={locateMe}
                className="absolute bottom-6 right-6 z-[1000] bg-black/40 border-[1px] border-zinc-800 p-3 text-toxic-cyan hover:bg-toxic-cyan hover:text-black transition-colors backdrop-blur-sm drop-shadow-md flex items-center justify-center gap-2"
                title="Centrer sur ma position"
            >
                <Navigation2 size={16} />
                <span className="text-[10px] uppercase font-bold tracking-widest hidden md:inline-block">[ LOCATE ]</span>
            </button>

            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: transparent;
                    box-shadow: none;
                    padding: 0;
                    margin: 0;
                    border-radius: 0;
                }
                .custom-popup .leaflet-popup-tip-container {
                    display: none;
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
