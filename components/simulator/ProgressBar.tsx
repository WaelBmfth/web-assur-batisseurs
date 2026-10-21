/** Barre de progression pleine largeur avec pastille de pourcentage (maquette). */
export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.round(percent);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="relative z-30 h-1 w-full bg-gold-100"
    >
      <div className="h-full bg-gold-500 transition-[width] duration-500" style={{ width: `${value}%` }} />
      <span
        aria-hidden="true"
        className="absolute top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[0.65rem] font-bold text-ink transition-[left] duration-500"
        style={{ left: `clamp(0.5rem, calc(${value}% - 1.25rem), calc(100% - 3rem))` }}
      >
        {value}&nbsp;%
      </span>
    </div>
  );
}
