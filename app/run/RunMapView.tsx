"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng } from "../lib/types";
import type { Radar } from "../lib/radars";
import type { PoliceSpot } from "../lib/spots";
import RadarMarkers from "@/components/map/RadarMarkers";
import SpotMarkers from "@/components/map/SpotMarkers";

type RunMapViewProps = {
    tougePoints: LatLng[];
    currentPosition: LatLng | null;
    ghostPoints: LatLng[];
    radars?: Radar[];
    spots?: PoliceSpot[];
};

// Follow the driver as the position updates
function MapUpdater({ position }: { position: LatLng | null }) {
    const map = useMap();
    const hasSetInitialView = useRef(false);

    useEffect(() => {
        if (!position) return;
        if (!hasSetInitialView.current) {
            map.setView(position, 16);
            hasSetInitialView.current = true;
        } else {
            map.panTo(position, { animate: true, duration: 0.5 });
        }
    }, [position, map]);

    return null;
}

export default function RunMapView({ tougePoints, currentPosition, ghostPoints, radars = [], spots = [] }: RunMapViewProps) {
    const defaultCenter: LatLng = currentPosition || tougePoints[0] || [48.8566, 2.3522];

    return (
        <MapContainer center={defaultCenter} zoom={15} className="w-full h-full" zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater position={currentPosition} />

            {/* Hazards */}
            <RadarMarkers radars={radars} />
            <SpotMarkers spots={spots} />

            {/* Reference touge route */}
            {tougePoints.length >= 2 && (
                <Polyline
                    positions={tougePoints}
                    pathOptions={{ color: "#52525b", weight: 6, opacity: 0.5, lineCap: "round", lineJoin: "round" }}
                />
            )}

            {/* Recorded trail */}
            {ghostPoints.length >= 2 && (
                <>
                    <Polyline
                        positions={ghostPoints}
                        pathOptions={{ color: "#ffc233", weight: 12, opacity: 0.18, lineCap: "round", lineJoin: "round" }}
                    />
                    <Polyline
                        positions={ghostPoints}
                        pathOptions={{ color: "#ffc233", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
                    />
                </>
            )}

            {/* Current position */}
            {currentPosition && (
                <>
                    <CircleMarker
                        center={currentPosition}
                        radius={18}
                        pathOptions={{ fillColor: "#3ddc84", fillOpacity: 0.15, stroke: false }}
                    />
                    <CircleMarker
                        center={currentPosition}
                        radius={7}
                        pathOptions={{ fillColor: "#3ddc84", fillOpacity: 1, color: "#ffffff", weight: 2 }}
                    />
                </>
            )}
        </MapContainer>
    );
}
