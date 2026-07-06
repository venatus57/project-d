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
    userLocation?: LatLng | null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            onMapClick?.([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function FlyToLocation({ center, zoom }: { center: LatLng; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.4, easeLinearity: 0.25 });
    }, [map, center, zoom]);

    return null;
}

const wpColor = (index: number, count: number) =>
    index === 0 ? "#3ddc84" : index === count - 1 ? "#ffc233" : "#38e1ff";

export default function MapComponent({
    waypoints,
    routeGeometry,
    onMapClick,
    center,
    zoom = 8,
    userLocation = null,
}: MapComponentProps) {
    const defaultCenter: LatLng = center || [43.9367, 7.1186];
    const linePoints = routeGeometry && routeGeometry.length >= 2 ? routeGeometry : waypoints;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={zoom}
            className="w-full h-full"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <FlyToLocation center={defaultCenter} zoom={zoom} />
            <MapClickHandler onMapClick={onMapClick} />

            {/* Route with glow */}
            {linePoints.length >= 2 && (
                <>
                    <Polyline
                        positions={linePoints}
                        pathOptions={{ color: "#c8f542", weight: 14, opacity: 0.18, lineCap: "round", lineJoin: "round" }}
                    />
                    <Polyline
                        positions={linePoints}
                        pathOptions={{ color: "#c8f542", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
                    />
                </>
            )}

            {/* Waypoints */}
            {waypoints.map((point, index) => {
                const color = wpColor(index, waypoints.length);
                const isEnd = index === 0 || index === waypoints.length - 1;
                return (
                    <CircleMarker
                        key={index}
                        center={point}
                        radius={isEnd ? 11 : 6}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 3 }}
                    />
                );
            })}

            {/* GPS user location */}
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
        </MapContainer>
    );
}
