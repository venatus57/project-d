"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "../lib/types";

type RunMapViewProps = {
    tougePoints: LatLng[];
    currentPosition: LatLng | null;
    ghostPoints: LatLng[];
};

// Component to update map view when position changes
function MapUpdater({ position }: { position: LatLng | null }) {
    const map = useMap();
    const hasSetInitialView = useRef(false);

    useEffect(() => {
        if (position && !hasSetInitialView.current) {
            map.setView(position, 15);
            hasSetInitialView.current = true;
        } else if (position) {
            map.panTo(position, { animate: true, duration: 0.5 });
        }
    }, [position, map]);

    return null;
}

export default function RunMapView({ tougePoints, currentPosition, ghostPoints }: RunMapViewProps) {
    const defaultCenter: LatLng = currentPosition || tougePoints[0] || [48.8566, 2.3522];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={15}
            className="w-full h-full"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater position={currentPosition} />

            {/* Touge route (background - grey) */}
            {tougePoints.length >= 2 && (
                <Polyline
                    positions={tougePoints}
                    pathOptions={{
                        color: "#52525b",
                        weight: 6,
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Ghost trail (recorded path - yellow) */}
            {ghostPoints.length >= 2 && (
                <Polyline
                    positions={ghostPoints}
                    pathOptions={{
                        color: "#FACC15",
                        weight: 4,
                        opacity: 0.9,
                    }}
                />
            )}

            {/* Current position (green pulsing dot) */}
            {currentPosition && (
                <>
                    {/* Outer glow */}
                    <CircleMarker
                        center={currentPosition}
                        radius={20}
                        pathOptions={{
                            fillColor: "#22C55E",
                            fillOpacity: 0.2,
                            stroke: false,
                        }}
                    />
                    {/* Inner dot */}
                    <CircleMarker
                        center={currentPosition}
                        radius={8}
                        pathOptions={{
                            fillColor: "#22C55E",
                            fillOpacity: 1,
                            color: "#16A34A",
                            weight: 3,
                        }}
                    />
                </>
            )}
        </MapContainer>
    );
}
