"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Car as CarIcon, Gauge, Weight, Settings, ArrowLeft, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Drivetrain, ModLevel, STORAGE_KEYS, getPowerToWeight } from "../lib/types";
import { loadJSON, saveJSON } from "../lib/storage";
import { PageShell, PageHeader, Btn, EmptyState, fadeUp, stagger } from "@/components/ui";

const DRIVETRAINS: { value: Drivetrain; label: string }[] = [
    { value: "FR", label: "FR (Propulsion)" },
    { value: "FF", label: "FF (Traction)" },
    { value: "MR", label: "MR (Moteur central)" },
    { value: "RR", label: "RR (Moteur arrière)" },
    { value: "AWD", label: "AWD (4 roues motrices)" },
];

const MOD_LEVELS: { value: ModLevel; label: string; color: string }[] = [
    { value: "STOCK", label: "Stock", color: "text-mint border-mint/40 bg-mint/10" },
    { value: "TUNED", label: "Tuned", color: "text-ice border-ice/40 bg-ice/10" },
    { value: "FULL_RACE", label: "Full Race", color: "text-accent border-accent/40 bg-accent/10" },
];

const emptyForm: Partial<Car> = {
    name: "",
    make: "",
    model: "",
    year: undefined,
    power: 100,
    weight: 1000,
    drivetrain: "FR",
    mods: "STOCK",
    color: "#d84fc4",
};

export default function CarsPage() {
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [formData, setFormData] = useState<Partial<Car>>(emptyForm);

    useEffect(() => {
        setCars(loadJSON<Car[]>(STORAGE_KEYS.CARS, []));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) saveJSON(STORAGE_KEYS.CARS, cars);
    }, [cars, isLoaded]);

    const handleSubmit = () => {
        if (!formData.name || !formData.power || !formData.weight) return;

        const car: Car = {
            id: editingCar?.id || Date.now().toString(),
            name: formData.name,
            make: formData.make || "",
            model: formData.model || "",
            year: formData.year,
            power: formData.power,
            weight: formData.weight,
            drivetrain: formData.drivetrain || "FR",
            mods: formData.mods || "STOCK",
            color: formData.color,
        };

        setCars(editingCar ? cars.map((c) => (c.id === editingCar.id ? car : c)) : [...cars, car]);
        resetForm();
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingCar(null);
        setShowForm(false);
    };

    const startEdit = (car: Car) => {
        setFormData(car);
        setEditingCar(car);
        setShowForm(true);
    };

    return (
        <PageShell>
            <Link
                href="/garage"
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-display font-semibold uppercase tracking-widest mb-6 transition-colors"
            >
                <ArrowLeft size={14} /> Garage
            </Link>

            <PageHeader
                kicker="Parking area"
                title="Mes voitures"
                sub="Gère tes machines et leurs specs."
                actions={
                    <Btn onClick={() => setShowForm(true)}>
                        <Plus size={17} /> Ajouter une voiture
                    </Btn>
                }
            />

            {/* ===== FORM MODAL ===== */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1200] flex items-center justify-center p-4"
                        onClick={resetForm}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 24 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 24 }}
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            onClick={(e) => e.stopPropagation()}
                            className="hud edge-accent p-6 w-full max-w-lg max-h-[88dvh] overflow-y-auto"
                        >
                            <h2 className="font-display font-bold uppercase tracking-widest text-xl text-white mb-6 flex items-center gap-3">
                                <span className="grid place-items-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                                    <CarIcon size={17} />
                                </span>
                                {editingCar ? "Modifier la voiture" : "Nouvelle voiture"}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="label block mb-1.5">Nom complet *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Toyota AE86 Trueno"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="field"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label block mb-1.5">Marque</label>
                                        <input
                                            type="text"
                                            placeholder="Toyota"
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                            className="field"
                                        />
                                    </div>
                                    <div>
                                        <label className="label block mb-1.5">Modèle</label>
                                        <input
                                            type="text"
                                            placeholder="AE86"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="field"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label block mb-1.5">Année</label>
                                        <input
                                            type="number"
                                            placeholder="1986"
                                            value={formData.year || ""}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                                            className="field"
                                        />
                                    </div>
                                    <div>
                                        <label className="label block mb-1.5">Couleur</label>
                                        <div className="relative h-[46px] rounded-xl border border-line overflow-hidden cursor-pointer">
                                            <input
                                                type="color"
                                                value={formData.color || "#d84fc4"}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer opacity-0"
                                            />
                                            <div className="w-full h-full pointer-events-none" style={{ backgroundColor: formData.color || "#d84fc4" }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label mb-1.5 flex items-center gap-1.5">
                                            <Gauge size={11} /> Puissance (ch) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="130"
                                            value={formData.power || ""}
                                            onChange={(e) => setFormData({ ...formData, power: parseInt(e.target.value) || 0 })}
                                            className="field"
                                        />
                                    </div>
                                    <div>
                                        <label className="label mb-1.5 flex items-center gap-1.5">
                                            <Weight size={11} /> Poids (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="940"
                                            value={formData.weight || ""}
                                            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                                            className="field"
                                        />
                                    </div>
                                </div>

                                {!!formData.power && !!formData.weight && (
                                    <div className="glass p-3 text-center">
                                        <div className="label">Ratio poids/puissance</div>
                                        <div className="mono-num text-2xl font-bold text-gold mt-1">
                                            {(formData.weight / formData.power).toFixed(2)} <span className="text-sm text-zinc-500">kg/ch</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="label block mb-2">Transmission</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {DRIVETRAINS.map((dt) => (
                                            <button
                                                key={dt.value}
                                                onClick={() => setFormData({ ...formData, drivetrain: dt.value })}
                                                title={dt.label}
                                                className={`py-2 rounded-lg text-xs font-display font-bold border transition-colors ${formData.drivetrain === dt.value
                                                    ? "bg-ice/15 border-ice/50 text-ice"
                                                    : "bg-black/30 border-line text-zinc-500 hover:text-zinc-200 hover:border-white/20"
                                                    }`}
                                            >
                                                {dt.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="label mb-2 flex items-center gap-1.5">
                                        <Settings size={11} /> Niveau de modification
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MOD_LEVELS.map((mod) => (
                                            <button
                                                key={mod.value}
                                                onClick={() => setFormData({ ...formData, mods: mod.value })}
                                                className={`py-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider border transition-colors ${formData.mods === mod.value
                                                    ? mod.color
                                                    : "bg-black/30 border-line text-zinc-500 hover:text-zinc-200 hover:border-white/20"
                                                    }`}
                                            >
                                                {mod.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-5 border-t border-line mt-5">
                                    <Btn onClick={resetForm} variant="ghost" className="flex-1">
                                        Annuler
                                    </Btn>
                                    <Btn
                                        onClick={handleSubmit}
                                        className="flex-1"
                                        disabled={!formData.name || !formData.power || !formData.weight}
                                    >
                                        {editingCar ? "Modifier" : "Ajouter"}
                                    </Btn>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== GRID ===== */}
            {cars.length === 0 ? (
                <EmptyState
                    icon={CarIcon}
                    title="Aucune voiture"
                    text="Ajoute ta première machine pour commencer les runs."
                    action={
                        <Btn onClick={() => setShowForm(true)}>
                            <Plus size={17} /> Ajouter une voiture
                        </Btn>
                    }
                />
            ) : (
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <AnimatePresence>
                        {cars.map((car) => (
                            <motion.div
                                key={car.id}
                                layout
                                variants={fadeUp}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                whileHover={{ y: -4 }}
                                className="glass glass-hover overflow-hidden"
                            >
                                {/* Color band */}
                                <div
                                    className="h-1.5"
                                    style={{
                                        background: `linear-gradient(90deg, ${car.color || "#d84fc4"}, transparent)`,
                                    }}
                                />
                                <div className="p-5">
                                    <div className="flex justify-between items-start gap-3 mb-5">
                                        <div className="min-w-0">
                                            <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide truncate">
                                                {car.name}
                                            </h3>
                                            {car.year && <p className="label mt-0.5">{car.year}</p>}
                                        </div>
                                        <span
                                            className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-display font-bold uppercase tracking-widest ${MOD_LEVELS.find((m) => m.value === car.mods)?.color
                                                }`}
                                        >
                                            {car.mods.replace("_", " ")}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                                        <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                            <div className="mono-num text-lg font-bold text-gold">{car.power}</div>
                                            <div className="label">ch</div>
                                        </div>
                                        <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                            <div className="mono-num text-lg font-bold text-ice">{car.weight}</div>
                                            <div className="label">kg</div>
                                        </div>
                                        <div className="rounded-xl bg-black/30 border border-line p-2.5 text-center">
                                            <div className="mono-num text-lg font-bold text-mint">{car.drivetrain}</div>
                                            <div className="label">trans.</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-t border-line mb-3">
                                        <span className="label flex items-center gap-1.5">
                                            <Zap size={12} className="text-accent" /> Ratio
                                        </span>
                                        <span className="mono-num font-bold text-white">
                                            {getPowerToWeight(car).toFixed(2)} <span className="text-zinc-500 text-sm">kg/ch</span>
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Btn onClick={() => startEdit(car)} variant="ghost" className="flex-1 py-2.5! text-xs!">
                                            Modifier
                                        </Btn>
                                        <Btn onClick={() => setCars(cars.filter((c) => c.id !== car.id))} variant="danger" className="px-4! py-2.5!">
                                            <Trash2 size={15} />
                                        </Btn>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </PageShell>
    );
}
