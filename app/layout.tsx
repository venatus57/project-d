import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROJECT D",
  description: "Driver Configuration System - Garage & Touge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono antialiased bg-zinc-950`}>
        <Navbar />
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}

