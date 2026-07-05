"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Car, Shirt, ImageIcon, Link2, Gamepad2, ExternalLink, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, PageHeader, BtnLink, Btn, fadeUp, stagger } from "@/components/ui";
import { loadJSON, saveJSON } from "../lib/storage";

// --- TYPES ---
type GearItem = {
    id: string;
    category: string;
    name: string;
};

type CarSpec = {
    id: string;
    category: "REAL" | "SIM-RACING";
    part: string;
    value: string;
    imageUrl?: string;
    link?: string;
};

const STORAGE_KEYS = {
    GEAR: "projectd_gear",
    CAR_SPECS: "projectd_carspecs",
};

export default function GaragePage() {
    const [gearList, setGearList] = useState<GearItem[]>([]);
    const [carSpecs, setCarSpecs] = useState<CarSpec[]>([]);
    const [activeCarTab, setActiveCarTab] = useState<"REAL" | "SIM-RACING">("REAL");
    const [isLoaded, setIsLoaded] = useState(false);

    const [newGear, setNewGear] = useState({ category: "", name: "" });
    const [newSpec, setNewSpec] = useState({ part: "", value: "", imageUrl: "", link: "" });

    useEffect(() => {
        setGearList(loadJSON<GearItem[]>(STORAGE_KEYS.GEAR, []));
        setCarSpecs(loadJSON<CarSpec[]>(STORAGE_KEYS.CAR_SPECS, []));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) saveJSON(STORAGE_KEYS.GEAR, gearList);
    }, [gearList, isLoaded]);

    useEffect(() => {
        if (isLoaded) saveJSON(STORAGE_KEYS.CAR_SPECS, carSpecs);
    }, [carSpecs, isLoaded]);

    const addGear = () => {
        if (!newGear.category.trim() || !newGear.name.trim()) return;
        setGearList([...gearList, { id: Date.now().toString(), ...newGear }]);
        setNewGear({ category: "", name: "" });
    };

    const addSpec = () => {
        if (!newSpec.part.trim() || !newSpec.value.trim()) return;
        setCarSpecs([
            ...carSpecs,
            {
                id: Date.now().toString(),
                category: activeCarTab,
                part: newSpec.part,
                value: newSpec.value,
                imageUrl: newSpec.imageUrl || undefined,
                link: newSpec.link || undefined,
            },
        ]);
        setNewSpec({ part: "", value: "", imageUrl: "", link: "" });
    };

    const filteredSpecs = carSpecs.filter((spec) => spec.category === activeCarTab);

    return (
        <PageShell>
            <PageHeader
                kicker="Configuration pilote & machine"
                title="Garage"
                sub="Ton loadout, tes pièces et ton setup sim-racing."
                actions={
                    <BtnLink href="/cars" variant="primary">
                        <Gauge size={17} />
                        Mes voitures
                    </BtnLink>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                {/* ===== DRIVER LOADOUT ===== */}
                <motion.section variants={fadeUp} initial="hidden" animate="show">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                            <Shirt size={17} />
                        </span>
                        <h2 className="font-display font-bold uppercase tracking-widest text-lg text-white">
                            Driver loadout
                        </h2>
                    </div>

                    {/* Add form */}
                    <div className="glass p-4 mb-5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Catégorie (ex: Haut)"
                                className="field"
                                value={newGear.category}
                                onChange={(e) => setNewGear({ ...newGear, category: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Item (ex: Pull Satyn)"
                                className="field"
                                value={newGear.name}
                                onChange={(e) => setNewGear({ ...newGear, name: e.target.value })}
                            />
                        </div>
                        <Btn onClick={addGear} variant="ghost" className="w-full" disabled={!newGear.category.trim() || !newGear.name.trim()}>
                            <Plus size={16} /> Ajouter à l&apos;inventaire
                        </Btn>
                    </div>

                    {/* Items */}
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                        {gearList.length === 0 && (
                            <p className="glass text-zinc-600 text-sm font-semibold text-center py-6 uppercase tracking-widest">
                                Inventaire vide
                            </p>
                        )}
                        <AnimatePresence>
                            {gearList.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    variants={fadeUp}
                                    exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                                    className="glass glass-hover flex justify-between items-center p-4 group"
                                >
                                    <div>
                                        <span className="label text-accent block">{item.category}</span>
                                        <span className="font-display font-semibold text-white text-lg uppercase tracking-wide">
                                            {item.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setGearList(gearList.filter((g) => g.id !== item.id))}
                                        className="text-zinc-700 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all p-2"
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </motion.section>

                {/* ===== MACHINE SPECS ===== */}
                <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.08 }}>
                    <div className="flex items-center gap-3 mb-5">
                        <span className="grid place-items-center w-9 h-9 rounded-lg bg-ice/10 border border-ice/30 text-ice">
                            <Car size={17} />
                        </span>
                        <h2 className="font-display font-bold uppercase tracking-widest text-lg text-white">
                            Machine specs
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="glass p-1.5 flex gap-1.5 mb-5">
                        {(["REAL", "SIM-RACING"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveCarTab(tab)}
                                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-semibold uppercase tracking-widest text-sm transition-colors ${activeCarTab === tab ? "text-black" : "text-zinc-500 hover:text-zinc-200"
                                    }`}
                            >
                                {activeCarTab === tab && (
                                    <motion.span
                                        layoutId="garage-tab"
                                        className="absolute inset-0 rounded-xl bg-ice"
                                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                    />
                                )}
                                <span className="relative flex items-center gap-2">
                                    {tab === "REAL" ? <Car size={15} /> : <Gamepad2 size={15} />}
                                    {tab === "REAL" ? "Réel" : "Sim-racing"}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Add form */}
                    <div className="glass p-4 mb-5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Pièce (ex: Moteur)"
                                className="field"
                                value={newSpec.part}
                                onChange={(e) => setNewSpec({ ...newSpec, part: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Valeur (ex: 4A-GE)"
                                className="field"
                                value={newSpec.value}
                                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ImageIcon size={15} className="text-zinc-600 shrink-0" />
                            <input
                                type="text"
                                placeholder="URL de l'image (optionnel)"
                                className="field"
                                value={newSpec.imageUrl}
                                onChange={(e) => setNewSpec({ ...newSpec, imageUrl: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Link2 size={15} className="text-zinc-600 shrink-0" />
                            <input
                                type="text"
                                placeholder="Lien externe (optionnel)"
                                className="field"
                                value={newSpec.link}
                                onChange={(e) => setNewSpec({ ...newSpec, link: e.target.value })}
                            />
                        </div>
                        <Btn onClick={addSpec} variant="ghost" className="w-full" disabled={!newSpec.part.trim() || !newSpec.value.trim()}>
                            <Plus size={16} /> {activeCarTab === "SIM-RACING" ? "Installer le software" : "Installer la pièce"}
                        </Btn>
                    </div>

                    {/* Specs list */}
                    <div className="space-y-2">
                        {filteredSpecs.length === 0 && (
                            <p className="glass text-zinc-600 text-sm font-semibold text-center py-6 uppercase tracking-widest">
                                {activeCarTab === "SIM-RACING" ? "Aucun software installé" : "Aucune pièce installée"}
                            </p>
                        )}
                        <AnimatePresence>
                            {filteredSpecs.map((spec) => (
                                <motion.div
                                    key={spec.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                                    className="glass glass-hover p-4 group"
                                >
                                    <div className="flex items-start gap-4">
                                        {spec.imageUrl && (
                                            <div className="w-14 h-14 shrink-0 rounded-lg border border-line overflow-hidden bg-black/40">
                                                <img
                                                    src={spec.imageUrl}
                                                    alt={spec.part}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <span className="label block">{spec.part}</span>
                                            <span className="font-display font-bold text-ice text-lg uppercase tracking-wide break-words">
                                                {spec.value}
                                            </span>
                                            {spec.link && (
                                                <a
                                                    href={spec.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-ice mt-1 transition-colors uppercase tracking-widest"
                                                >
                                                    <ExternalLink size={11} />
                                                    Voir
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setCarSpecs(carSpecs.filter((s) => s.id !== spec.id))}
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
                </motion.section>
            </div>
        </PageShell>
    );
}
