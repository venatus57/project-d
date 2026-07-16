// Fixed speed cameras from OpenStreetMap (highway=speed_camera).
// Community-maintained open data (ODbL) — fixed cameras only.

export type Radar = {
    id: number;
    lat: number;
    lng: number;
    maxspeed?: string;
};

export type BBox = {
    south: number;
    west: number;
    north: number;
    east: number;
};

type OverpassElement = {
    id: number;
    lat: number;
    lon: number;
    tags?: { maxspeed?: string };
};

// Public Overpass instances — tried in order (the main one gets rate-limited)
const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
];

export async function fetchRadars(b: BBox, limit = 400): Promise<Radar[]> {
    const query = `[out:json][timeout:20];node["highway"="speed_camera"](${b.south},${b.west},${b.north},${b.east});out body ${limit};`;

    let lastError: unknown = new Error("Overpass indisponible");
    for (const endpoint of OVERPASS_ENDPOINTS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12_000);
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "data=" + encodeURIComponent(query),
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Overpass ${res.status}`);
            const data = await res.json();
            return ((data.elements || []) as OverpassElement[])
                .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lon))
                .map((e) => ({
                    id: e.id,
                    lat: e.lat,
                    lng: e.lon,
                    maxspeed: e.tags?.maxspeed,
                }));
        } catch (e) {
            lastError = e;
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastError;
}

/** BBox around a route with a margin (in degrees, ~0.03° ≈ 3 km). */
export function routeBBox(points: [number, number][], margin = 0.04): BBox | null {
    if (points.length === 0) return null;
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    return {
        south: Math.min(...lats) - margin,
        west: Math.min(...lngs) - margin,
        north: Math.max(...lats) + margin,
        east: Math.max(...lngs) + margin,
    };
}
