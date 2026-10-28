"use client";

import type { Cotizacion, ModalidadPago as Modalidad } from "@/lib/conductor.types";
import { ars } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

/** Montos de cada modalidad: lo que paga ahora y lo que queda para la salida. */
export const montosDe = (cot: Cotizacion, m: Modalidad) => {
  const ahora = m === "total" ? cot.total : cot.sena;
  return { ahora, alSalir: cot.total - ahora };
};

interface Props {
  cot: Cotizacion;
  value: Modalidad;
  onChange: (m: Modalidad) => void;
}

/** Elegir entre reservar con la seña (el resto al salir) o pagar todo por adelantado. */
export function ModalidadPago({ cot, value, onChange }: Props) {
  const conSena = cot.senaPct > 0;
  const opciones: { value: Modalidad; titulo: string; detalle: string; icono: "ticket" | "check" }[] = [
    {
      value: "sena",
      titulo: conSena ? `Reservar con seña (${cot.senaPct} %)` : "Reservar sin seña",
      detalle: `Pagás ${ars(cot.sena)} ahora y ${ars(cot.saldo)} cuando te vas.`,
      icono: "ticket",
    },
    { value: "total", titulo: "Pagar todo ahora", detalle: "Salís sin pasar por caja. Solo pagás aparte si te quedás más tiempo.", icono: "check" },
  ];
  return (
    <div role="radiogroup" aria-label="Cómo pagás" className="grid gap-3 sm:grid-cols-2">
      {opciones.map((o) => {
        const on = value === o.value;
        const { ahora } = montosDe(cot, o.value);
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col gap-2 rounded-[16px] border-[1.5px] bg-surface-raised p-4 text-left transition-shadow",
              on ? "border-brand shadow-[0_0_0_3px_var(--brand-soft)]" : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("grid size-5 flex-none place-items-center rounded-full border-2", on ? "border-brand bg-brand text-on-brand" : "border-line-strong")}>
                {on && <CommonIcon name="check" size={12} strokeWidth={3} />}
              </span>
              <span className="text-[15px] font-semibold">{o.titulo}</span>
            </span>
            <span className="font-display text-2xl font-bold text-coral-text tabular">
              {ars(ahora)} <span className="font-sans text-sm font-semibold text-ink-muted">ahora</span>
            </span>
            <span className="text-[13px] text-ink-muted">{o.detalle}</span>
          </button>
        );
      })}
    </div>
  );
}
