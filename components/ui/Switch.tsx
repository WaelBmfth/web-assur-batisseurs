import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Masque visuellement le libellé (il reste lu par les lecteurs d'écran). */
  hideLabel?: boolean;
  id?: string;
};

export function Switch({ checked, onChange, label, hideLabel, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 rounded-full text-sm font-medium text-ink"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-success-700" : "bg-line",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
