import * as React from "react";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";
import type { NombreIcono } from "@/lib/iconos";

/** Tonos de ESTACIONARTE: brand = libre/ok, coral = ocupado/dinero, amber = reserva/abono, sky = servicio. */
export type PillTone = "neutral" | "brand" | "coral" | "amber" | "sky" | "danger";

const TONOS: Record<PillTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted",
  brand: "bg-brand-soft text-brand-strong",
  coral: "bg-coral-soft text-coral-text",
  amber: "bg-amber-soft text-amber-text",
  sky: "bg-sky-soft text-sky",
  danger: "bg-danger-soft text-danger",
};

interface Props extends React.ComponentProps<"span"> {
  tone?: PillTone;
  /** Cada estado lleva ícono y palabra: nunca sólo color. */
  icon?: NombreIcono;
  size?: "sm" | "md";
}

/** Chip de estado (StatusChip del design system). */
export function CommonPill({ tone = "neutral", icon, size = "md", className, children, ...props }: Props) {
  const chico = size === "sm";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
        chico ? "h-[22px] pr-2 pl-1.5 text-xs" : "h-7 pr-3 pl-2.5 text-[13px]",
        !icon && (chico ? "pl-2" : "pl-3"),
        TONOS[tone],
        className,
      )}
      {...props}
    >
      {icon && <CommonIcon name={icon} size={chico ? 12 : 14} strokeWidth={2.25} />}
      {children}
    </span>
  );
}

/** Etiqueta chica de regla aplicada ("Tarifa nocturna"): ámbar, como las reservas y los eventos. */
export function CommonTag({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-block rounded-[6px] bg-amber-soft px-1.5 py-px text-xs font-semibold text-amber-text", className)} {...props} />;
}
