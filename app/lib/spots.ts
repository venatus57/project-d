// Personal police-spot reports (Waze-style, but local-only).
// The user marks spots they know or see; temporary reports expire after 1 h.

import { loadJSON, saveJSON } from "./storage";

export type PoliceSpot = {
    id: string;
    lat: number;
    lng: number;
    permanent: boolean;
    createdAt: number; // epoch ms
};

const SPOTS_KEY = "projectd_police_spots";
const TEMP_TTL_MS = 60 * 60 * 1000; // 1 h

/** Load spots, silently dropping expired temporary reports. */
export function loadSpots(): PoliceSpot[] {
    const all = loadJSON<PoliceSpot[]>(SPOTS_KEY, []);
    const now = Date.now();
    const valid = all.filter((s) => s.permanent || now - s.createdAt < TEMP_TTL_MS);
    if (valid.length !== all.length) saveJSON(SPOTS_KEY, valid);
    return valid;
}

export function addSpot(lat: number, lng: number, permanent: boolean): PoliceSpot[] {
    const spots = loadSpots();
    const updated = [
        ...spots,
        { id: Date.now().toString(), lat, lng, permanent, createdAt: Date.now() },
    ];
    saveJSON(SPOTS_KEY, updated);
    return updated;
}

export function removeSpot(id: string): PoliceSpot[] {
    const updated = loadSpots().filter((s) => s.id !== id);
    saveJSON(SPOTS_KEY, updated);
    return updated;
}
