import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROJECT D",
  description: "Driver Configuration System - Garage & Touge",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Project D",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${vt323.variable} font-pixel antialiased bg-black text-[#f0f0f0]`}>
        <Navbar />
        <div className="pt-14 h-full">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </body>
    </html>
  );
}

