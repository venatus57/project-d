"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Car, Shirt, Image, Link2, Gamepad2, ExternalLink, Gauge } from "lucide-react";
import { motion } from "framer-motion";

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

// --- CLÉS LOCALSTORAGE ---
const STORAGE_KEYS = {
    GEAR: "projectd_gear",
    CAR_SPECS: "projectd_carspecs",
};

export default function GaragePage() {
    // --- ÉTATS (STATE) ---
    const [gearList, setGearList] = useState<GearItem[]>([]);
    const [carSpecs, setCarSpecs] = useState<CarSpec[]>([]);
    const [activeCarTab, setActiveCarTab] = useState<"REAL" | "SIM-RACING">("REAL");
    const [isLoaded, setIsLoaded] = useState(false);

    // Pour les formulaires d'ajout
    const [newGear, setNewGear] = useState({ category: "", name: "" });
    const [newSpec, setNewSpec] = useState({
        part: "",
        value: "",
        imageUrl: "",
        link: "",
        category: "REAL" as "REAL" | "SIM-RACING"
    });

    // --- CHARGEMENT INITIAL DEPUIS LOCALSTORAGE ---
    useEffect(() => {
        const savedGear = localStorage.getItem(STORAGE_KEYS.GEAR);
        const savedSpecs = localStorage.getItem(STORAGE_KEYS.CAR_SPECS);

        if (savedGear) {
            try { setGearList(JSON.parse(savedGear)); } catch { }
        }
        if (savedSpecs) {
            try { setCarSpecs(JSON.parse(savedSpecs)); } catch { }
        }
        setIsLoaded(true);
    }, []);

    // --- SAUVEGARDE AUTOMATIQUE ---
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEYS.GEAR, JSON.stringify(gearList));
        }
    }, [gearList, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEYS.CAR_SPECS, JSON.stringify(carSpecs));
        }
    }, [carSpecs, isLoaded]);

    // --- FONCTIONS ---

    // Ajouter un vêtement
    const addGear = () => {
        if (!newGear.category || !newGear.name) return;
        const item: GearItem = {
            id: Date.now().toString(),
            category: newGear.category,
            name: newGear.name,
        };
        setGearList([...gearList, item]);
        setNewGear({ category: "", name: "" });
    };

    // Supprimer un vêtement
    const removeGear = (id: string) => {
        setGearList(gearList.filter((item) => item.id !== id));
    };

    // Ajouter une pièce auto
    const addSpec = () => {
        if (!newSpec.part || !newSpec.value) return;
        const spec: CarSpec = {
            id: Date.now().toString(),
            category: activeCarTab,
            part: newSpec.part,
            value: newSpec.value,
            imageUrl: newSpec.imageUrl || undefined,
            link: newSpec.link || undefined,
        };
        setCarSpecs([...carSpecs, spec]);
        setNewSpec({ part: "", value: "", imageUrl: "", link: "", category: activeCarTab });
    };

    // Filtrer les specs par catégorie
    const filteredSpecs = carSpecs.filter(spec => spec.category === activeCarTab);

    // --- RENDU VISUEL (JSX) ---
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* HEADER */}
            <header className="mb-8 border-b border-zinc-800 pb-4">
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                    PROJECT D // GARAGE
                </h1>
                <p className="text-zinc-500 mt-2">CONFIGURATION PILOTE & MACHINE</p>
            </header>

            {/* CARS LINK */}
            <Link
                href="/cars"
                className="inline-flex items-center gap-3 bg-green-500 text-black hover:bg-green-400 px-6 py-3 font-bold transition-colors mb-8"
            >
                <Gauge size={20} />
                MES VOITURES (SPECS MF GHOST)
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* SECTION 1 : DRIVER LOADOUT */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Shirt className="text-zinc-400" />
                        <h2 className="text-2xl font-bold">DRIVER LOADOUT</h2>
                    </div>

                    {/* Formulaire d'ajout */}
                    <div className="bg-zinc-900/50 p-4 border border-zinc-800 mb-6 rounded">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Catégorie (ex: Haut)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newGear.category}
                                onChange={(e) => setNewGear({ ...newGear, category: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Item (ex: Pull Satyn)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newGear.name}
                                onChange={(e) => setNewGear({ ...newGear, name: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={addGear}
                            className="w-full bg-zinc-100 text-black hover:bg-yellow-500 hover:text-black transition-colors py-2 text-sm font-bold flex items-center justify-center gap-2 rounded"
                        >
                            <Plus size={16} /> AJOUTER À L&apos;INVENTAIRE
                        </button>
                    </div>

                    {/* Liste des items */}
                    <div className="space-y-2">
                        {gearList.length === 0 && (
                            <p className="text-zinc-600 text-sm italic">Aucun équipement enregistré...</p>
                        )}

                        {gearList.map((item) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={item.id}
                                className="flex justify-between items-center bg-zinc-900 p-3 border-l-2 border-zinc-700 hover:border-yellow-500 transition-colors group"
                            >
                                <div>
                                    <span className="text-zinc-500 text-xs uppercase block tracking-wider">
                                        {item.category}
                                    </span>
                                    <span className="text-zinc-100 font-medium">
                                        {item.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeGear(item.id)}
                                    className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* SECTION 2 : CAR SPECS */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Car className="text-zinc-400" />
                        <h2 className="text-2xl font-bold">MACHINE SPECS</h2>
                    </div>

                    {/* TABS: REAL / SIM-RACING */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveCarTab("REAL")}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border transition-all ${activeCarTab === "REAL"
                                ? "bg-yellow-500 text-black border-yellow-500"
                                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                }`}
                        >
                            <Car size={16} /> REAL
                        </button>
                        <button
                            onClick={() => setActiveCarTab("SIM-RACING")}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border transition-all ${activeCarTab === "SIM-RACING"
                                ? "bg-yellow-500 text-black border-yellow-500"
                                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
                                }`}
                        >
                            <Gamepad2 size={16} /> SIM-RACING
                        </button>
                    </div>

                    {/* Formulaire Auto */}
                    <div className="bg-zinc-900/50 p-4 border border-zinc-800 mb-6 rounded">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="Pièce (ex: Moteur)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newSpec.part}
                                onChange={(e) => setNewSpec({ ...newSpec, part: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Valeur (ex: 4A-GE)"
                                className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded"
                                value={newSpec.value}
                                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                            />
                        </div>

                        {/* Champs optionnels : Image & Lien */}
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Image size={16} className="text-zinc-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="URL de l'image (optionnel)"
                                    className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded w-full"
                                    value={newSpec.imageUrl}
                                    onChange={(e) => setNewSpec({ ...newSpec, imageUrl: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Link2 size={16} className="text-zinc-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Lien externe (optionnel)"
                                    className="bg-zinc-950 border border-zinc-700 p-2 text-sm focus:border-yellow-500 outline-none rounded w-full"
                                    value={newSpec.link}
                                    onChange={(e) => setNewSpec({ ...newSpec, link: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={addSpec}
                            className="w-full bg-zinc-100 text-black hover:bg-yellow-500 hover:text-black transition-colors py-2 text-sm font-bold flex items-center justify-center gap-2 rounded"
                        >
                            <Plus size={16} /> {activeCarTab === "SIM-RACING" ? "AJOUTER AU SETUP" : "INSTALLER LA PIÈCE"}
                        </button>
                    </div>

                    {/* Liste des Specs */}
                    <div className="border border-zinc-800 rounded overflow-hidden">
                        {filteredSpecs.length === 0 && (
                            <p className="text-zinc-600 text-sm italic p-4">
                                {activeCarTab === "SIM-RACING" ? "Aucun setup sim-racing..." : "Aucune pièce installée..."}
                            </p>
                        )}
                        {filteredSpecs.map((spec, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={spec.id}
                                className={`p-4 border-b border-zinc-800 ${index % 2 === 0 ? 'bg-zinc-900' : 'bg-transparent'}`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    {/* Image si présente */}
                                    {spec.imageUrl && (
                                        <div className="w-16 h-16 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                                            <img
                                                src={spec.imageUrl}
                                                alt={spec.part}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Infos */}
                                    <div className="flex-1">
                                        <span className="text-zinc-400 text-sm font-mono block">{spec.part}</span>
                                        <span className="text-yellow-500 font-bold font-mono">{spec.value}</span>

                                        {/* Lien si présent */}
                                        {spec.link && (
                                            <a
                                                href={spec.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-yellow-500 mt-1 transition-colors"
                                            >
                                                <ExternalLink size={12} />
                                                Voir le lien
                                            </a>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => setCarSpecs(carSpecs.filter(s => s.id !== spec.id))}
                                        className="text-zinc-700 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
