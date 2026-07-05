import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Rajdhani } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const display = Chakra_Petch({
  weight: ["500", "600", "700"],
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Rajdhani({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROJECT D",
  description: "Night driving telemetry — garage, touge & ghost runs",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Project D",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#07070c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-body antialiased`} suppressHydrationWarning>
        <div className="bg-fx" aria-hidden />
        <Navbar />
        <main className="app-main">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
