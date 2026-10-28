"use client";

import type { MedioPago } from "@/lib/conductor.types";
import type { NombreIcono } from "@/lib/iconos";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

const ICONO: Record<MedioPago["flujo"], NombreIcono> = { redireccion: "billetera", tarjeta: "tarjeta", qr: "qr" };

interface Props {
  medios: MedioPago[];
  value?: string;
  onChange: (id: string) => void;
  /** Lo que se muestra debajo del medio elegido (ej. el formulario de la tarjeta). */
  children?: React.ReactNode;
}

/** Medios de pago que habilitó el back para este estacionamiento (cada uno, una pasarela del factory). */
export function MediosPago({ medios, value, onChange, children }: Props) {
  return (
    <div role="radiogroup" aria-label="Medio de pago" className="flex flex-col gap-2">
      {medios.map((m) => {
        const on = value === m.id;
        return (
          <div key={m.id} className={cn("rounded-[16px] border-[1.5px] bg-surface-raised", on ? "border-brand" : "border-line")}>
            <button type="button" role="radio" aria-checked={on} onClick={() => onChange(m.id)} className="flex w-full items-center gap-3 p-3 text-left">
              <span className={cn("grid size-10 flex-none place-items-center rounded-[10px]", on ? "bg-brand-soft text-brand-strong" : "bg-surface-sunken text-ink-muted")}>
                <CommonIcon name={ICONO[m.flujo]} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{m.nombre}</span>
                <span className="block text-[13px] text-ink-muted">{m.descripcion}</span>
              </span>
              <span className={cn("grid size-5 flex-none place-items-center rounded-full border-2", on ? "border-brand bg-brand text-on-brand" : "border-line-strong")}>
                {on && <CommonIcon name="check" size={12} strokeWidth={3} />}
              </span>
            </button>
            {on && children && <div className="border-t border-line p-3">{children}</div>}
          </div>
        );
      })}
    </div>
  );
}
