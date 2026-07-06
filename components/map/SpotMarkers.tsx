"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { PoliceSpot } from "@/app/lib/spots";

const spotIcon = (permanent: boolean) =>
    L.divIcon({
        className: "",
        html: `<div class="police-pin${permanent ? " police-pin--perm" : ""}">P</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
    });

function remainingLabel(spot: PoliceSpot): string {
    if (spot.permanent) return "Spot permanent";
    const mins = Math.max(0, Math.round((spot.createdAt + 3_600_000 - Date.now()) / 60_000));
    return `Signalement — expire dans ${mins} min`;
}

export default function SpotMarkers({
    spots,
    onDelete,
}: {
    spots: PoliceSpot[];
    onDelete?: (id: string) => void;
}) {
    return (
        <>
            {spots.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={spotIcon(s.permanent)}>
                    <Popup className="pd-popup">
                        <div className="hud rounded-xl! p-3 min-w-[180px]">
                            <div className="label mb-1">Police</div>
                            <div className="font-display text-white text-base tracking-wider mb-2">
                                {remainingLabel(s)}
                            </div>
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(s.id)}
                                    className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-black text-xs font-display uppercase tracking-widest transition-colors"
                                >
                                    Retirer le spot
                                </button>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
