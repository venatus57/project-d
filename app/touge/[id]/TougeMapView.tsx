"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

interface TougeMapViewProps {
    routePoints: LatLng[];
}

function FitBounds({ points }: { points: LatLng[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            map.fitBounds(L.latLngBounds(points), { padding: [80, 80] });
        }
    }, [map, points]);

    return null;
}

export default function TougeMapView({ routePoints }: TougeMapViewProps) {
    const defaultCenter: LatLng = routePoints.length > 0 ? routePoints[0] : [46.2276, 2.2137];

    return (
        <MapContainer center={defaultCenter} zoom={13} className="w-full h-full" zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FitBounds points={routePoints} />

            {routePoints.length >= 2 && (
                <>
                    <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#ff3b57", weight: 18, opacity: 0.12, lineCap: "round", lineJoin: "round" }}
                    />
                    <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#ff3b57", weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
                    />
                </>
            )}

            {/* Start / end markers */}
            {routePoints.length > 0 && (
                <>
                    <CircleMarker
                        center={routePoints[0]}
                        radius={12}
                        pathOptions={{ color: "#3ddc84", fillColor: "#3ddc84", fillOpacity: 0.9, weight: 3 }}
                    />
                    <CircleMarker
                        center={routePoints[routePoints.length - 1]}
                        radius={12}
                        pathOptions={{ color: "#ffc233", fillColor: "#ffc233", fillOpacity: 0.9, weight: 3 }}
                    />
                </>
            )}
        </MapContainer>
    );
}
