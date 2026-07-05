"use client";

import { useState, useEffect } from "react";
import {
    Trophy, Mountain, Flame, Target, Plus, Trash2,
    TrendingUp, TrendingDown, Download, Upload, Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfile, saveProfile, PlayerProfile } from "../lib/profile";
import { loadJSON, saveJSON } from "../lib/storage";
import { PageShell, PageHeader, Btn, fadeUp, stagger } from "@/components/ui";

// --- TYPES ---
type BattleRecord = {
    id: string;
    opponent: string;
    location: string;
    result: "WIN" | "LOSS";
    date: string;
    technique?: string;
};

type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (battles: BattleRecord[]) => boolean;
};

const BADGE_DEFINITIONS: Badge[] = [
    {
        id: "first_blood",
        name: "FIRST BLOOD",
        description: "Remporter ta première victoire",
        icon: "🩸",
        condition: (battles) => battles.filter((b) => b.result === "WIN").length >= 1,
    },
    {
        id: "downhill_king",
        name: "DOWNHILL KING",
        description: "Gagner 5 courses",
        icon: "👑",
        condition: (battles) => battles.filter((b) => b.result === "WIN").length >= 5,
    },
    {
        id: "akina_legend",
        name: "AKINA LEGEND",
        description: "Gagner 3 fois sur Akina",
        icon: "🏔️",
        condition: (battles) =>
            battles.filter((b) => b.result === "WIN" && b.location.toLowerCase().includes("akina")).length >= 3,
    },
    {
        id: "undefeated",
        name: "UNDEFEATED",
        description: "10 victoires consécutives",
        icon: "🔥",
        condition: (battles) => {
            const last10 = battles.slice(-10);
            return last10.length >= 10 && last10.every((b) => b.result === "WIN");
        },
    },
    {
        id: "gutter_master",
        name: "GUTTER MASTER",
        description: "Utiliser la technique Gutter Run",
        icon: "⚡",
        condition: (battles) => battles.some((b) => b.technique?.toLowerCase().includes("gutter")),
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
                if (
                    battles[i].result === "WIN" &&
                    battles[i - 1].result === "LOSS" &&
                    battles[i - 2].result === "LOSS" &&
                    battles[i - 3].result === "LOSS"
                ) {
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
        condition: (battles) => battles.filter((b) => b.result === "WIN").length >= 10,
    },
];

const BATTLES_KEY = "projectd_battles";

export default function ProfilePage() {
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [battles, setBattles] = useState<BattleRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);

    const [newBattle, setNewBattle] = useState({
        opponent: "",
        location: "",
        result: "WIN" as "WIN" | "LOSS",
        technique: "",
    });

    useEffect(() => {
        setProfile(getProfile());
        setBattles(loadJSON<BattleRecord[]>(BATTLES_KEY, []));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded && profile) saveProfile(profile);
    }, [profile, isLoaded]);

    useEffect(() => {
        if (isLoaded) saveJSON(BATTLES_KEY, battles);
    }, [battles, isLoaded]);

    const wins = battles.filter((b) => b.result === "WIN").length;
    const losses = battles.filter((b) => b.result === "LOSS").length;
    const winRate = battles.length > 0 ? Math.round((wins / battles.length) * 100) : 0;

    const unlockedBadges = BADGE_DEFINITIONS.map((badge) => ({
        ...badge,
        unlocked: badge.condition(battles),
    }));
    const unlockedCount = unlockedBadges.filter((b) => b.unlocked).length;

    const addBattle = () => {
        if (!newBattle.opponent.trim() || !newBattle.location.trim()) return;
        setBattles([
            ...battles,
            {
                id: Date.now().toString(),
                opponent: newBattle.opponent,
                location: newBattle.location,
                result: newBattle.result,
                date: new Date().toISOString().split("T")[0],
                technique: newBattle.technique || undefined,
            },
        ]);
        setNewBattle({ opponent: "", location: "", result: "WIN", technique: "" });
    };

    /* === SAVE MANAGEMENT === */
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
        a.download = `projectd_save_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                let imported = 0;
                for (const key in data) {
                    if (key.startsWith("projectd_") && typeof data[key] === "string") {
                        localStorage.setItem(key, data[key]);
                        imported++;
                    }
                }
                setImportMessage(`${imported} sauvegarde(s) importée(s) — rechargement…`);
                setTimeout(() => window.location.reload(), 1200);
            } catch {
                setImportMessage("Fichier de sauvegarde invalide.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <PageShell>
            <PageHeader
                kicker="Driver status"
                title="Profil"
                sub="Ton identité de pilote, tes battles et ta sauvegarde."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ===== COLUMN 1: DRIVER CARD ===== */}
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                    <motion.div variants={fadeUp} className="glass edge-accent p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="grid place-items-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/40 text-3xl shadow-[0_0_24px_-8px_rgba(255,59,87,0.5)]">
                                {profile?.avatar || "🏎️"}
                            </div>
                            <div className="min-w-0 flex-1">
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        value={profile?.driverName || ""}
                                        onChange={(e) =>
                                            setProfile((prev) => (prev ? { ...prev, driverName: e.target.value } : null))
                                        }
                                        className="field py-2! font-display font-bold uppercase"
                                    />
                                ) : (
                                    <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide truncate">
                                        {profile?.driverName || "Anonyme"}
                                    </h2>
                                )}
                                <p className="label text-accent mt-1">Project D member</p>
                            </div>
                        </div>

                        {isEditingProfile ? (
                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className="label block mb-1.5">Spécialité</label>
                                    <select
                                        value={profile?.specialty || "DOWNHILL"}
                                        onChange={(e) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, specialty: e.target.value as PlayerProfile["specialty"] } : null
                                            )
                                        }
                                        className="field"
                                    >
                                        <option value="DOWNHILL">DOWNHILL</option>
                                        <option value="UPHILL">UPHILL</option>
                                        <option value="BOTH">BOTH</option>
                                        <option value="MIXED">MIXED</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label block mb-1.5">Home mountain</label>
                                    <input
                                        type="text"
                                        value={profile?.homeMountain || ""}
                                        onChange={(e) =>
                                            setProfile((prev) => (prev ? { ...prev, homeMountain: e.target.value } : null))
                                        }
                                        className="field uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="label block mb-1.5">Avatar (emoji)</label>
                                    <input
                                        type="text"
                                        value={profile?.avatar || "🏎️"}
                                        onChange={(e) =>
                                            setProfile((prev) => (prev ? { ...prev, avatar: e.target.value } : null))
                                        }
                                        className="field text-center text-2xl"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-5 border-y border-line py-4">
                                <div className="flex justify-between items-center">
                                    <span className="label">Spécialité</span>
                                    <span className="font-display font-bold text-ice uppercase tracking-wider">
                                        {profile?.specialty || "DOWNHILL"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="label">Home mountain</span>
                                    <span className="font-display font-bold text-white uppercase tracking-wider">
                                        {profile?.homeMountain || "AKINA"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="label">Odomètre</span>
                                    <span className="mono-num font-bold text-mint">
                                        {profile?.totalDistance.toFixed(1) || "0.0"} km
                                    </span>
                                </div>
                            </div>
                        )}

                        <Btn
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            variant={isEditingProfile ? "primary" : "ghost"}
                            className="w-full mb-5"
                        >
                            {isEditingProfile ? "Enregistrer le profil" : "Modifier le profil"}
                        </Btn>

                        {/* Save management */}
                        <div className="border-t border-line pt-5">
                            <h3 className="label mb-3">Gestion de la sauvegarde</h3>
                            <div className="flex gap-2">
                                <Btn onClick={handleExport} variant="outline" className="flex-1 px-2! py-2.5! text-xs!">
                                    <Download size={13} /> Export
                                </Btn>
                                <label className={`flex-1 ${"cursor-pointer"}`}>
                                    <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-2 py-2.5 font-display font-semibold uppercase tracking-widest text-xs transition-all border border-line text-zinc-300 hover:border-ice/60 hover:text-white">
                                        <Upload size={13} /> Import
                                    </span>
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                            {importMessage && (
                                <p className="text-xs text-gold font-semibold mt-3 text-center">{importMessage}</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div variants={fadeUp} className="glass p-6">
                        <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-widest text-white mb-4">
                            <Trophy size={17} className="text-gold" /> Statistiques
                        </h3>
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                            <div className="rounded-xl bg-black/30 border border-line p-3">
                                <div className="mono-num text-3xl font-bold text-mint">{wins}</div>
                                <div className="label mt-0.5">Wins</div>
                            </div>
                            <div className="rounded-xl bg-black/30 border border-line p-3">
                                <div className="mono-num text-3xl font-bold text-accent">{losses}</div>
                                <div className="label mt-0.5">Losses</div>
                            </div>
                            <div className="rounded-xl bg-black/30 border border-line p-3">
                                <div className="mono-num text-3xl font-bold text-gold">{winRate}%</div>
                                <div className="label mt-0.5">Win rate</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* ===== COLUMN 2-3: BATTLES + BADGES ===== */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Add battle */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass p-5">
                        <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-widest text-white mb-4">
                            <Flame size={17} className="text-accent" /> Nouveau battle
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Adversaire"
                                className="field"
                                value={newBattle.opponent}
                                onChange={(e) => setNewBattle({ ...newBattle, opponent: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Lieu (ex: Akina)"
                                className="field"
                                value={newBattle.location}
                                onChange={(e) => setNewBattle({ ...newBattle, location: e.target.value })}
                            />
                            <select
                                className="field"
                                value={newBattle.result}
                                onChange={(e) => setNewBattle({ ...newBattle, result: e.target.value as "WIN" | "LOSS" })}
                            >
                                <option value="WIN">✓ Victoire</option>
                                <option value="LOSS">✗ Défaite</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Technique (opt.)"
                                className="field"
                                value={newBattle.technique}
                                onChange={(e) => setNewBattle({ ...newBattle, technique: e.target.value })}
                            />
                        </div>
                        <Btn
                            onClick={addBattle}
                            variant="ghost"
                            className="w-full"
                            disabled={!newBattle.opponent.trim() || !newBattle.location.trim()}
                        >
                            <Plus size={16} /> Enregistrer le battle
                        </Btn>
                    </motion.div>

                    {/* Battle history */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass overflow-hidden">
                        <div className="p-4 border-b border-line flex items-center gap-2">
                            <Target size={17} className="text-zinc-500" />
                            <h3 className="font-display font-bold uppercase tracking-widest text-white">
                                Battle logs
                            </h3>
                            <span className="label">[{battles.length}]</span>
                        </div>

                        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                            {battles.length === 0 && (
                                <p className="text-zinc-600 text-sm font-semibold text-center py-8 uppercase tracking-widest">
                                    Aucun battle enregistré
                                </p>
                            )}

                            <AnimatePresence>
                                {[...battles].reverse().map((battle) => (
                                    <motion.div
                                        key={battle.id}
                                        layout
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-black/25 border border-line hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div
                                                className={`shrink-0 grid place-items-center w-11 h-11 rounded-xl border ${battle.result === "WIN"
                                                    ? "border-mint/40 bg-mint/10 text-mint"
                                                    : "border-red-500/40 bg-red-500/10 text-red-400"
                                                    }`}
                                            >
                                                {battle.result === "WIN" ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-display font-bold text-white uppercase tracking-wide truncate">
                                                    vs {battle.opponent}
                                                </div>
                                                <div className="text-zinc-500 text-xs font-semibold flex items-center gap-2 uppercase tracking-wider">
                                                    <Mountain size={11} />
                                                    <span className="truncate">{battle.location}</span>
                                                    {battle.technique && (
                                                        <span className="text-ice truncate">· {battle.technique}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="label hidden md:inline">{battle.date}</span>
                                            <span
                                                className={`px-2.5 py-1 rounded-full border text-[10px] font-display font-bold uppercase tracking-widest ${battle.result === "WIN"
                                                    ? "border-mint/40 text-mint bg-mint/10"
                                                    : "border-red-500/40 text-red-400 bg-red-500/10"
                                                    }`}
                                            >
                                                {battle.result}
                                            </span>
                                            <button
                                                onClick={() => setBattles(battles.filter((b) => b.id !== battle.id))}
                                                className="text-zinc-700 hover:text-red-400 transition-colors p-1"
                                                aria-label="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Badges */}
                    <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass p-5">
                        <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-widest text-white mb-5">
                            <Award size={17} className="text-gold" /> Achievements
                            <span className="label">
                                [{unlockedCount}/{BADGE_DEFINITIONS.length}]
                            </span>
                        </h3>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 md:grid-cols-4 gap-3"
                        >
                            {unlockedBadges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    variants={fadeUp}
                                    whileHover={badge.unlocked ? { y: -3, scale: 1.02 } : undefined}
                                    className={`p-4 rounded-xl border text-center transition-colors ${badge.unlocked
                                        ? "bg-gold/8 border-gold/40 shadow-[0_0_20px_-8px_rgba(255,194,51,0.4)]"
                                        : "bg-black/25 border-line opacity-40 grayscale"
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{badge.icon}</div>
                                    <div
                                        className={`text-xs font-display font-bold uppercase tracking-wider ${badge.unlocked ? "text-gold" : "text-zinc-600"
                                            }`}
                                    >
                                        {badge.name}
                                    </div>
                                    <div className="label mt-1.5 normal-case tracking-wide!">{badge.description}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </PageShell>
    );
}
