"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Mountain, User, ChevronLeft, Route, Trophy, Play } from "lucide-react";

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

    // Ne pas afficher sur la home
    if (pathname === "/") return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-400 hover:text-yellow-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-bold">HOME</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navItems.slice(1).map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors ${isActive
                                        ? "text-yellow-500 bg-yellow-500/10"
                                        : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
