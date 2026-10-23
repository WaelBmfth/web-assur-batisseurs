import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { contact, footerColumns, legalLinks } from "@/config/site-content";
import { Logo } from "./Logo";
import { ToComplete } from "./ToComplete";

function ContactItem({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-soft text-gold-500">
        <Icon name={icon} className="size-4" />
      </span>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-white uppercase">{title}</p>
        <div className="mt-1.5 text-sm leading-relaxed text-white/80">{children}</div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink text-white">
      <div className="mx-auto max-w-[68rem] px-4 pt-14 pb-8 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[10rem_1fr] md:gap-12">
          <Logo className="w-40" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ContactItem icon="phone" title="Téléphone">
              <a href={contact.phoneHref} className="text-lg font-bold whitespace-nowrap text-white hover:text-gold-400">
                {contact.phone}
              </a>
            </ContactItem>
            <ContactItem icon="clock" title="Horaires">
              {contact.hours.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </ContactItem>
            <ContactItem icon="mapPin" title="Bureau">
              <address className="not-italic">
                {contact.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </ContactItem>
            <ContactItem icon="mail" title="E-mail">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="hover:text-gold-400">
                  {contact.email}
                </a>
              ) : (
                <ToComplete label="e-mail" />
              )}
            </ContactItem>
          </div>
        </div>

        <div className="mt-12 grid gap-10 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold tracking-[0.16em] text-gold-500 uppercase">{column.title}</p>
              <span aria-hidden="true" className="mt-2 block h-0.5 w-5 bg-gold-500" />
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/85 hover:text-gold-400">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Assurbatisseurs</span>
          {legalLinks.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-gold-400">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
