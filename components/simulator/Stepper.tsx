import type { SimulatorStep } from "@/lib/simulator/steps";
import { cn } from "@/lib/cn";

type StepperProps = {
  steps: SimulatorStep[];
  currentIndex: number;
  /** Les étapes déjà franchies sont cliquables pour revenir en arrière. */
  onSelect: (index: number) => void;
};

export function Stepper({ steps, currentIndex, onSelect }: StepperProps) {
  const current = steps[currentIndex];
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <nav aria-label="Étapes de la simulation">
      {/* Mobile : libellé + barre de progression */}
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-brand-700">
          Étape {currentIndex + 1} sur {steps.length}
          <span className="text-ink-muted"> · {current?.label}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100" aria-hidden="true">
          <div className="h-full rounded-full bg-brand-700 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tablette / desktop : frise numérotée */}
      <ol className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center text-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                    index <= currentIndex ? "bg-brand-700" : "bg-line",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className="group relative z-10 flex flex-col items-center gap-2 rounded-lg px-1 disabled:cursor-default"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    done && "border-brand-700 bg-brand-700 text-white group-hover:bg-brand-800",
                    active && "border-brand-700 bg-surface text-brand-700 ring-4 ring-brand-100",
                    !done && !active && "border-line bg-surface text-ink-subtle",
                  )}
                >
                  {done ? (
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "max-w-[9rem] text-xs font-semibold leading-tight",
                    active ? "text-brand-800" : done ? "text-ink" : "text-ink-subtle",
                  )}
                >
                  {step.label}
                  {done && <span className="sr-only"> (terminée, revenir à cette étape)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
