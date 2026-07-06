"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LatLng } from "@/app/lib/types";

const MAX_SAMPLES = 80;

function downsample(points: LatLng[], max: number): LatLng[] {
    if (points.length <= max) return points;
    const step = (points.length - 1) / (max - 1);
    return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

export default function ElevationProfile({ points }: { points: LatLng[] }) {
    const sampled = useMemo(() => downsample(points, MAX_SAMPLES), [points]);
    const [elev, setElev] = useState<number[] | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (sampled.length < 2) {
            setFailed(true);
            return;
        }
        let cancelled = false;
        const lats = sampled.map((p) => p[0].toFixed(5)).join(",");
        const lngs = sampled.map((p) => p[1].toFixed(5)).join(",");

        fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
                if (cancelled) return;
                if (Array.isArray(data.elevation) && data.elevation.length >= 2) {
                    setElev(data.elevation as number[]);
                } else {
                    setFailed(true);
                }
            })
            .catch(() => !cancelled && setFailed(true));

        return () => {
            cancelled = true;
        };
    }, [sampled]);

    if (failed) return null;

    if (!elev) {
        return (
            <div className="h-20 grid place-items-center">
                <span className="label animate-pulse">Profil altimétrique…</span>
            </div>
        );
    }

    const min = Math.min(...elev);
    const max = Math.max(...elev);
    const span = max - min || 1;

    let dPlus = 0;
    let dMinus = 0;
    for (let i = 1; i < elev.length; i++) {
        const d = elev[i] - elev[i - 1];
        if (d > 0) dPlus += d;
        else dMinus -= d;
    }

    const W = 260;
    const H = 64;
    const PAD = 4;
    const pts = elev.map((e, i) => {
        const x = PAD + (i / (elev.length - 1)) * (W - 2 * PAD);
        const y = H - PAD - ((e - min) / span) * (H - 2 * PAD);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const area = `M${PAD},${H - PAD} L${pts.join(" L")} L${W - PAD},${H - PAD} Z`;
    const line = `M${pts.join(" L")}`;

    return (
        <div>
            <div className="label mb-2">Profil altimétrique</div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 64 }}>
                <path d={area} fill="var(--color-accent)" fillOpacity="0.12" />
                <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div className="flex items-center justify-between mt-2 text-[11px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1 text-mint">
                    <TrendingUp size={11} /> {Math.round(dPlus)} m
                </span>
                <span className="flex items-center gap-1 text-flame">
                    <TrendingDown size={11} /> {Math.round(dMinus)} m
                </span>
                <span className="text-zinc-500 mono-num">
                    {Math.round(min)}–{Math.round(max)} m
                </span>
            </div>
        </div>
    );
}
