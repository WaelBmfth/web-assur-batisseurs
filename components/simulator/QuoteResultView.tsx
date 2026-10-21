import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ArrowBadge } from "@/components/ui/Icon";
import { simulatorContent } from "@/config/calculator-config";
import { formatEuro } from "@/lib/format";
import type { QuoteResult } from "@/types/simulator";
import { PriceBreakdown } from "./PriceBreakdown";
import { PriceSummary } from "./PriceSummary";

type Props = {
  companyName: string;
  quote: QuoteResult | null;
  contactHref: string;
  onEdit: () => void;
  onEditRevenue: () => void;
  onRestart: () => void;
};

export function QuoteResultView({ companyName, quote, contactHref, onEdit, onEditRevenue, onRestart }: Props) {
  if (!quote) return null;

  if (!quote.ok) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-accent-400/50 bg-warning-100 p-6 text-warning-800">
          <p className="text-lg font-bold">Votre profil nécessite une étude personnalisée</p>
          <p className="mt-2 text-sm">{quote.message}</p>
          {quote.maxCoveredRevenue !== undefined && (
            <p className="mt-1 text-sm">
              L&apos;estimation en ligne est disponible jusqu&apos;à{" "}
              {formatEuro(quote.maxCoveredRevenue, { decimals: false })} de chiffre d&apos;affaires pour cette activité.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={contactHref} size="lg" className="pr-2">
            {simulatorContent.contactLabel}
            <ArrowBadge />
          </ButtonLink>
          <Button variant="secondary" size="lg" onClick={onEditRevenue}>
            Modifier mon chiffre d&apos;affaires
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-ink-muted">
        <span>
          Estimation pour <strong className="text-ink">{companyName}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <Badge tone="gold">{quote.activity.name}</Badge>
        <Badge tone="neutral">CA {formatEuro(quote.revenue, { decimals: false })} HT</Badge>
        <Badge tone={quote.legalProtection.included ? "success" : "neutral"}>
          PJ : {quote.legalProtection.included ? "Oui" : "Non"}
        </Badge>
      </div>

      <PriceSummary quote={quote} />
      <PriceBreakdown quote={quote} />

      <p className="text-center text-xs leading-relaxed text-ink-muted">{simulatorContent.disclaimer}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <ButtonLink href={contactHref} size="lg" className="pr-2">
          {simulatorContent.contactLabel}
          <ArrowBadge />
        </ButtonLink>
        <Button variant="secondary" size="lg" onClick={onEdit}>
          Modifier ma simulation
        </Button>
        <Button variant="ghost" size="lg" onClick={onRestart}>
          Nouvelle simulation
        </Button>
      </div>
    </div>
  );
}
