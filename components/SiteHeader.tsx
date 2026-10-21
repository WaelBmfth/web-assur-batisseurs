import Link from "next/link";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-white/10 bg-brand-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-xl bg-accent-500 text-brand-950">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Zm-1 13.6-3.3-3.3 1.4-1.4 1.9 1.9 4.9-4.9 1.4 1.4-6.3 6.3Z" />
            </svg>
          </span>
          <span className="text-lg">
            Assur<span className="text-accent-400">Bâtisseurs</span>
          </span>
        </Link>
        {children}
      </div>
    </header>
  );
}
