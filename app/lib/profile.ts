export type PlayerProfile = {
    driverName: string;
    level: number;
    xp: number;
    credits: number;
    totalDistance: number; // in km
    updatedAt: string;
};

const PROFILE_STORAGE_KEY = "projectd_profile";

// Basic specific XP thresholds per level (simplistic scale)
export const calculateLevel = (xp: number): number => {
    // Formula: Level = floor(sqrt(XP / 100)) + 1
    // e.g. 0 XP = Lvl 1. 100 XP = Lvl 2. 400 XP = Lvl 3. 900 XP = Lvl 4.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXpForNextLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel, 2) * 100;
};

export const getXpForCurrentLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel - 1, 2) * 100;
};

export const getProfile = (): PlayerProfile => {
    if (typeof window === "undefined") {
        return { driverName: "ANONYME", level: 1, xp: 0, credits: 0, totalDistance: 0, updatedAt: new Date().toISOString() };
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
        level: 1,
        xp: 0,
        credits: 0,
        totalDistance: 0,
        updatedAt: new Date().toISOString()
    };
    saveProfile(newProfile);
    return newProfile;
};

export const saveProfile = (profile: PlayerProfile): void => {
    if (typeof window === "undefined") return;
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

export const addRewards = (distanceKm: number, speedKmh: number, weatherBonus: number = 1.0): { gainedXp: number, gainedCr: number, newProfile: PlayerProfile } => {
    const profile = getProfile();

    // Base XP: 10 XP per km + 1 XP per km/h avg speed
    const baseXp = (distanceKm * 10) + (speedKmh * 1);
    const gainedXp = Math.floor(baseXp * weatherBonus);

    // Base CR: 50 CR per km + 5 CR per km/h avg speed
    const baseCr = (distanceKm * 50) + (speedKmh * 5);
    const gainedCr = Math.floor(baseCr * weatherBonus);

    profile.xp += gainedXp;
    profile.credits += gainedCr;
    profile.totalDistance += distanceKm;

    // Recalculate level
    const newLevel = calculateLevel(profile.xp);
    if (newLevel > profile.level) {
        profile.level = newLevel;
    }

    saveProfile(profile);
    return { gainedXp, gainedCr, newProfile: profile };
};
