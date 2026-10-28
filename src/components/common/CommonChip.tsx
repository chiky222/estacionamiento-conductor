import { cn } from "@/lib/utils";

interface Props {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Token CSS del color cuando está encendido; por defecto la marca. */
  color?: string;
  ariaLabel?: string;
}

/** Chip que se prende y apaga (sectores de una regla, días de la semana). */
export function CommonChip({ on, onClick, children, color, ariaLabel }: Props) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={onClick}
      style={on ? { background: color ?? "var(--brand)", borderColor: color ?? "var(--brand)", color: color ? "var(--on-sector)" : "var(--on-brand)" } : undefined}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-full border-[1.5px] px-3 text-[13px] font-semibold",
        !on && "border-line bg-surface-raised text-ink-muted hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}
