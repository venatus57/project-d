"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Radar } from "@/app/lib/radars";

const iconCache = new Map<string, L.DivIcon>();

function radarIcon(maxspeed?: string): L.DivIcon {
    const key = maxspeed || "?";
    let icon = iconCache.get(key);
    if (!icon) {
        const label = maxspeed && /^\d+$/.test(maxspeed) ? maxspeed : "R";
        icon = L.divIcon({
            className: "",
            html: `<div class="radar-pin${label === "R" ? " radar-pin--na" : ""}">${label}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16],
        });
        iconCache.set(key, icon);
    }
    return icon;
}

export default function RadarMarkers({ radars }: { radars: Radar[] }) {
    return (
        <>
            {radars.map((r) => (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={radarIcon(r.maxspeed)}>
                    <Popup className="pd-popup">
                        <div className="hud rounded-xl! p-3 min-w-[160px]">
                            <div className="label mb-1">Radar fixe</div>
                            <div className="font-display text-white text-lg tracking-wider">
                                {r.maxspeed ? `Limite ${r.maxspeed} km/h` : "Vitesse inconnue"}
                            </div>
                            <div className="text-[10px] text-zinc-600 mt-1">Source : OpenStreetMap</div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
