/** Contenu à fournir par la cliente, signalé comme sur la maquette (« [À compléter : …] »). */
export function ToComplete({ label }: { label: string }) {
  return (
    <span className="inline-block rounded border border-accent-400/60 bg-accent-100 px-1.5 py-0.5 text-xs text-warning-800">
      [À compléter : {label}]
    </span>
  );
}
