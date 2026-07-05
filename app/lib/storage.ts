import { STORAGE_KEYS, type GhostRun, type UserRoute } from "./types";

/** Safe localStorage JSON read (SSR-proof, corrupt-data-proof). */
export function loadJSON<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function saveJSON(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Quota exceeded / private mode — nothing sensible to do.
    }
}

export const loadRoutes = () => loadJSON<UserRoute[]>(STORAGE_KEYS.ROUTES, []);
export const saveRoutes = (routes: UserRoute[]) => saveJSON(STORAGE_KEYS.ROUTES, routes);

export const loadGhosts = () => loadJSON<GhostRun[]>(STORAGE_KEYS.GHOSTS, []);
export const saveGhosts = (ghosts: GhostRun[]) => saveJSON(STORAGE_KEYS.GHOSTS, ghosts);
