import Link from "next/link";
import { Car, Mountain, User, Route } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col items-center justify-center p-8">

      {/* LOGO / TITLE */}
      <header className="text-center mb-16">
        <h1 className="text-6xl md:text-8xl font-bold italic tracking-tighter text-yellow-500 mb-2">
          PROJECT D
        </h1>
        <p className="text-zinc-500 text-lg tracking-widest uppercase">
          Driver Configuration System
        </p>
        <div className="w-24 h-1 bg-yellow-500 mx-auto mt-6" />
      </header>

      {/* NAVIGATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* PROFILE LINK */}
        <Link
          href="/profile"
          className="group bg-zinc-900/50 border border-zinc-800 p-8 hover:border-yellow-500 transition-all duration-300"
        >
          <div className="flex items-center gap-4 mb-4">
            <User size={32} className="text-zinc-400 group-hover:text-yellow-500 transition-colors" />
            <h2 className="text-2xl font-bold">PROFILE</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Driver stats, battle records & badges.
          </p>
          <div className="mt-6 text-xs text-zinc-600 group-hover:text-yellow-500 transition-colors">
            ENTER →
          </div>
        </Link>

        {/* GARAGE LINK */}
        <Link
          href="/garage"
          className="group bg-zinc-900/50 border border-zinc-800 p-8 hover:border-yellow-500 transition-all duration-300"
        >
          <div className="flex items-center gap-4 mb-4">
            <Car size={32} className="text-zinc-400 group-hover:text-yellow-500 transition-colors" />
            <h2 className="text-2xl font-bold">GARAGE</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Configure your loadout and machine specs.
          </p>
          <div className="mt-6 text-xs text-zinc-600 group-hover:text-yellow-500 transition-colors">
            ENTER →
          </div>
        </Link>

        {/* TOUGE LINK */}
        <Link
          href="/touge"
          className="group bg-zinc-900/50 border border-zinc-800 p-8 hover:border-yellow-500 transition-all duration-300"
        >
          <div className="flex items-center gap-4 mb-4">
            <Mountain size={32} className="text-zinc-400 group-hover:text-yellow-500 transition-colors" />
            <h2 className="text-2xl font-bold">TOUGE</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Legendary mountain pass circuits.
          </p>
          <div className="mt-6 text-xs text-zinc-600 group-hover:text-yellow-500 transition-colors">
            ENTER →
          </div>
        </Link>

        {/* CONQUEST LINK */}
        <Link
          href="/conquest"
          className="group bg-zinc-900/50 border border-zinc-800 p-8 hover:border-yellow-500 transition-all duration-300"
        >
          <div className="flex items-center gap-4 mb-4">
            <Route size={32} className="text-zinc-400 group-hover:text-yellow-500 transition-colors" />
            <h2 className="text-2xl font-bold">CONQUEST</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Create & manage custom routes.
          </p>
          <div className="mt-6 text-xs text-zinc-600 group-hover:text-yellow-500 transition-colors">
            ENTER →
          </div>
        </Link>

      </div>

      {/* FOOTER */}
      <footer className="mt-16 text-zinc-700 text-xs">
        <span className="tracking-wider">SYSTEM v1.0 // READY</span>
      </footer>
    </div>
  );
}


