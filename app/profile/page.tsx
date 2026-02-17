"use client";

import { useState, useEffect } from "react";
import {
    User, Trophy, Mountain, Flame, Target, Zap,
    Crown, Star, Medal, Award, Plus, Trash2, Check, X,
    TrendingUp, TrendingDown
} from "lucide-react";
import { motion } from "framer-motion";

// --- TYPES ---
type BattleRecord = {
    id: string;
    opponent: string;
    location: string;
    result: "WIN" | "LOSS";
    date: string;
    technique?: string;
};

type DriverProfile = {
    name: string;
    specialty: "DOWNHILL" | "UPHILL" | "BOTH";
    homeMountain: string;
    avatar: string;
};

type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    condition: (battles: BattleRecord[]) => boolean;
};

// --- BADGES DÉFINITIONS ---
const BADGE_DEFINITIONS: Omit<Badge, "unlocked">[] = [
    {
        id: "first_blood",
        name: "FIRST BLOOD",
        description: "Remporter ta première victoire",
        icon: "🩸",
        condition: (battles) => battles.filter(b => b.result === "WIN").length >= 1,
    },
    {
        id: "downhill_king",
        name: "DOWNHILL KING",
        description: "Gagner 5 courses",
        icon: "👑",
        condition: (battles) => battles.filter(b => b.result === "WIN").length >= 5,
    },
    {
        id: "akina_legend",
        name: "AKINA LEGEND",
        description: "Gagner 3 fois sur Akina",
        icon: "🏔️",
        condition: (battles) => battles.filter(b => b.result === "WIN" && b.location.toLowerCase().includes("akina")).length >= 3,
    },
    {
        id: "undefeated",
        name: "UNDEFEATED",
        description: "10 victoires consécutives",
        icon: "🔥",
        condition: (battles) => {
            const last10 = battles.slice(-10);
            return last10.length >= 10 && last10.every(b => b.result === "WIN");
        },
    },
    {
        id: "gutter_master",
        name: "GUTTER MASTER",
        description: "Utiliser la technique Gutter Run",
        icon: "⚡",
        condition: (battles) => battles.some(b => b.technique?.toLowerCase().includes("gutter")),
    },
    {
        id: "drift_king",
        name: "DRIFT KING",
        description: "20 courses au total",
        icon: "🏎️",
        condition: (battles) => battles.length >= 20,
    },
    {
        id: "comeback_kid",
        name: "COMEBACK KID",
        description: "Gagner après 3 défaites",
        icon: "💪",
        condition: (battles) => {
            for (let i = 3; i < battles.length; i++) {
                if (battles[i].result === "WIN" &&
                    battles[i - 1].result === "LOSS" &&
                    battles[i - 2].result === "LOSS" &&
                    battles[i - 3].result === "LOSS") {
                    return true;
                }
            }
            return false;
        },
    },
    {
        id: "night_racer",
        name: "NIGHT RACER",
        description: "10 victoires total",
        icon: "🌙",
        condition: (battles) => battles.filter(b => b.result === "WIN").length >= 10,
    },
];

// --- CLÉS LOCALSTORAGE ---
const STORAGE_KEYS = {
    PROFILE: "projectd_profile",
    BATTLES: "projectd_battles",
};

const DEFAULT_PROFILE: DriverProfile = {
    name: "DRIVER",
    specialty: "DOWNHILL",
    homeMountain: "AKINA",
    avatar: "🏎️",
};

export default function ProfilePage() {
    // --- ÉTATS ---
    const [profile, setProfile] = useState<DriverProfile>(DEFAULT_PROFILE);
    const [battles, setBattles] = useState<BattleRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Formulaire battle
    const [newBattle, setNewBattle] = useState({
        opponent: "",
        location: "",
        result: "WIN" as "WIN" | "LOSS",
        technique: "",
    });

    // --- CHARGEMENT LOCALSTORAGE ---
    useEffect(() => {
        const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        const savedBattles = localStorage.getItem(STORAGE_KEYS.BATTLES);

        if (savedProfile) {
            try { setProfile(JSON.parse(savedProfile)); } catch { }
        }
        if (savedBattles) {
            try { setBattles(JSON.parse(savedBattles)); } catch { }
        }
        setIsLoaded(true);
    }, []);

    // --- SAUVEGARDE AUTO ---
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
        }
    }, [profile, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEYS.BATTLES, JSON.stringify(battles));
        }
    }, [battles, isLoaded]);

    // --- CALCULS STATS ---
    const wins = battles.filter(b => b.result === "WIN").length;
    const losses = battles.filter(b => b.result === "LOSS").length;
    const winRate = battles.length > 0 ? Math.round((wins / battles.length) * 100) : 0;

    // --- BADGES CHECK ---
    const unlockedBadges = BADGE_DEFINITIONS.map(badge => ({
        ...badge,
        unlocked: badge.condition(battles),
    }));

    // --- FONCTIONS ---
    const addBattle = () => {
        if (!newBattle.opponent || !newBattle.location) return;
        const battle: BattleRecord = {
            id: Date.now().toString(),
            opponent: newBattle.opponent,
            location: newBattle.location,
            result: newBattle.result,
            date: new Date().toISOString().split('T')[0],
            technique: newBattle.technique || undefined,
        };
        setBattles([...battles, battle]);
        setNewBattle({ opponent: "", location: "", result: "WIN", technique: "" });
    };

    const removeBattle = (id: string) => {
        setBattles(battles.filter(b => b.id !== id));
    };

    // --- RENDU ---
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* HEADER */}
            <header className="mb-12 border-b border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                    PROJECT D // PROFILE
                </h1>
                <p className="text-zinc-500 mt-2">DRIVER STATUS & BATTLE RECORDS</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLONNE 1 : PROFIL */}
                <div className="space-y-6">

                    {/* DRIVER CARD */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-3xl">
                                {profile.avatar}
                            </div>
                            <div>
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="bg-zinc-950 border border-zinc-700 p-1 text-xl font-bold focus:border-yellow-500 outline-none"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-yellow-500">{profile.name}</h2>
                                )}
                                <p className="text-zinc-500 text-sm">PROJECT D MEMBER</p>
                            </div>
                        </div>

                        {/* Edit Mode */}
                        {isEditingProfile ? (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">SPÉCIALITÉ</label>
                                    <select
                                        value={profile.specialty}
                                        onChange={(e) => setProfile({ ...profile, specialty: e.target.value as DriverProfile["specialty"] })}
                                        className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none"
                                    >
                                        <option value="DOWNHILL">DOWNHILL</option>
                                        <option value="UPHILL">UPHILL</option>
                                        <option value="BOTH">BOTH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">HOME MOUNTAIN</label>
                                    <input
                                        type="text"
                                        value={profile.homeMountain}
                                        onChange={(e) => setProfile({ ...profile, homeMountain: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs block mb-1">AVATAR (emoji)</label>
                                    <input
                                        type="text"
                                        value={profile.avatar}
                                        onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Spécialité</span>
                                    <span className="text-zinc-100 font-bold">{profile.specialty}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 text-sm">Home Mountain</span>
                                    <span className="text-zinc-100 font-bold">{profile.homeMountain}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 text-sm transition-colors"
                        >
                            {isEditingProfile ? "SAUVEGARDER" : "MODIFIER PROFIL"}
                        </button>
                    </div>

                    {/* STATS */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={20} />
                            STATISTIQUES
                        </h3>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-3xl font-bold text-green-500">{wins}</div>
                                <div className="text-zinc-500 text-xs">WINS</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-red-500">{losses}</div>
                                <div className="text-zinc-500 text-xs">LOSSES</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-500">{winRate}%</div>
                                <div className="text-zinc-500 text-xs">WIN RATE</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE 2 : BATTLE RECORDS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ADD BATTLE FORM */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Flame className="text-orange-500" size={20} />
                            NOUVEAU BATTLE
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Adversaire"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newBattle.opponent}
                                onChange={(e) => setNewBattle({ ...newBattle, opponent: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Location (ex: Akina)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newBattle.location}
                                onChange={(e) => setNewBattle({ ...newBattle, location: e.target.value })}
                            />
                            <select
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newBattle.result}
                                onChange={(e) => setNewBattle({ ...newBattle, result: e.target.value as "WIN" | "LOSS" })}
                            >
                                <option value="WIN">✓ VICTOIRE</option>
                                <option value="LOSS">✗ DÉFAITE</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Technique (optionnel)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newBattle.technique}
                                onChange={(e) => setNewBattle({ ...newBattle, technique: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={addBattle}
                            className="w-full bg-zinc-100 text-black hover:bg-yellow-500 hover:text-black transition-colors py-2 text-sm font-bold flex items-center justify-center gap-2 rounded"
                        >
                            <Plus size={16} /> ENREGISTRER LE BATTLE
                        </button>
                    </div>

                    {/* BATTLE HISTORY */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded overflow-hidden">
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Target size={20} className="text-zinc-400" />
                                BATTLE RECORDS ({battles.length})
                            </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {battles.length === 0 && (
                                <p className="text-zinc-600 text-sm italic p-4">Aucun battle enregistré...</p>
                            )}

                            {[...battles].reverse().map((battle, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={battle.id}
                                    className={`flex items-center justify-between p-4 border-b border-zinc-800 ${index % 2 === 0 ? 'bg-zinc-900/50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {battle.result === "WIN" ? (
                                            <div className="w-10 h-10 rounded bg-green-500/20 flex items-center justify-center">
                                                <TrendingUp className="text-green-500" size={20} />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center">
                                                <TrendingDown className="text-red-500" size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-zinc-100">vs {battle.opponent}</div>
                                            <div className="text-zinc-500 text-sm flex items-center gap-2">
                                                <Mountain size={12} />
                                                {battle.location}
                                                {battle.technique && (
                                                    <span className="text-yellow-500 text-xs">• {battle.technique}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-zinc-600 text-xs">{battle.date}</span>
                                        <span className={`px-2 py-1 text-xs font-bold ${battle.result === "WIN"
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-red-500/20 text-red-500"
                                            }`}>
                                            {battle.result}
                                        </span>
                                        <button
                                            onClick={() => removeBattle(battle.id)}
                                            className="text-zinc-700 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* BADGES */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Award className="text-yellow-500" size={20} />
                            BADGES ({unlockedBadges.filter(b => b.unlocked).length}/{BADGE_DEFINITIONS.length})
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {unlockedBadges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className={`p-3 rounded border text-center transition-all ${badge.unlocked
                                            ? "bg-yellow-500/10 border-yellow-500/50"
                                            : "bg-zinc-900 border-zinc-800 opacity-40"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{badge.icon}</div>
                                    <div className={`text-xs font-bold ${badge.unlocked ? "text-yellow-500" : "text-zinc-600"}`}>
                                        {badge.name}
                                    </div>
                                    <div className="text-zinc-500 text-xs mt-1">{badge.description}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
