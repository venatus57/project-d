import type { LatLng } from "./types";

const EARTH_RADIUS_KM = 6371;

/** Distance between two coordinates in km (Haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLon = ((b[1] - a[1]) * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Total length of a polyline in km. */
export function pathDistanceKm(points: LatLng[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += distanceKm(points[i - 1], points[i]);
    }
    return total;
}

/** Speed in km/h between two timed positions. */
export function speedKmh(a: LatLng, b: LatLng, deltaMs: number): number {
    if (deltaMs <= 0) return 0;
    return distanceKm(a, b) / (deltaMs / 3_600_000);
}
