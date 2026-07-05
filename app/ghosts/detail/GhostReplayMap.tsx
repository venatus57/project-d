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

// Fit the whole run once on load
function FitBounds({ path }: { path: LatLng[] }) {
    const map = useMap();
    const hasFit = useRef(false);

    useEffect(() => {
        if (path.length >= 2 && !hasFit.current) {
            map.fitBounds(L.latLngBounds(path), { padding: [60, 60] });
            hasFit.current = true;
        }
    }, [path, map]);

    return null;
}

export default function GhostReplayMap({ fullPath, ghostPath, currentPosition }: GhostReplayMapProps) {
    const center: LatLng = fullPath[0] || [48.8566, 2.3522];

    return (
        <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds path={fullPath} />

            {/* Full route (dimmed) */}
            {fullPath.length >= 2 && (
                <Polyline
                    positions={fullPath}
                    pathOptions={{ color: "#3f3f46", weight: 6, opacity: 0.5, lineCap: "round", lineJoin: "round" }}
                />
            )}

            {/* Travelled section */}
            {ghostPath.length >= 2 && (
                <>
                    <Polyline
                        positions={ghostPath}
                        pathOptions={{ color: "#ffc233", weight: 12, opacity: 0.2, lineCap: "round", lineJoin: "round" }}
                    />
                    <Polyline
                        positions={ghostPath}
                        pathOptions={{ color: "#ffc233", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
                    />
                </>
            )}

            {/* Ghost marker */}
            <CircleMarker
                center={currentPosition}
                radius={22}
                pathOptions={{ fillColor: "#ffc233", fillOpacity: 0.18, stroke: false }}
            />
            <CircleMarker
                center={currentPosition}
                radius={10}
                pathOptions={{ fillColor: "#ffc233", fillOpacity: 1, color: "#ffffff", weight: 3 }}
            />
        </MapContainer>
    );
}
