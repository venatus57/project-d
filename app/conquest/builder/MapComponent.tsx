"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

interface MapComponentProps {
    waypoints: LatLng[];
    routeGeometry?: LatLng[];
    onMapClick?: (latlng: LatLng) => void;
    center?: LatLng;
    zoom?: number;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick?: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick([e.latlng.lat, e.latlng.lng]);
            }
        },
    });
    return null;
}

// Component to fly to new location when center changes
function FlyToLocation({ center, zoom }: { center: LatLng; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, zoom, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }, [map, center, zoom]);

    return null;
}

export default function MapComponent({
    waypoints,
    routeGeometry,
    onMapClick,
    center,
    zoom = 8
}: MapComponentProps) {
    const defaultCenter: LatLng = center || [43.9367, 7.1186];
    const defaultZoom = zoom;
    const linePoints = routeGeometry && routeGeometry.length >= 2 ? routeGeometry : waypoints;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            className="w-full h-full"
            style={{ background: "#0a0a0a" }}
            zoomControl={false}
        >
            {/* Dark Matter Tile Layer */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Fly to new location when region changes */}
            <FlyToLocation center={defaultCenter} zoom={defaultZoom} />

            {/* Click Handler */}
            <MapClickHandler onMapClick={onMapClick} />

            {/* Glow effect line */}
            {linePoints.length >= 2 && (
                <Polyline
                    positions={linePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 14,
                        opacity: 0.2,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* Route Polyline */}
            {linePoints.length >= 2 && (
                <Polyline
                    positions={linePoints}
                    pathOptions={{
                        color: "#facc15",
                        weight: 4,
                        opacity: 0.95,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}

            {/* Outer glow for waypoints */}
            {waypoints.map((point, index) => (
                <CircleMarker
                    key={`glow-${index}`}
                    center={point}
                    radius={index === 0 ? 20 : index === waypoints.length - 1 ? 20 : 14}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === waypoints.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: "transparent",
                        fillOpacity: 0,
                        weight: 3,
                        opacity: 0.25,
                    }}
                />
            ))}

            {/* Waypoint Circles */}
            {waypoints.map((point, index) => (
                <CircleMarker
                    key={index}
                    center={point}
                    radius={index === 0 ? 12 : index === waypoints.length - 1 ? 12 : 7}
                    pathOptions={{
                        color: index === 0 ? "#22c55e" : index === waypoints.length - 1 ? "#ef4444" : "#facc15",
                        fillColor: index === 0 ? "#22c55e" : index === waypoints.length - 1 ? "#ef4444" : "#facc15",
                        fillOpacity: 0.9,
                        weight: 3,
                    }}
                />
            ))}
        </MapContainer>
    );
}

