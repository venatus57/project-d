"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Car, Mountain, User, Route, Trophy } from "lucide-react";
import { getProfile, PlayerProfile, getXpForNextLevel, getXpForCurrentLevel } from "./lib/profile";

export default function Home() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  // XP Progress Calculation
  const currentLevelXp = profile ? getXpForCurrentLevel(profile.level) : 0;
  const nextLevelXp = profile ? getXpForNextLevel(profile.level) : 100;
  const xpInCurrentLevel = profile ? profile.xp - currentLevelXp : 0;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col items-center justify-center p-8">

      {/* LOGO / TITLE */}
      <header className="text-center mb-10 mt-8">
        <h1 className="text-6xl md:text-8xl font-bold italic tracking-tighter text-toxic-magenta mb-2 glitch-hover" style={{ textShadow: "4px 0 var(--color-toxic-cyan), -4px 0 var(--color-toxic-yellow)" }}>
          PROJECT D
        </h1>
        <p className="text-zinc-500 text-lg tracking-widest uppercase font-bold">
          BATTLE STAGE V3 // NIGHT RUNNERS
        </p>
        <div className="w-full max-w-md h-1 bg-toxic-green mx-auto mt-6 shadow-[0_0_15px_rgba(0,255,65,0.5)] leading-none" />
      </header>

      {/* GLOBAL HUD (PROGRESSION) */}
      <div className="w-full max-w-3xl mb-12 bg-black border-2 border-toxic-cyan p-6 shadow-[0_0_20px_rgba(0,255,255,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={100} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Driver Info */}
          <div className="border-[1px] border-zinc-800 p-3 bg-zinc-950">
            <div className="text-toxic-cyan text-xs mb-1 font-bold tracking-widest">CURRENT DRIVER</div>
            <div className="text-3xl font-bold text-white uppercase glitch-hover">{profile?.driverName || "ANONYME"}</div>
          </div>

          {/* Level & XP Bar */}
          <div className="flex-1 max-w-md border-[1px] border-zinc-800 p-3 bg-zinc-950">
            <div className="flex justify-between items-end mb-2">
              <div className="text-toxic-magenta font-bold italic text-xl">
                LVL <span className="text-4xl shadow-toxic-magenta">{profile?.level || 1}</span>
              </div>
              <div className="text-zinc-500 text-sm font-bold">
                EXP: <span className="text-white">{profile?.xp || 0}</span> / {nextLevelXp}
              </div>
            </div>
            {/* Progress Bar Container */}
            <div className="h-4 w-full bg-black border border-zinc-700 overflow-hidden">
              <div
                className="h-full bg-toxic-magenta shadow-[0_0_10px_rgba(255,0,255,0.8)] transition-all duration-1000 ease-out flex items-center justify-end px-1"
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent > 10 && <span className="text-[10px] text-white font-bold leading-none">{Math.round(progressPercent)}%</span>}
              </div>
            </div>
          </div>

          {/* Currencies & Stats */}
          <div className="flex flex-row md:flex-col gap-4 text-right">
            <div className="border-[1px] border-zinc-800 p-2 bg-zinc-950 min-w-[120px]">
              <div className="text-zinc-500 text-xs font-bold">CREDITS</div>
              <div className="text-toxic-green font-bold text-2xl">{profile?.credits.toLocaleString() || 0} <span className="text-sm">CR</span></div>
            </div>
            <div className="border-[1px] border-zinc-800 p-2 bg-zinc-950 min-w-[120px]">
              <div className="text-zinc-500 text-xs font-bold">ODOMETER</div>
              <div className="text-white font-bold text-xl">{profile?.totalDistance.toFixed(1) || "0.0"} <span className="text-sm text-zinc-500">km</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* PROFILE LINK */}
        <Link
          href="/profile"
          className="group bg-black border-2 border-zinc-800 p-8 hover:border-toxic-magenta transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-toxic-magenta/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <User size={32} className="text-zinc-600 group-hover:text-toxic-magenta transition-colors" />
            <h2 className="text-3xl font-bold group-hover:text-white glitch-hover">PROFILE</h2>
          </div>
          <p className="relative z-10 text-zinc-500 text-sm">
            Save management, settings & driver stats.
          </p>
          <div className="relative z-10 mt-6 text-sm font-bold text-zinc-700 group-hover:text-toxic-magenta transition-colors">
            ACCESS CARD &gt;
          </div>
        </Link>

        {/* GARAGE LINK */}
        <Link
          href="/garage"
          className="group bg-black border-2 border-zinc-800 p-8 hover:border-toxic-cyan transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-toxic-cyan/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <Car size={32} className="text-zinc-600 group-hover:text-toxic-cyan transition-colors" />
            <h2 className="text-3xl font-bold group-hover:text-white glitch-hover">GARAGE</h2>
          </div>
          <p className="relative z-10 text-zinc-500 text-sm">
            Configure your loadout and view machines.
          </p>
          <div className="relative z-10 mt-6 text-sm font-bold text-zinc-700 group-hover:text-toxic-cyan transition-colors">
            ACCESS PARKING AREA &gt;
          </div>
        </Link>

        {/* TOUGE LINK */}
        <Link
          href="/touge"
          className="group bg-black border-2 border-zinc-800 p-8 hover:border-toxic-green transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-toxic-green/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <Mountain size={32} className="text-zinc-600 group-hover:text-toxic-green transition-colors" />
            <h2 className="text-3xl font-bold group-hover:text-white glitch-hover">TOUGE</h2>
          </div>
          <p className="relative z-10 text-zinc-500 text-sm">
            Select legendary mountain pass circuits.
          </p>
          <div className="relative z-10 mt-6 text-sm font-bold text-zinc-700 group-hover:text-toxic-green transition-colors">
            ACCESS COURSE &gt;
          </div>
        </Link>

        {/* CONQUEST LINK */}
        <Link
          href="/conquest"
          className="group bg-black border-2 border-zinc-800 p-8 hover:border-toxic-yellow transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-toxic-yellow/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4 mb-4">
            <Route size={32} className="text-zinc-600 group-hover:text-toxic-yellow transition-colors" />
            <h2 className="text-3xl font-bold group-hover:text-white glitch-hover">CONQUEST</h2>
          </div>
          <p className="relative z-10 text-zinc-500 text-sm">
            Build custom circuits and rival territory.
          </p>
          <div className="relative z-10 mt-6 text-sm font-bold text-zinc-700 group-hover:text-toxic-yellow transition-colors">
            MAP EDITOR &gt;
          </div>
        </Link>

      </div>

      {/* FOOTER */}
      <footer className="mt-16 mb-8 text-zinc-600 text-sm font-bold tracking-widest flex items-center gap-4">
        <span className="animate-pulse w-2 h-2 bg-toxic-green shadow-[0_0_10px_#00ff41]" />
        SYSTEM v3.0 // CONNECTED
      </footer>
    </div>
  );
}
