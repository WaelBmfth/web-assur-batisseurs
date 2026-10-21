import type { Metadata, Viewport } from "next";
import { Archivo, Jost } from "next/font/google";
import "./globals.css";

const heading = Archivo({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-heading", display: "swap" });
const body = Jost({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Devis assurance RC Décennale en 2 minutes | AssurBâtisseurs",
  description:
    "Estimez en quelques clics votre budget d'assurance BTP & conception : prime, Protection Juridique, frais de courtage et mensualité indicative.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
