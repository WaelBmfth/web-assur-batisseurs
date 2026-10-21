import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SiteHeader } from "@/components/SiteHeader";
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
      <SiteHeader>
        <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-100 hover:bg-white/10">
          Voir le simulateur →
        </Link>
      </SiteHeader>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <AdminDashboard initialConfig={config} isProtected={Boolean(process.env.ADMIN_PASSWORD)} />
      </main>
    </>
  );
}
