"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

interface RouteMapViewProps {
    points: LatLng[];
    routeGeometry?: LatLng[];
}

function FitBounds({ points }: { points: LatLng[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
        }
    }, [map, points]);

    return null;
}

export default function RouteMapView({ points, routeGeometry }: RouteMapViewProps) {
    const defaultCenter: LatLng = points.length > 0 ? points[0] : [46.2276, 2.2137];
    const linePoints = routeGeometry && routeGeometry.length > 0 ? routeGeometry : points;

    return (
        <MapContainer center={defaultCenter} zoom={12} className="w-full h-full" zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds points={linePoints} />

            {/* Glow + main line */}
            {linePoints.length >= 2 && (
                <>
                    <Polyline
                        positions={linePoints}
                        pathOptions={{ color: "#ff3b57", weight: 16, opacity: 0.15, lineCap: "round", lineJoin: "round" }}
                    />
                    <Polyline
                        positions={linePoints}
                        pathOptions={{ color: "#ff3b57", weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
                    />
                </>
            )}

            {/* Start / end markers */}
            {points.length > 0 && (
                <>
                    <CircleMarker
                        center={points[0]}
                        radius={11}
                        pathOptions={{ color: "#3ddc84", fillColor: "#3ddc84", fillOpacity: 0.9, weight: 3 }}
                    />
                    <CircleMarker
                        center={points[points.length - 1]}
                        radius={11}
                        pathOptions={{ color: "#ffc233", fillColor: "#ffc233", fillOpacity: 0.9, weight: 3 }}
                    />
                </>
            )}
        </MapContainer>
    );
}
