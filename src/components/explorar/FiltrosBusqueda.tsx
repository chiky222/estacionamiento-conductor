"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CommonIcon } from "@/components/common/CommonIcon";
import { SelectorVehiculo } from "@/components/reserva/SelectorVehiculo";
import { SelectorHorario } from "@/components/reserva/SelectorHorario";

interface Props {
  texto: string;
  onTexto: (v: string) => void;
  soloConLugar: boolean;
  onSoloConLugar: (v: boolean) => void;
}

/** Buscador por zona y filtros: vehículo, horario y "solo con lugar". */
export function FiltrosBusqueda({ texto, onTexto, soloConLugar, onSoloConLugar }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Buscar por nombre, calle o barrio</span>
        <CommonIcon name="buscar" size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
        <Input value={texto} onChange={(e) => onTexto(e.target.value)} placeholder="¿Adónde vas? Calle, barrio o estacionamiento" className="h-11 rounded-[16px] pl-10" />
      </label>
      <SelectorVehiculo />
      <SelectorHorario compacto />
      <label className="flex items-center justify-between gap-3 text-sm font-semibold">
        Mostrar solo los que tienen lugar
        <Switch checked={soloConLugar} onCheckedChange={onSoloConLugar} />
      </label>
    </div>
  );
}
