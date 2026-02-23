"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Car as CarIcon, Gauge, Weight, Settings, ArrowLeft, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Drivetrain, ModLevel, STORAGE_KEYS, getPowerToWeight } from "../lib/types";

const DRIVETRAINS: { value: Drivetrain; label: string }[] = [
    { value: "FR", label: "FR (Propulsion)" },
    { value: "FF", label: "FF (Traction)" },
    { value: "MR", label: "MR (Moteur central)" },
    { value: "RR", label: "RR (Moteur arrière)" },
    { value: "AWD", label: "AWD (4 roues motrices)" },
];

const MOD_LEVELS: { value: ModLevel; label: string; color: string }[] = [
    { value: "STOCK", label: "Stock", color: "text-toxic-green border-toxic-green" },
    { value: "TUNED", label: "Tuned", color: "text-toxic-cyan border-toxic-cyan" },
    { value: "FULL_RACE", label: "Full Race", color: "text-toxic-magenta border-toxic-magenta" },
];

export default function CarsPage() {
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<Car>>({
        name: "",
        make: "",
        model: "",
        year: undefined,
        power: 100,
        weight: 1000,
        drivetrain: "FR",
        mods: "STOCK",
        color: "#FACC15",
    });

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.CARS);
        if (saved) {
            try { setCars(JSON.parse(saved)); } catch { }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
        }
    }, [cars, isLoaded]);

    const handleSubmit = () => {
        if (!formData.name || !formData.power || !formData.weight) return;

        const car: Car = {
            id: editingCar?.id || Date.now().toString(),
            name: formData.name || "",
            make: formData.make || "",
            model: formData.model || "",
            year: formData.year,
            power: formData.power || 100,
            weight: formData.weight || 1000,
            drivetrain: formData.drivetrain || "FR",
            mods: formData.mods || "STOCK",
            color: formData.color,
        };

        if (editingCar) {
            setCars(cars.map(c => c.id === editingCar.id ? car : c));
        } else {
            setCars([...cars, car]);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: "",
            make: "",
            model: "",
            year: undefined,
            power: 100,
            weight: 1000,
            drivetrain: "FR",
            mods: "STOCK",
            color: "#FACC15",
        });
        setEditingCar(null);
        setShowForm(false);
    };

    const startEdit = (car: Car) => {
        setFormData(car);
        setEditingCar(car);
        setShowForm(true);
    };

    const deleteCar = (id: string) => {
        setCars(cars.filter(c => c.id !== id));
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 font-pixel">

            {/* Header */}
            <header className="mb-8 border-b-2 border-zinc-800 pb-4">
                <Link href="/garage" className="text-zinc-500 hover:text-toxic-cyan text-sm flex items-center gap-2 mb-4 font-bold tracking-widest uppercase">
                    <ArrowLeft size={14} /> Retour au garage
                </Link>
                <h1 className="text-4xl font-bold italic tracking-tighter text-toxic-magenta glitch-hover text-shadow-neon">
                    MES VOITURES
                </h1>
                <p className="text-zinc-500 mt-2 font-bold tracking-widest uppercase">Gère tes voitures et leurs specs MF Ghost</p>
            </header>

            {/* Add Button */}
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-toxic-green text-black px-6 py-3 font-bold hover:bg-white transition-colors mb-8 hard-border shadow-[0_0_15px_rgba(0,255,65,0.4)] uppercase"
            >
                <Plus size={18} />
                AJOUTER UNE VOITURE
            </button>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-pixel"
                        onClick={() => resetForm()}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#050510] border-2 border-zinc-800 hard-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-toxic-cyan mb-6 flex items-center gap-2 uppercase tracking-widest text-shadow-neon">
                                <CarIcon size={24} />
                                {editingCar ? "MODIFIER LA VOITURE" : "NOUVELLE VOITURE"}
                            </h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase">NOM COMPLET *</label>
                                    <input
                                        type="text"
                                        placeholder="EX: TOYOTA AE86 TRUENO"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                    />
                                </div>

                                {/* Make & Model */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase">MARQUE</label>
                                        <input
                                            type="text"
                                            placeholder="TOYOTA"
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                            className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase">MODÈLE</label>
                                        <input
                                            type="text"
                                            placeholder="AE86"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Year & Color */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase">ANNÉE</label>
                                        <input
                                            type="number"
                                            placeholder="1986"
                                            value={formData.year || ""}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                                            className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase">COULEUR</label>
                                        <div className="relative w-full h-10 border-2 border-zinc-800 hard-border cursor-pointer focus-within:border-toxic-cyan transition-colors overflow-hidden">
                                            <input
                                                type="color"
                                                value={formData.color || "#00FFFF"}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer"
                                            />
                                            <div className="w-full h-full" style={{ backgroundColor: formData.color || "#00FFFF" }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Power & Weight */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase flex items-center gap-1">
                                            <Gauge size={12} /> PUISSANCE (ch) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="130"
                                            value={formData.power || ""}
                                            onChange={(e) => setFormData({ ...formData, power: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-500 text-[10px] block mb-1 font-bold tracking-widest uppercase flex items-center gap-1">
                                            <Weight size={12} /> POIDS (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="940"
                                            value={formData.weight || ""}
                                            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-black border-2 border-zinc-800 hard-border px-3 py-2 text-white font-bold uppercase transition-colors focus:border-toxic-cyan outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Power/Weight Ratio Display */}
                                {formData.power && formData.weight && (
                                    <div className="bg-black border-2 border-zinc-800 hard-border p-3 text-center">
                                        <div className="text-zinc-500 text-[10px] tracking-widest font-bold uppercase">RATIO POIDS/PUISSANCE</div>
                                        <div className="text-2xl font-bold text-toxic-yellow text-shadow-[0_0_10px_rgba(255,255,0,0.3)]">
                                            {(formData.weight / formData.power).toFixed(2)} kg/ch
                                        </div>
                                    </div>
                                )}

                                {/* Drivetrain */}
                                <div>
                                    <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase">TRANSMISSION</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DRIVETRAINS.map((dt) => (
                                            <button
                                                key={dt.value}
                                                onClick={() => setFormData({ ...formData, drivetrain: dt.value })}
                                                className={`p-2 text-xs font-bold border-2 hard-border transition-colors uppercase tracking-wider ${formData.drivetrain === dt.value
                                                    ? "bg-toxic-cyan/20 border-toxic-cyan text-toxic-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                                    : "bg-black border-zinc-800 text-zinc-500 hover:border-toxic-cyan hover:text-toxic-cyan"
                                                    }`}
                                            >
                                                {dt.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mods */}
                                <div>
                                    <label className="text-zinc-500 text-[10px] block mb-2 font-bold tracking-widest uppercase flex items-center gap-1">
                                        <Settings size={12} /> NIVEAU DE MODIFICATION
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MOD_LEVELS.map((mod) => (
                                            <button
                                                key={mod.value}
                                                onClick={() => setFormData({ ...formData, mods: mod.value })}
                                                className={`p-2 text-xs font-bold border-2 hard-border transition-colors uppercase tracking-wider ${formData.mods === mod.value
                                                    ? `bg-opacity-20 ${mod.color} bg-current shadow-[0_0_10px_currentColor]`
                                                    : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                                                    }`}
                                            >
                                                {mod.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-6 border-t-2 border-zinc-800 mt-6">
                                    <button
                                        onClick={() => resetForm()}
                                        className="flex-1 px-4 py-3 bg-black border-2 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white font-bold transition-colors hard-border uppercase tracking-widest"
                                    >
                                        ANNULER
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!formData.name || !formData.power || !formData.weight}
                                        className="flex-1 px-4 py-3 bg-toxic-green text-black font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hard-border uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:shadow-none"
                                    >
                                        {editingCar ? "MODIFIER" : "AJOUTER"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cars Grid */}
            {cars.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 hard-border bg-zinc-950/50">
                    <CarIcon size={48} className="mx-auto text-zinc-800 mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400 mb-2 uppercase tracking-wide">Aucune voiture</h2>
                    <p className="text-zinc-600 font-bold tracking-widest uppercase">Ajoute ta première voiture pour commencer !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car, index) => (
                        <motion.div
                            key={car.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-zinc-950 border-2 border-zinc-800 hard-border overflow-hidden hover:border-toxic-cyan transition-colors"
                        >
                            {/* Color Bar */}
                            <div
                                className="h-4 border-b-2 border-zinc-800"
                                style={{ backgroundColor: car.color || "#00FFFF" }}
                            />

                            <div className="p-4">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{car.name}</h3>
                                        {car.year && (
                                            <p className="text-zinc-500 text-xs font-bold tracking-widest">{car.year}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold border-2 hard-border ${MOD_LEVELS.find(m => m.value === car.mods)?.color
                                        } uppercase tracking-widest shadow-[0_0_10px_currentColor]`} style={{ opacity: 0.9 }}>
                                        {car.mods}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-black border-2 border-zinc-800 hard-border p-2 text-center">
                                        <div className="text-xl font-bold text-toxic-yellow">{car.power}</div>
                                        <div className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">ch</div>
                                    </div>
                                    <div className="bg-black border-2 border-zinc-800 hard-border p-2 text-center">
                                        <div className="text-xl font-bold text-toxic-cyan">{car.weight}</div>
                                        <div className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">kg</div>
                                    </div>
                                    <div className="bg-black border-2 border-zinc-800 hard-border p-2 text-center">
                                        <div className="text-xl font-bold text-toxic-green">{car.drivetrain}</div>
                                        <div className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">trans.</div>
                                    </div>
                                </div>

                                {/* Power/Weight */}
                                <div className="flex items-center justify-between py-3 border-t-2 border-zinc-800 mb-2">
                                    <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase flex items-center gap-1">
                                        <Zap size={12} className="text-toxic-magenta" /> Ratio
                                    </span>
                                    <span className="text-toxic-cyan font-bold text-lg text-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                                        {getPowerToWeight(car).toFixed(2)} kg/ch
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => startEdit(car)}
                                        className="flex-1 text-sm py-2 bg-zinc-950 border-2 border-zinc-800 hover:bg-zinc-800 hover:border-toxic-cyan transition-colors hard-border font-bold uppercase tracking-widest text-zinc-300 hover:text-toxic-cyan"
                                    >
                                        MODIFIER
                                    </button>
                                    <button
                                        onClick={() => deleteCar(car.id)}
                                        className="px-4 py-2 bg-black border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black transition-colors hard-border shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
