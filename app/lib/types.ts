// === SHARED TYPES FOR PROJECT D ===

// --- CAR SPECS ---
export type Drivetrain = "FR" | "FF" | "MR" | "RR" | "AWD";
export type ModLevel = "STOCK" | "TUNED" | "FULL_RACE";

export type Car = {
    id: string;
    name: string;          // Ex: "Toyota AE86 Trueno"
    make: string;          // Ex: "Toyota"
    model: string;         // Ex: "AE86"
    year?: number;         // Ex: 1986
    power: number;         // ch
    weight: number;        // kg
    drivetrain: Drivetrain;
    mods: ModLevel;
    color?: string;        // Ex: "#FFFFFF"
    imageUrl?: string;
    notes?: string;
};

// Calculated helper
export const getPowerToWeight = (car: Car): number => {
    return car.weight / car.power; // kg/ch (lower is better)
};

// --- WEATHER ---
export type Weather = "SEC" | "PLUIE" | "NUIT";

export const WEATHER_INFO: Record<Weather, { label: string; icon: string; color: string }> = {
    SEC: { label: "Sec", icon: "☀️", color: "text-yellow-500" },
    PLUIE: { label: "Pluie", icon: "🌧️", color: "text-blue-500" },
    NUIT: { label: "Nuit", icon: "🌙", color: "text-purple-500" },
};

// Weather difficulty modifier
export const getAdjustedDifficulty = (
    base: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY",
    weather: Weather
): "EASY" | "MEDIUM" | "HARD" | "LEGENDARY" => {
    const levels = ["EASY", "MEDIUM", "HARD", "LEGENDARY"] as const;
    const baseIndex = levels.indexOf(base);

    if (weather === "PLUIE") {
        return levels[Math.min(baseIndex + 1, 3)];
    }
    return base;
};

// --- GHOST / RUN ---
export type GhostPoint = {
    lat: number;
    lng: number;
    timestamp: number;  // ms since start
    speed?: number;     // km/h (calculated)
};

export type GhostRun = {
    id: string;
    tougeId: string;
    tougeName: string;
    carId: string;
    carName: string;
    weather: Weather;
    points: GhostPoint[];
    totalTime: number;      // ms
    totalDistance: number;  // km
    avgSpeed: number;       // km/h
    maxSpeed: number;       // km/h
    date: string;
    driverName: string;
};

// --- STORAGE KEYS ---
export const STORAGE_KEYS = {
    CARS: "projectd_cars",
    GHOSTS: "projectd_ghosts",
    ROUTES: "projectd_routes",
};

// --- LatLng type ---
export type LatLng = [number, number];
