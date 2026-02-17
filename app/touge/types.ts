export type LatLng = [number, number];

export type TougeCircuit = {
    id: string;
    name: string;
    location: string;
    country: string;
    length: string;
    lengthKm: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
    record?: string;
    description: string;
    routePoints: LatLng[];
};
