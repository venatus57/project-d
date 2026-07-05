"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Car, Mountain, User, Route, Trophy, Play, Menu, X, Map as MapIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/garage", label: "Garage", icon: Car },
    { href: "/touge", label: "Touge", icon: Mountain },
    { href: "/run", label: "Run", icon: Play },
    { href: "/ghosts", label: "Ghosts", icon: Trophy },
    { href: "/conquest", label: "Conquest", icon: Route },
    { href: "/map", label: "Map", icon: MapIcon },
    { href: "/profile", label: "Profil", icon: User },
];

// Bottom tab bar (mobile) — the 5 most-used destinations
const tabItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/touge", label: "Touge", icon: Mountain },
    { href: "/run", label: "Run", icon: Play },
    { href: "/ghosts", label: "Ghosts", icon: Trophy },
    { href: "/map", label: "Map", icon: MapIcon },
];

function isActive(pathname: string, href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
    const pathname = usePathname();
    const [sheetOpen, setSheetOpen] = useState(false);

    // Close the mobile sheet on navigation
    useEffect(() => {
        setSheetOpen(false);
    }, [pathname]);

    return (
        <>
            {/* ============ TOP BAR ============ */}
            <header className="fixed top-0 inset-x-0 z-[1100] h-14 md:h-16 border-b border-line bg-bg/75 backdrop-blur-xl">
                <div className="mx-auto h-full max-w-7xl px-4 md:px-8 flex items-center justify-between">
                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="grid place-items-center w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 font-display font-bold text-accent italic group-hover:bg-accent group-hover:text-black transition-colors">
                            D
                        </span>
                        <span className="font-display font-bold uppercase tracking-[0.25em] text-sm text-white">
                            Project&nbsp;D
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(pathname, item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-display font-semibold uppercase tracking-widest transition-colors ${active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                                        }`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-lg bg-accent/12 border border-accent/35"
                                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                    <Icon size={14} className={`relative ${active ? "text-accent" : ""}`} />
                                    <span className="relative">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile menu toggle */}
                    <button
                        className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setSheetOpen((v) => !v)}
                        aria-label="Menu"
                    >
                        {sheetOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            {/* ============ MOBILE SHEET ============ */}
            <AnimatePresence>
                {sheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 z-[1090] bg-black/70 backdrop-blur-sm"
                            onClick={() => setSheetOpen(false)}
                        />
                        <motion.nav
                            initial={{ y: -24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -24, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                            className="md:hidden fixed top-14 inset-x-3 z-[1095] hud p-3"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {navItems.map((item, i) => {
                                    const active = isActive(pathname, item.href);
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.03 * i }}
                                        >
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-display font-semibold uppercase tracking-widest text-sm transition-colors ${active
                                                    ? "bg-accent/15 border border-accent/40 text-white"
                                                    : "border border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <Icon size={17} className={active ? "text-accent" : ""} />
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* ============ MOBILE BOTTOM TAB BAR ============ */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-[1100] border-t border-line bg-bg/85 backdrop-blur-xl"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
                <div className="grid grid-cols-5 h-[4.25rem]">
                    {tabItems.map((item) => {
                        const active = isActive(pathname, item.href);
                        const Icon = item.icon;
                        const isRun = item.href === "/run";
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center gap-1"
                            >
                                {isRun ? (
                                    <span
                                        className={`grid place-items-center w-12 h-12 -mt-5 rounded-2xl border transition-all ${active
                                            ? "bg-accent text-black border-accent shadow-[0_0_24px_rgba(255,59,87,0.5)]"
                                            : "bg-raised text-accent border-accent/40 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.8)]"
                                            }`}
                                    >
                                        <Icon size={20} fill="currentColor" />
                                    </span>
                                ) : (
                                    <>
                                        {active && (
                                            <motion.span
                                                layoutId="tab-dot"
                                                className="absolute top-1.5 w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_rgba(255,59,87,0.9)]"
                                            />
                                        )}
                                        <Icon size={20} className={active ? "text-white" : "text-zinc-500"} />
                                    </>
                                )}
                                <span
                                    className={`text-[10px] font-display font-semibold uppercase tracking-wider ${active ? "text-white" : "text-zinc-600"
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
