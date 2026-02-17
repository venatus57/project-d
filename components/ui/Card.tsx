"use client";

import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = "" }: CardProps) {
    return (
        <div className={`bg-zinc-900/50 p-4 border border-zinc-800 rounded ${className}`}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
    return (
        <div className={`flex items-center gap-2 mb-4 ${className}`}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
    return (
        <h2 className={`text-2xl font-bold text-zinc-100 ${className}`}>
            {children}
        </h2>
    );
}
