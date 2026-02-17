"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBounds } from "leaflet";

type LatLng = [number, number];

interface TougeMapViewProps {
    routePoints: LatLng[];
}

// Fit map to route bounds
function FitBounds({ points }: { points: LatLng[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            const L = require("leaflet");
            const bounds: LatLngBounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [80, 80] });
        }
    }, [map, points]);

    return null;
}

export default function TougeMapView({ routePoints }: TougeMapViewProps) {
    const defaultCenter: LatLng = routePoints.length > 0 ? routePoints[0] : [46.2276, 2.2137];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            className="w-full h-full"
            style={{ background: "#0a0a0a" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds points={routePoints} />

            {/* Outer glow effect */}
            {routePoints.length >= 2 && (
                <Polyline
                    positions={routePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 18,
                        opacity: 0.15,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* Main route line */}
            {routePoints.length >= 2 && (
                <Polyline
                    positions={routePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 6,
                        opacity: 0.95,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* All waypoint markers with glow */}
            {routePoints.map((point, index) => (
                <CircleMarker
                    key={`glow-${index}`}
                    center={point}
                    radius={index === 0 ? 22 : index === routePoints.length - 1 ? 22 : 10}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === routePoints.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: "transparent",
                        fillOpacity: 0,
                        weight: 3,
                        opacity: 0.3,
                    }}
                />
            ))}

            {/* Waypoint circles */}
            {routePoints.map((point, index) => (
                <CircleMarker
                    key={index}
                    center={point}
                    radius={index === 0 ? 14 : index === routePoints.length - 1 ? 14 : 6}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === routePoints.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: index === 0 ? "#22c55e" : index === routePoints.length - 1 ? "#ef4444" : "#facc15",
                        fillOpacity: 0.9,
                        weight: 3,
                    }}
                />
            ))}
        </MapContainer>
    );
}
