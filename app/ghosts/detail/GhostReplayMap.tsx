"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "../../lib/types";

type GhostReplayMapProps = {
    fullPath: LatLng[];
    ghostPath: LatLng[];
    currentPosition: LatLng;
};

// Auto-fit bounds on load
function FitBounds({ path }: { path: LatLng[] }) {
    const map = useMap();
    const hasFit = useRef(false);

    useEffect(() => {
        if (path.length >= 2 && !hasFit.current) {
            const bounds = L.latLngBounds(path);
            map.fitBounds(bounds, { padding: [50, 50] });
            hasFit.current = true;
        }
    }, [path, map]);

    return null;
}

export default function GhostReplayMap({ fullPath, ghostPath, currentPosition }: GhostReplayMapProps) {
    const center: LatLng = fullPath[0] || [48.8566, 2.3522];

    return (
        <MapContainer
            center={center}
            zoom={14}
            className="w-full h-full"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds path={fullPath} />

            {/* Full route (grey background) */}
            {fullPath.length >= 2 && (
                <Polyline
                    positions={fullPath}
                    pathOptions={{
                        color: "#3f3f46",
                        weight: 6,
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Ghost path already traveled (yellow) */}
            {ghostPath.length >= 2 && (
                <Polyline
                    positions={ghostPath}
                    pathOptions={{
                        color: "#FACC15",
                        weight: 5,
                        opacity: 1,
                    }}
                />
            )}

            {/* Current ghost position (animated car marker) */}
            <CircleMarker
                center={currentPosition}
                radius={12}
                pathOptions={{
                    fillColor: "#FACC15",
                    fillOpacity: 1,
                    color: "#CA8A04",
                    weight: 3,
                }}
            />
            {/* Outer glow */}
            <CircleMarker
                center={currentPosition}
                radius={25}
                pathOptions={{
                    fillColor: "#FACC15",
                    fillOpacity: 0.2,
                    stroke: false,
                }}
            />
        </MapContainer>
    );
}
