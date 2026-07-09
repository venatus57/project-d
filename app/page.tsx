"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Car, Mountain, User, Trophy, Play, Map as MapIcon, ChevronRight,
} from "lucide-react";
import { getProfile, PlayerProfile } from "./lib/profile";
import { loadGhosts, loadRoutes } from "./lib/storage";
import { fadeUp, stagger } from "@/components/ui";

type Section = {
  href: string;
  title: string;
  desc: string;
  icon: typeof Play;
  tone: "accent" | "ice" | "gold" | "mint" | "haze" | "flame";
};

const sections: Section[] = [
  {
    href: "/run",
    title: "Run",
    desc: "Chrono GPS en direct, alerte radar et ghost à la clé.",
    icon: Play,
    tone: "accent",
  },
  {
    href: "/touge",
    title: "Touge",
    desc: "Cols légendaires et tracés maison.",
    icon: Mountain,
    tone: "flame",
  },
  {
    href: "/ghosts",
    title: "Ghosts",
    desc: "Replays, chronos et classements.",
    icon: Trophy,
    tone: "gold",
  },
  {
    href: "/garage",
    title: "Garage",
    desc: "Loadout pilote et specs machine.",
    icon: Car,
    tone: "mint",
  },
  {
    href: "/map",
    title: "Map",
    desc: "Toutes les routes + radars fixes.",
    icon: MapIcon,
    tone: "ice",
  },
  {
    href: "/profile",
    title: "Profil",
    desc: "Stats, battles et sauvegarde.",
    icon: User,
    tone: "haze",
  },
];

const toneStyles: Record<string, { icon: string; hoverBorder: string; glow: string }> = {
  accent: { icon: "text-accent bg-accent/10 border-accent/30", hoverBorder: "hover:border-accent/50", glow: "rgba(216,79,196,0.18)" },
  flame: { icon: "text-flame bg-flame/10 border-flame/30", hoverBorder: "hover:border-flame/50", glow: "rgba(244,86,74,0.16)" },
  ice: { icon: "text-ice bg-ice/10 border-ice/30", hoverBorder: "hover:border-ice/50", glow: "rgba(111,214,234,0.15)" },
  gold: { icon: "text-gold bg-gold/10 border-gold/30", hoverBorder: "hover:border-gold/50", glow: "rgba(240,164,60,0.16)" },
  mint: { icon: "text-mint bg-mint/10 border-mint/30", hoverBorder: "hover:border-mint/50", glow: "rgba(70,201,140,0.15)" },
  haze: { icon: "text-haze bg-haze/10 border-haze/30", hoverBorder: "hover:border-haze/50", glow: "rgba(167,139,250,0.16)" },
};

const tickerItems = [
  ["Parking B2", "12 caisses posées"],
  ["C1 intérieure", "trafic fluide"],
  ["R34 violette", "aperçue sortie 7"],
  ["峠", "brouillard au sommet"],
  ["Tunnel", "néons HS depuis 2003"],
  ["Bip radio", "on se replie"],
];

export default function Home() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [ghostCount, setGhostCount] = useState(0);
  const [routeCount, setRouteCount] = useState(0);

  useEffect(() => {
    setProfile(getProfile());
    setGhostCount(loadGhosts().length);
    setRouteCount(loadRoutes().length);
  }, []);

  const tickerContent = (
    <>
      {tickerItems.map(([head, tail], i) => (
        <span key={i}>
          <b>{head}</b> — {tail} ▸
        </span>
      ))}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-8 py-8 md:py-12">
      {/* ===== HERO ===== */}
      <motion.header
        variants={stagger}
        initial="hidden"
        animate="show"
        className="text-center mb-6 md:mb-8"
      >
        <motion.div variants={fadeUp} className="kicker text-gold mb-4 flex items-center justify-center gap-3">
          <span className="inline-block w-8 h-px bg-gold/60" />
          Parking area B2 — 2:47 AM
          <span className="inline-block w-8 h-px bg-gold/60" />
        </motion.div>
        <motion.h1 variants={fadeUp} className="title-xl text-6xl md:text-9xl">
          <span className="lean headlight">Project&nbsp;D</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 text-zinc-500 tracking-[0.4em] uppercase text-xs md:text-sm">
          プロジェクトD — 首都高バトル
        </motion.p>
        <motion.p variants={fadeUp} className="mt-3 text-accent/80 font-display font-medium tracking-[0.3em] uppercase text-sm">
          Moteur coupé, phares éteints. On attend.
        </motion.p>
      </motion.header>

      {/* ===== TICKER ===== */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="ticker mb-8 md:mb-10 -mx-4 md:mx-0">
        <div className="ticker-track" aria-hidden>
          {tickerContent}
          {tickerContent}
        </div>
      </motion.div>

      {/* ===== DRIVER HUD ===== */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="glass edge-accent speedline p-5 md:p-6 mb-8 md:mb-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="col-span-2 md:col-span-1 flex items-center gap-4">
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 text-2xl">
              {profile?.avatar || "🏎️"}
            </div>
            <div>
              <div className="label">Pilote</div>
              <div className="font-display text-2xl text-white uppercase tracking-wider truncate max-w-[10rem]">
                {profile?.driverName || "Anonyme"}
              </div>
            </div>
          </div>
          <div className="text-center md:border-l border-line">
            <div className="mono-num text-2xl md:text-3xl text-mint">
              {profile ? profile.totalDistance.toFixed(1) : "0.0"}
              <span className="text-sm text-zinc-500 ml-1">km</span>
            </div>
            <div className="label mt-1">Odomètre</div>
          </div>
          <div className="text-center md:border-l border-line">
            <div className="mono-num text-2xl md:text-3xl text-gold">{ghostCount}</div>
            <div className="label mt-1">Ghosts</div>
          </div>
          <div className="text-center md:border-l border-line">
            <div className="mono-num text-2xl md:text-3xl text-ice">{routeCount}</div>
            <div className="label mt-1">Tracés</div>
          </div>
        </div>
      </motion.section>

      {/* ===== NAVIGATION GRID ===== */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {sections.map((s) => {
          const t = toneStyles[s.tone];
          const Icon = s.icon;
          return (
            <motion.div
              key={s.href}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={s.href}
                className={`group glass glass-hover ${t.hoverBorder} flex flex-col h-full p-6 relative overflow-hidden`}
              >
                <div
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
                  style={{ background: t.glow }}
                />
                <div className="flex items-center justify-between mb-5 relative">
                  <span className={`grid place-items-center w-11 h-11 rounded-xl border ${t.icon}`}>
                    <Icon size={20} />
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all"
                  />
                </div>
                <h2 className="font-display uppercase tracking-[0.15em] text-2xl text-white mb-1 relative">
                  {s.title}
                </h2>
                <p className="text-zinc-500 text-sm font-medium relative">{s.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ===== FOOTER ===== */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mt-12 md:mt-16 flex items-center justify-center gap-3 text-zinc-600"
      >
        <span className="w-2 h-2 rounded-full bg-accent pulse-dot shadow-[0_0_10px_rgba(216,79,196,0.8)]" />
        <span className="label">Shutoko network — Online</span>
      </motion.footer>
    </div>
  );
}
