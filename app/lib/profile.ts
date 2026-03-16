export type PlayerProfile = {
    driverName: string;
    totalDistance: number; // in km
    updatedAt: string;
    specialty?: "DOWNHILL" | "UPHILL" | "MIXED" | "BOTH";
    homeMountain?: string;
    avatar?: string;
};

const PROFILE_STORAGE_KEY = "projectd_profile";



export const getProfile = (): PlayerProfile => {
    if (typeof window === "undefined") {
        return {
            driverName: "ANONYME", totalDistance: 0, updatedAt: new Date().toISOString(),
            specialty: "DOWNHILL", homeMountain: "AKINA", avatar: "🏎️"
        };
    }

    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch { }
    }

    // Default profile
    const newProfile: PlayerProfile = {
        driverName: "ANONYME",
        totalDistance: 0,
        updatedAt: new Date().toISOString(),
        specialty: "DOWNHILL",
        homeMountain: "AKINA",
        avatar: "🏎️"
    };
    saveProfile(newProfile);
    return newProfile;
};

export const saveProfile = (profile: PlayerProfile): void => {
    if (typeof window === "undefined") return;
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

export const addRewards = (distanceKm: number, speedKmh: number, weatherBonus: number = 1.0): { newProfile: PlayerProfile } => {
    const profile = getProfile();

    profile.totalDistance += distanceKm;

    saveProfile(profile);
    return { newProfile: profile };
};
