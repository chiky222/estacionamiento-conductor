"use client";

import { useMemo } from "react";
import { useReserva } from "@/contexts/ReservaContext";
import { DURACIONES, horaDe, opcionesLlegada } from "@/lib/conductor";
import { NativeSelect } from "@/components/ui/native-select";
import { CommonChip } from "@/components/common/CommonChip";
import { CommonIcon } from "@/components/common/CommonIcon";
import { cn } from "@/lib/utils";

/** Llegada (ahora o más tarde) y cuántas horas se queda. `compacto` = una sola línea para la barra del mapa. */
export function SelectorHorario({ maxHoras = 12, compacto }: { maxHoras?: number; compacto?: boolean }) {
  const { llegada, setLlegada, horas, setHoras, hasta } = useReserva();
  const opciones = useMemo(() => opcionesLlegada(), []);
  const duraciones = DURACIONES.filter((h) => h <= maxHoras);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", !compacto && "flex-col items-stretch")}>
      <label className="flex items-center gap-2">
        <CommonIcon name="reloj" size={18} className="text-ink-muted" />
        <span className="text-[13px] font-semibold whitespace-nowrap">Llego</span>
        <NativeSelect aria-label="Hora de llegada" value={llegada ?? opciones[0].value} onChange={(e) => setLlegada(e.target.value === opciones[0].value ? null : e.target.value)} className="h-9 w-auto min-w-[112px]">
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </label>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Cuánto tiempo">
        <span className="mr-1 text-[13px] font-semibold whitespace-nowrap">Me quedo</span>
        {duraciones.map((h) => (
          <CommonChip key={h} on={h === horas} onClick={() => setHoras(h)} ariaLabel={`${h} horas`}>
            {h} h
          </CommonChip>
        ))}
        {!compacto && <span className="ml-1 text-[13px] text-ink-muted">hasta las {horaDe(hasta)}</span>}
      </div>
    </div>
  );
}
