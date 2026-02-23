"use client";

import { useState, useEffect } from "react";
import {
    User, Trophy, Mountain, Flame, Target, Zap,
    Crown, Star, Medal, Award, Plus, Trash2, Check, X,
    TrendingUp, TrendingDown, Download, Upload
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

    // --- SAVE MANAGEMENT ---
    const handleExport = () => {
        const exportData: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("projectd_")) {
                const val = localStorage.getItem(key);
                if (val) exportData[key] = val;
            }
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `projectd_save_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                let imported = 0;
                for (const key in data) {
                    if (key.startsWith("projectd_")) {
                        localStorage.setItem(key, data[key]);
                        imported++;
                    }
                }

                alert(`Succès : ${imported} types de données importées ! L'application va recharger.`);
                window.location.reload();
            } catch (error) {
                alert("Erreur lors de l'importation. Fichier invalide.");
            }
        };
        reader.readAsText(file);
    };

    // --- RENDU ---
    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-pixel">

            {/* HEADER */}
            <header className="mb-12 border-b-2 border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-toxic-magenta glitch-hover">
                    PROJECT D // PROFILE
                </h1>
                <p className="text-zinc-500 mt-2 font-bold tracking-widest">DRIVER STATUS & BATTLE RECORDS</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLONNE 1 : PROFIL */}
                <div className="space-y-6">

                    {/* DRIVER CARD */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 hard-border">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 border-2 border-toxic-magenta bg-black flex items-center justify-center text-3xl hard-border shadow-[0_0_15px_rgba(255,0,255,0.3)]">
                                {profile.avatar}
                            </div>
                            <div>
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="bg-black border-2 border-zinc-700 p-1 text-xl font-bold focus:border-toxic-magenta outline-none hard-border text-white uppercase w-full"
                                    />
                                ) : (
                                    <h2 className="text-3xl font-bold text-white uppercase glitch-hover">{profile.name}</h2>
                                )}
                                <p className="text-toxic-magenta font-bold text-sm tracking-widest">PROJECT D MEMBER</p>
                            </div>
                        </div>

                        {/* Edit Mode */}
                        {isEditingProfile ? (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-zinc-500 text-xs font-bold block mb-1">SPÉCIALITÉ</label>
                                    <select
                                        value={profile.specialty}
                                        onChange={(e) => setProfile({ ...profile, specialty: e.target.value as DriverProfile["specialty"] })}
                                        className="w-full bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-magenta outline-none hard-border text-white"
                                    >
                                        <option value="DOWNHILL">DOWNHILL</option>
                                        <option value="UPHILL">UPHILL</option>
                                        <option value="BOTH">BOTH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs font-bold block mb-1">HOME MOUNTAIN</label>
                                    <input
                                        type="text"
                                        value={profile.homeMountain}
                                        onChange={(e) => setProfile({ ...profile, homeMountain: e.target.value })}
                                        className="w-full bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-magenta outline-none hard-border text-white uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-500 text-xs font-bold block mb-1">AVATAR (emoji)</label>
                                    <input
                                        type="text"
                                        value={profile.avatar}
                                        onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                                        className="w-full bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-magenta outline-none hard-border text-center text-2xl"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4 border-y-2 border-zinc-800 py-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 text-xs font-bold tracking-widest">SPECIALTY</span>
                                    <span className="text-toxic-cyan font-bold text-xl">{profile.specialty}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 text-xs font-bold tracking-widest">HOME REGION</span>
                                    <span className="text-white font-bold text-xl uppercase">{profile.homeMountain}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="w-full bg-zinc-800 hover:bg-toxic-magenta hover:text-black text-white py-3 text-sm font-bold transition-colors mb-6 hard-border"
                        >
                            {isEditingProfile ? "SAVE PROFILE DATA" : "EDIT PROFILE DATA"}
                        </button>

                        {/* SAVE MANAGEMENT BUTTONS */}
                        <div className="border-t-2 border-zinc-800 pt-6">
                            <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-widest">SYSTEM DATA MANAGEMENT</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="flex-1 bg-black border-2 border-zinc-700 hover:border-toxic-green text-zinc-300 hover:text-toxic-green py-2 text-xs font-bold transition-colors flex items-center justify-center gap-2 hard-border"
                                >
                                    <Download size={14} /> EXPORT SAVE
                                </button>

                                <label className="flex-1 bg-black border-2 border-zinc-700 hover:border-toxic-cyan text-zinc-300 hover:text-toxic-cyan py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 hard-border">
                                    <Upload size={14} /> IMPORT SAVE
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 hard-border">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                            <Trophy className="text-toxic-yellow" size={20} />
                            RACING STATISTICS
                        </h3>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="border border-zinc-800 bg-black p-2">
                                <div className="text-4xl font-bold text-toxic-green glitch-hover">{wins}</div>
                                <div className="text-zinc-500 text-xs font-bold">WINS</div>
                            </div>
                            <div className="border border-zinc-800 bg-black p-2">
                                <div className="text-4xl font-bold text-red-500 glitch-hover">{losses}</div>
                                <div className="text-zinc-500 text-xs font-bold">LOSSES</div>
                            </div>
                            <div className="border border-zinc-800 bg-black p-2">
                                <div className="text-4xl font-bold text-toxic-yellow glitch-hover">{winRate}%</div>
                                <div className="text-zinc-500 text-xs font-bold">WIN RATE</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE 2 : BATTLE RECORDS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ADD BATTLE FORM */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-4 hard-border">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                            <Flame className="text-orange-500 animate-pulse" size={20} />
                            NEW BATTLE RECORD
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Adversaire"
                                className="bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-red outline-none hard-border text-white placeholder-zinc-600"
                                value={newBattle.opponent}
                                onChange={(e) => setNewBattle({ ...newBattle, opponent: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Location (ex: Akina)"
                                className="bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-red outline-none hard-border text-white placeholder-zinc-600 uppercase"
                                value={newBattle.location}
                                onChange={(e) => setNewBattle({ ...newBattle, location: e.target.value })}
                            />
                            <select
                                className="bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-red outline-none hard-border text-white"
                                value={newBattle.result}
                                onChange={(e) => setNewBattle({ ...newBattle, result: e.target.value as "WIN" | "LOSS" })}
                            >
                                <option value="WIN">✓ VICTORY</option>
                                <option value="LOSS">✗ DEFEAT</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Technique (optionnel)"
                                className="bg-black border-2 border-zinc-700 p-2 text-sm focus:border-toxic-red outline-none hard-border text-white placeholder-zinc-600"
                                value={newBattle.technique}
                                onChange={(e) => setNewBattle({ ...newBattle, technique: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={addBattle}
                            className="w-full bg-zinc-800 text-white hover:bg-orange-500 hover:text-black transition-colors py-2 text-sm font-bold flex items-center justify-center gap-2 hard-border"
                        >
                            <Plus size={16} /> ENREGISTRER LE LOG
                        </button>
                    </div>

                    {/* BATTLE HISTORY */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 hard-border overflow-hidden">
                        <div className="p-4 border-b-2 border-zinc-800 bg-black">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Target size={20} className="text-zinc-600" />
                                BATTLE LOGS <span className="text-zinc-600 text-sm">[{battles.length}]</span>
                            </h3>
                        </div>

                        <div className="max-h-96 overflow-y-auto bg-black p-2 space-y-2">
                            {battles.length === 0 && (
                                <p className="text-zinc-600 text-sm font-bold text-center py-8">NO DATA FOUND IN SYSTEM...</p>
                            )}

                            {[...battles].reverse().map((battle, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={battle.id}
                                    className={`flex items-center justify-between p-4 border-2 border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition-colors hard-border`}
                                >
                                    <div className="flex items-center gap-4">
                                        {battle.result === "WIN" ? (
                                            <div className="w-12 h-12 border-2 border-toxic-green bg-toxic-green/10 flex items-center justify-center hard-border">
                                                <TrendingUp className="text-toxic-green" size={24} />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 border-2 border-red-500 bg-red-500/10 flex items-center justify-center hard-border">
                                                <TrendingDown className="text-red-500" size={24} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-xl text-white uppercase">vs {battle.opponent}</div>
                                            <div className="text-zinc-500 text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                                                <Mountain size={14} />
                                                {battle.location}
                                                {battle.technique && (
                                                    <span className="text-toxic-cyan text-xs font-bold">• {battle.technique}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-zinc-600 text-sm font-bold tracking-widest">{battle.date}</span>
                                        <span className={`px-3 py-1 text-sm font-bold hard-border border-2 ${battle.result === "WIN"
                                            ? "border-toxic-green text-toxic-green"
                                            : "border-red-500 text-red-500"
                                            }`}>
                                            {battle.result}
                                        </span>
                                        <button
                                            onClick={() => removeBattle(battle.id)}
                                            className="text-zinc-700 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* BADGES */}
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 hard-border mt-6">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                            <Award className="text-toxic-yellow" size={24} />
                            ACHIEVEMENTS <span className="text-zinc-600 text-sm">[{unlockedBadges.filter(b => b.unlocked).length}/{BADGE_DEFINITIONS.length}]</span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {unlockedBadges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className={`p-4 border-2 text-center transition-all hard-border ${badge.unlocked
                                        ? "bg-toxic-yellow/10 border-toxic-yellow/50 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                                        : "bg-black border-zinc-900 opacity-30 grayscale"
                                        }`}
                                >
                                    <div className="text-4xl mb-2 grayscale-0 filter-none">{badge.icon}</div>
                                    <div className={`text-sm font-bold ${badge.unlocked ? "text-toxic-yellow" : "text-zinc-600"}`}>
                                        {badge.name}
                                    </div>
                                    <div className="text-zinc-500 text-[10px] uppercase font-bold mt-2">{badge.description}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
