"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";

/* ============================================================
   Motion presets
   ============================================================ */

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

/* ============================================================
   Layout
   ============================================================ */

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-10 ${className}`}>
            {children}
        </div>
    );
}

export function PageHeader({
    kicker,
    title,
    sub,
    actions,
}: {
    kicker: string;
    title: string;
    sub?: string;
    actions?: ReactNode;
}) {
    return (
        <motion.header
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
            <div>
                <div className="kicker text-accent mb-2 flex items-center gap-3">
                    <span className="inline-block w-6 h-px bg-accent" />
                    {kicker}
                </div>
                <h1 className="title-xl text-3xl md:text-5xl text-white">{title}</h1>
                {sub && <p className="text-zinc-500 font-medium mt-2 max-w-xl">{sub}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </motion.header>
    );
}

/* ============================================================
   Buttons
   ============================================================ */

type BtnVariant = "primary" | "outline" | "ghost" | "danger";

const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display font-semibold uppercase tracking-widest text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

const btnVariants: Record<BtnVariant, string> = {
    primary:
        "bg-accent text-black border border-accent hover:bg-white hover:border-white shadow-[0_8px_30px_-8px_rgba(200,245,66,0.55)]",
    outline:
        "bg-transparent text-zinc-300 border border-line hover:border-accent/60 hover:text-white",
    ghost: "bg-white/5 text-zinc-300 border border-transparent hover:bg-white/10 hover:text-white",
    danger:
        "bg-transparent text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-black hover:border-red-500",
};

export function Btn({
    children,
    onClick,
    variant = "primary",
    className = "",
    disabled,
    type = "button",
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: BtnVariant;
    className?: string;
    disabled?: boolean;
    type?: "button" | "submit";
}) {
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${btnBase} ${btnVariants[variant]} ${className}`}>
            {children}
        </button>
    );
}

export function BtnLink({
    children,
    href,
    variant = "primary",
    className = "",
}: {
    children: ReactNode;
    href: string;
    variant?: BtnVariant;
    className?: string;
}) {
    return (
        <Link href={href} className={`${btnBase} ${btnVariants[variant]} ${className}`}>
            {children}
        </Link>
    );
}

/* ============================================================
   Data display
   ============================================================ */

export function Stat({
    label,
    value,
    unit,
    tone = "text-white",
}: {
    label: string;
    value: ReactNode;
    unit?: string;
    tone?: string;
}) {
    return (
        <div className="glass p-4 text-center">
            <div className={`mono-num text-2xl md:text-3xl font-bold ${tone}`}>
                {value}
                {unit && <span className="text-sm text-zinc-500 font-semibold ml-1">{unit}</span>}
            </div>
            <div className="label mt-1">{label}</div>
        </div>
    );
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";

export const DIFFICULTY_STYLE: Record<Difficulty, { badge: string; dot: string; hex: string }> = {
    EASY: { badge: "text-mint border-mint/40 bg-mint/10", dot: "bg-mint", hex: "#3ddc84" },
    MEDIUM: { badge: "text-ice border-ice/40 bg-ice/10", dot: "bg-ice", hex: "#38e1ff" },
    HARD: { badge: "text-flame border-flame/40 bg-flame/10", dot: "bg-flame", hex: "#ff7a2f" },
    LEGENDARY: { badge: "text-gold border-gold/40 bg-gold/10", dot: "bg-gold", hex: "#ffc233" },
};

export function DifficultyBadge({ level }: { level: Difficulty }) {
    const s = DIFFICULTY_STYLE[level];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-display font-bold uppercase tracking-widest ${s.badge}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${level === "LEGENDARY" ? "pulse-dot" : ""}`} />
            {level}
        </span>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    text,
    action,
}: {
    icon: LucideIcon;
    title: string;
    text: string;
    action?: ReactNode;
}) {
    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="glass edge-accent text-center py-16 px-6"
        >
            <div className="mx-auto mb-5 grid place-items-center w-16 h-16 rounded-2xl bg-white/5 border border-line">
                <Icon size={28} className="text-zinc-600" />
            </div>
            <h2 className="font-display font-bold uppercase tracking-widest text-lg text-zinc-200 mb-2">{title}</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">{text}</p>
            {action}
        </motion.div>
    );
}
