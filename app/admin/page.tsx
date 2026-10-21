import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Logo } from "@/components/site/Logo";
import { pricingRepository } from "@/lib/pricing/repository.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration — Tarificateur AssurBâtisseurs",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const config = await pricingRepository.load();
  return (
    <>
      <header className="on-dark border-b border-gold-500/70 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo className="w-24" />
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-gold-400">
            Voir le simulateur →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <AdminDashboard initialConfig={config} isProtected={Boolean(process.env.ADMIN_PASSWORD)} />
      </main>
    </>
  );
}
