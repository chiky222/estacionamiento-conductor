import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";
import type { NombreIcono } from "@/lib/iconos";

interface Props<T extends string> {
  options: { value: T; label: string; icon?: NombreIcono }[];
  value: T;
  onChange: (v: T) => void;
  /** "tabs" = pestañas principales; "segment" = selector chico. */
  variant?: "tabs" | "segment";
  ariaLabel: string;
}

/** Control segmentado: pista hundida y la opción elegida en petróleo. */
export function CommonSegmented<T extends string>({ options, value, onChange, variant = "segment", ariaLabel }: Props<T>) {
  const tabs = variant === "tabs";
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1 rounded-[16px] bg-surface-sunken p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[10px] border-0 font-semibold",
              tabs ? "h-9 px-4 text-sm" : "h-8 px-3 text-[13px]",
              on ? "bg-brand text-on-brand shadow-e1" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.icon && <CommonIcon name={o.icon} size={16} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
