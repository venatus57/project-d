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

type OverpassNode = {
    type: "node";
    id: number;
    lat: number;
    lon: number;
    tags?: { maxspeed?: string };
};

type OverpassRelation = {
    type: "relation";
    id: number;
    members?: { type: string; ref: number; role: string }[];
    tags?: { maxspeed?: string };
};

type OverpassWay = {
    type: "way";
    id: number;
    geometry?: { lat: number; lon: number }[];
    tags?: { maxspeed?: string };
};

type OverpassElement = OverpassNode | OverpassRelation | OverpassWay;

// French implicit maxspeed values → km/h
const IMPLICIT_MAXSPEED: Record<string, string> = {
    "FR:urban": "50",
    "FR:rural": "80",
    "FR:motorway": "130",
    "FR:trunk": "110",
    "FR:zone30": "30",
    walk: "20",
};

function normalizeMaxspeed(raw?: string): string | undefined {
    if (!raw) return undefined;
    const v = raw.trim();
    if (/^\d+$/.test(v)) return v;
    if (IMPLICIT_MAXSPEED[v]) return IMPLICIT_MAXSPEED[v];
    const num = v.match(/^(\d+)\b/); // "50 mph" / "80;100" → first number
    return num ? num[1] : undefined;
}

// Squared-degrees point→segment distance (equirectangular, fine at city scale)
function segDistDeg2(
    p: [number, number],
    a: { lat: number; lon: number },
    b: { lat: number; lon: number }
): number {
    const cos = Math.cos((p[0] * Math.PI) / 180);
    const px = p[1] * cos, py = p[0];
    const ax = a.lon * cos, ay = a.lat;
    const bx = b.lon * cos, by = b.lat;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    return (px - qx) ** 2 + (py - qy) ** 2;
}

// ~35 m expressed in squared degrees
const NEAR_WAY_DEG2 = (35 / 111_320) ** 2;

// Public Overpass instances — tried in order (the main one gets rate-limited)
const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
];

export async function fetchRadars(b: BBox, limit = 400): Promise<Radar[]> {
    // The camera node rarely carries maxspeed itself; also pull the enforcement
    // relation and nearby tagged roads to recover the limit.
    const bbox = `${b.south},${b.west},${b.north},${b.east}`;
    const query =
        `[out:json][timeout:25];` +
        `node["highway"="speed_camera"](${bbox})->.cams;` +
        `.cams out body ${limit};` +
        `rel(bn.cams)["maxspeed"];out body;` +
        `way(around.cams:25)["maxspeed"]["highway"];out geom;`;

    let lastError: unknown = new Error("Overpass indisponible");
    for (const endpoint of OVERPASS_ENDPOINTS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15_000);
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "data=" + encodeURIComponent(query),
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Overpass ${res.status}`);
            const data = await res.json();
            const elements = (data.elements || []) as OverpassElement[];

            const radars: Radar[] = elements
                .filter((e): e is OverpassNode => e.type === "node" && Number.isFinite(e.lat) && Number.isFinite(e.lon))
                .map((e) => ({
                    id: e.id,
                    lat: e.lat,
                    lng: e.lon,
                    maxspeed: normalizeMaxspeed(e.tags?.maxspeed),
                }));

            // 2nd source: enforcement relations (maxspeed on the relation, camera as member)
            const byId = new Map(radars.map((r) => [r.id, r]));
            for (const e of elements) {
                if (e.type !== "relation") continue;
                const speed = normalizeMaxspeed(e.tags?.maxspeed);
                if (!speed || !e.members) continue;
                for (const m of e.members) {
                    const cam = m.type === "node" ? byId.get(m.ref) : undefined;
                    if (cam && !cam.maxspeed) cam.maxspeed = speed;
                }
            }

            // 3rd source: nearest tagged road within ~35 m
            const ways = elements.filter(
                (e): e is OverpassWay => e.type === "way" && !!e.geometry && !!normalizeMaxspeed(e.tags?.maxspeed)
            );
            for (const cam of radars) {
                if (cam.maxspeed) continue;
                let bestD = NEAR_WAY_DEG2;
                for (const w of ways) {
                    const geom = w.geometry!;
                    for (let i = 1; i < geom.length; i++) {
                        const d = segDistDeg2([cam.lat, cam.lng], geom[i - 1], geom[i]);
                        if (d < bestD) {
                            bestD = d;
                            cam.maxspeed = normalizeMaxspeed(w.tags?.maxspeed);
                        }
                    }
                }
            }

            return radars;
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
