"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, filter: "brightness(2) contrast(1.5)" }}
            animate={{ opacity: 1, filter: "brightness(1) contrast(1)" }}
            transition={{ duration: 0.15, ease: "linear" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
