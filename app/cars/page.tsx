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
    { value: "STOCK", label: "Stock", color: "text-green-500 border-green-500" },
    { value: "TUNED", label: "Tuned", color: "text-yellow-500 border-yellow-500" },
    { value: "FULL_RACE", label: "Full Race", color: "text-red-500 border-red-500" },
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">

            {/* Header */}
            <header className="mb-8 border-b border-zinc-800 pb-4">
                <Link href="/garage" className="text-zinc-500 hover:text-yellow-500 text-sm flex items-center gap-2 mb-4">
                    <ArrowLeft size={14} /> Retour au garage
                </Link>
                <h1 className="text-4xl font-bold italic tracking-tighter text-yellow-500">
                    MES VOITURES
                </h1>
                <p className="text-zinc-500 mt-2">Gère tes voitures et leurs specs MF Ghost</p>
            </header>

            {/* Add Button */}
            <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 font-bold hover:bg-yellow-400 transition-colors mb-8"
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
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => resetForm()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                                <CarIcon size={24} />
                                {editingCar ? "MODIFIER LA VOITURE" : "NOUVELLE VOITURE"}
                            </h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">NOM COMPLET *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Toyota AE86 Trueno"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                    />
                                </div>

                                {/* Make & Model */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1">MARQUE</label>
                                        <input
                                            type="text"
                                            placeholder="Toyota"
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1">MODÈLE</label>
                                        <input
                                            type="text"
                                            placeholder="AE86"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Year & Color */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1">ANNÉE</label>
                                        <input
                                            type="number"
                                            placeholder="1986"
                                            value={formData.year || ""}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1">COULEUR</label>
                                        <input
                                            type="color"
                                            value={formData.color || "#FACC15"}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Power & Weight */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1 flex items-center gap-1">
                                            <Gauge size={12} /> PUISSANCE (ch) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="130"
                                            value={formData.power || ""}
                                            onChange={(e) => setFormData({ ...formData, power: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1 flex items-center gap-1">
                                            <Weight size={12} /> POIDS (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="940"
                                            value={formData.weight || ""}
                                            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Power/Weight Ratio Display */}
                                {formData.power && formData.weight && (
                                    <div className="bg-zinc-800/50 rounded p-3 text-center">
                                        <div className="text-zinc-500 text-xs">RATIO POIDS/PUISSANCE</div>
                                        <div className="text-2xl font-bold text-yellow-500">
                                            {(formData.weight / formData.power).toFixed(2)} kg/ch
                                        </div>
                                    </div>
                                )}

                                {/* Drivetrain */}
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-2">TRANSMISSION</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DRIVETRAINS.map((dt) => (
                                            <button
                                                key={dt.value}
                                                onClick={() => setFormData({ ...formData, drivetrain: dt.value })}
                                                className={`p-2 text-xs border rounded transition-colors ${formData.drivetrain === dt.value
                                                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                                                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                                    }`}
                                            >
                                                {dt.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mods */}
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-2 flex items-center gap-1">
                                        <Settings size={12} /> NIVEAU DE MODIFICATION
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MOD_LEVELS.map((mod) => (
                                            <button
                                                key={mod.value}
                                                onClick={() => setFormData({ ...formData, mods: mod.value })}
                                                className={`p-2 text-xs border rounded transition-colors ${formData.mods === mod.value
                                                        ? `bg-opacity-20 ${mod.color} bg-current`
                                                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                                    }`}
                                            >
                                                {mod.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => resetForm()}
                                        className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors rounded"
                                    >
                                        ANNULER
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!formData.name || !formData.power || !formData.weight}
                                        className="flex-1 px-4 py-3 bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
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
                <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
                    <CarIcon size={48} className="mx-auto text-zinc-700 mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400 mb-2">Aucune voiture</h2>
                    <p className="text-zinc-600">Ajoute ta première voiture pour commencer !</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cars.map((car, index) => (
                        <motion.div
                            key={car.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-colors"
                        >
                            {/* Color Bar */}
                            <div
                                className="h-2"
                                style={{ backgroundColor: car.color || "#FACC15" }}
                            />

                            <div className="p-4">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-100">{car.name}</h3>
                                        {car.year && (
                                            <p className="text-zinc-500 text-xs">{car.year}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold border rounded ${MOD_LEVELS.find(m => m.value === car.mods)?.color
                                        }`}>
                                        {car.mods}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-zinc-800/50 p-2 rounded text-center">
                                        <div className="text-lg font-bold text-yellow-500">{car.power}</div>
                                        <div className="text-zinc-600 text-xs">ch</div>
                                    </div>
                                    <div className="bg-zinc-800/50 p-2 rounded text-center">
                                        <div className="text-lg font-bold text-blue-500">{car.weight}</div>
                                        <div className="text-zinc-600 text-xs">kg</div>
                                    </div>
                                    <div className="bg-zinc-800/50 p-2 rounded text-center">
                                        <div className="text-lg font-bold text-green-500">{car.drivetrain}</div>
                                        <div className="text-zinc-600 text-xs">trans.</div>
                                    </div>
                                </div>

                                {/* Power/Weight */}
                                <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                                    <span className="text-zinc-500 text-xs flex items-center gap-1">
                                        <Zap size={12} /> Ratio
                                    </span>
                                    <span className="text-yellow-500 font-bold">
                                        {getPowerToWeight(car).toFixed(2)} kg/ch
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => startEdit(car)}
                                        className="flex-1 text-xs py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded"
                                    >
                                        MODIFIER
                                    </button>
                                    <button
                                        onClick={() => deleteCar(car.id)}
                                        className="px-3 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors rounded"
                                    >
                                        <Trash2 size={14} />
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
