"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Mountain, User, ChevronLeft, Route, Trophy, Play, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { href: "/", label: "HOME", icon: Home },
    { href: "/profile", label: "PROFILE", icon: User },
    { href: "/garage", label: "GARAGE", icon: Car },
    { href: "/touge", label: "TOUGE", icon: Mountain },
    { href: "/run", label: "RUN", icon: Play },
    { href: "/ghosts", label: "GHOSTS", icon: Trophy },
    { href: "/conquest", label: "CONQUEST", icon: Route },
];

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Ne pas afficher sur la home
    if (pathname === "/") return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b-2 border-zinc-900 shadow-[0_4px_30px_rgba(255,0,255,0.05)]">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-500 hover:text-toxic-cyan transition-colors glitch-hover"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold">HOME</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.slice(1).map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition-all ${isActive
                                        ? "text-toxic-magenta bg-toxic-magenta/10 border-b-2 border-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                                        : "text-zinc-500 hover:text-zinc-300 glitch-hover"
                                        }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-zinc-500 hover:text-toxic-cyan transition-colors p-2"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-b-2 border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                    >
                        <div className="flex flex-col p-4 space-y-2">
                            {navItems.slice(1).map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-2 hard-border ${isActive
                                            ? "text-toxic-magenta bg-toxic-magenta/10 border-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                                            : "text-zinc-500 border-zinc-900 hover:text-white hover:border-zinc-700"
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
