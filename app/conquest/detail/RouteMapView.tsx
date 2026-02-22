"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBounds } from "leaflet";

type LatLng = [number, number];

interface RouteMapViewProps {
    points: LatLng[];
    routeGeometry?: LatLng[];
}

// Fit map to route bounds
function FitBounds({ points }: { points: LatLng[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            const L = require("leaflet");
            const bounds: LatLngBounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, points]);

    return null;
}

export default function RouteMapView({ points, routeGeometry }: RouteMapViewProps) {
    const defaultCenter: LatLng = points.length > 0 ? points[0] : [46.2276, 2.2137];
    const linePoints = routeGeometry && routeGeometry.length > 0 ? routeGeometry : points;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={12}
            className="w-full h-full"
            style={{ background: "#0a0a0a" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds points={linePoints} />

            {/* Glow effect */}
            {linePoints.length >= 2 && (
                <Polyline
                    positions={linePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 16,
                        opacity: 0.2,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* Main route line */}
            {linePoints.length >= 2 && (
                <Polyline
                    positions={linePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 5,
                        opacity: 0.95,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* Waypoint markers */}
            {points.map((point, index) => (
                <CircleMarker
                    key={`glow-${index}`}
                    center={point}
                    radius={index === 0 ? 20 : index === points.length - 1 ? 20 : 12}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === points.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: "transparent",
                        fillOpacity: 0,
                        weight: 3,
                        opacity: 0.3,
                    }}
                />
            ))}

            {points.map((point, index) => (
                <CircleMarker
                    key={index}
                    center={point}
                    radius={index === 0 ? 12 : index === points.length - 1 ? 12 : 7}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === points.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: index === 0 ? "#22c55e" : index === points.length - 1 ? "#ef4444" : "#facc15",
                        fillOpacity: 0.9,
                        weight: 3,
                    }}
                />
            ))}
        </MapContainer>
    );
}
