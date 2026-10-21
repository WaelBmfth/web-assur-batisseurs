import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulateur de devis — Assurance BTP & Conception | AssurBâtisseurs",
  description:
    "Estimez en quelques clics votre budget d'assurance BTP & conception : prime, Protection Juridique, frais de courtage et mensualité indicative.",
};

export const viewport: Viewport = {
  themeColor: "#1f4e79",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
