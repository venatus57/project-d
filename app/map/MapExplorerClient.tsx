"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { allCircuits } from "@/app/touge/data";
import { Navigation2 } from "lucide-react";
import { LatLng, UserRoute } from "@/app/lib/types";
import { loadRoutes } from "@/app/lib/storage";
import { DIFFICULTY_STYLE, Difficulty } from "@/components/ui";

type ExplorerRoute = UserRoute & { isOfficial?: boolean };

function LocationManager({ center, zoom }: { center: LatLng; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.4 });
    }, [center, zoom, map]);
    return null;
}

export default function MapExplorerClient() {
    const router = useRouter();
    const [routes, setRoutes] = useState<ExplorerRoute[]>([]);
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [mapCenter, setMapCenter] = useState<LatLng>([46.2276, 2.2137]); // France
    const [mapZoom, setMapZoom] = useState(5);

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

    return (
        <div className="map-screen">
            <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full" zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <LocationManager center={mapCenter} zoom={mapZoom} />

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

                    const color = DIFFICULTY_STYLE[route.difficulty]?.hex || "#ff3b57";

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
                                            className="font-display font-bold uppercase tracking-wider text-base mb-1"
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
                                            className="w-full py-2.5 rounded-lg bg-white/8 border border-line hover:border-white/40 text-white text-xs font-display font-bold uppercase tracking-widest transition-colors"
                                        >
                                            Examiner
                                        </button>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </Fragment>
                    );
                })}
            </MapContainer>

            {/* HUD title */}
            <div className="absolute top-3 left-3 z-[500] pointer-events-none">
                <div className="hud px-4 py-3">
                    <div className="label mb-0.5">Project D — Système</div>
                    <div className="font-display font-bold uppercase tracking-widest text-white">Carte globale</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint pulse-dot" />
                        <span className="label text-mint!">{routes.length} routes détectées</span>
                    </div>
                </div>
            </div>

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
