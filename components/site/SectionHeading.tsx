import { cn } from "@/lib/cn";

type Props = {
  eyebrow: string;
  title: string;
  /** Partie du titre mise en valeur en doré. */
  highlight: string;
  as?: "h1" | "h2";
  /** Place la partie dorée sur sa propre ligne (à partir de la tablette). */
  breakBeforeHighlight?: boolean;
  id?: string;
  className?: string;
};

/** Sur-titre doré + titre bicolore, repris de la maquette. */
export function SectionHeading({ eyebrow, title, highlight, as: Tag = "h2", breakBeforeHighlight = true, id, className }: Props) {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">{eyebrow}</p>
      <Tag
        id={id}
        tabIndex={Tag === "h1" ? -1 : undefined}
        className={cn(
          "mt-3 font-bold tracking-tight text-balance text-ink focus:outline-none",
          Tag === "h1" ? "text-[2rem] leading-[1.12] sm:text-[2.9rem]" : "text-[1.85rem] leading-tight sm:text-[2.6rem]",
        )}
      >
        {title} {breakBeforeHighlight && <br className="hidden sm:block" />}
        <span className="text-gold-700">{highlight}</span>
      </Tag>
    </div>
  );
}

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-gradient-to-r from-transparent via-gold-500 to-transparent", className)}
    />
  );
}
