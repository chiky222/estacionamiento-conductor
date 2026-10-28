"use client";

import type { ClaseVehiculo } from "@/lib/types";
import type { PlanoPublico } from "@/lib/conductor.types";
import { delPiso, pisosOrdenados } from "@/lib/plano";
import { libresSector } from "@/lib/conductor";
import { CommonSegmented } from "@/components/common/CommonSegmented";

/** Pestañas de pisos con los lugares libres para el vehículo en cada uno. Con un solo piso no se muestran. */
export function PisoTabs({ plano, vehiculo, value, onChange }: { plano: PlanoPublico; vehiculo: ClaseVehiculo; value: string; onChange: (id: string) => void }) {
  const pisos = pisosOrdenados(plano.pisos);
  if (pisos.length < 2) return null;
  const opciones = pisos.map((p) => {
    const libres = delPiso(plano.sectores, p.id).reduce((n, s) => n + libresSector(plano, s, vehiculo), 0);
    return { value: p.id, label: `${p.nombre} · ${libres} libres`, icon: "pisos" as const };
  });
  return <CommonSegmented ariaLabel="Piso" options={opciones} value={value} onChange={onChange} />;
}
