"use client";

import { ReactNode } from "react";

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "ghost" | "danger";
    className?: string;
    type?: "button" | "submit";
}

export function Button({
    children,
    onClick,
    variant = "primary",
    className = "",
    type = "button",
}: ButtonProps) {
    const baseStyles = "py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors";

    const variantStyles = {
        primary: "w-full bg-zinc-100 text-black hover:bg-yellow-500 hover:text-black",
        ghost: "bg-transparent text-zinc-400 hover:text-yellow-500",
        danger: "bg-transparent text-zinc-600 hover:text-red-500",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
