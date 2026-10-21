"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, ArrowBadge } from "@/components/ui/Icon";
import { contact, headerCta, insuranceLinks, mainNav } from "@/config/site-content";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

const insuranceGroups = Object.values(insuranceLinks);

function InsuranceMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-assurances"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded px-1 py-2 text-sm font-semibold text-white hover:text-gold-400"
      >
        Nos assurances
        <Icon name="chevronDown" className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          id="menu-assurances"
          className="absolute top-full left-1/2 z-30 mt-3 grid w-[34rem] -translate-x-1/2 grid-cols-2 gap-6 rounded-xl border border-white/10 bg-ink p-6 shadow-[var(--shadow-raised)]"
        >
          {insuranceGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-gold-400 uppercase">{group.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/85 hover:text-gold-400">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="on-dark relative z-20 border-b border-gold-500/70 bg-ink text-white">
      <div className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo className="w-28 sm:w-[8.5rem]" />

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
          <InsuranceMenu />
          {mainNav.map((link) => (
            <a key={link.label} href={link.href} className="rounded px-1 py-2 text-sm font-semibold hover:text-gold-400">
              {link.label}
            </a>
          ))}
          <a href={contact.phoneHref} className="flex items-center gap-2 rounded px-1 py-2 text-sm font-semibold hover:text-gold-400">
            <Icon name="phone" className="size-3.5 text-gold-500" />
            {contact.phone}
          </a>
          <a
            href={headerCta.href}
            className="flex items-center gap-2 rounded-full bg-gold-500 py-1.5 pr-1.5 pl-5 text-[0.85rem] font-semibold text-ink hover:bg-gold-400"
          >
            {headerCta.label}
            <ArrowBadge />
          </a>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <a href={contact.phoneHref} className="flex size-10 items-center justify-center rounded-full text-gold-500 hover:bg-white/10" aria-label={`Appeler le ${contact.phone}`}>
            <Icon name="phone" className="size-5" />
          </a>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"
          >
            <Icon name={mobileOpen ? "close" : "menu"} className="size-6" />
            <span className="sr-only">{mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="border-t border-white/10 px-4 pt-4 pb-6 lg:hidden">
          {insuranceGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-gold-400 uppercase">{group.title}</p>
              <ul className="mt-2 flex flex-col">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="block py-1.5 text-sm text-white/85">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <ul className="flex flex-col border-t border-white/10 pt-3">
            {mainNav.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="block py-2 text-sm font-semibold">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={headerCta.href}
            onClick={() => setMobileOpen(false)}
            className="mt-4 flex items-center justify-between gap-2 rounded-full bg-gold-500 py-1.5 pr-1.5 pl-5 text-sm font-semibold text-ink"
          >
            {headerCta.label}
            <ArrowBadge />
          </a>
        </nav>
      )}
    </header>
  );
}
