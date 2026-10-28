"use client";

import dynamic from "next/dynamic";
import type { EstacionamientoResumen, Ubicacion } from "@/lib/conductor.types";
import { config } from "@/lib/config";
import { CommonSpinner } from "@/components/common/CommonSpinner";

export interface PropsMapa {
  estacionamientos: EstacionamientoResumen[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string | null) => void;
  /** Dónde está (o busca) el conductor. */
  centro: Ubicacion;
}

const Cargando = () => (
  <div className="grid h-full w-full place-items-center bg-surface-sunken text-ink-muted">
    <CommonSpinner className="size-5 text-brand" />
  </div>
);

// Cada mapa se carga aparte: sin API key, el SDK de Google ni se descarga.
const MapaGoogle = dynamic(() => import("@/components/mapa/MapaGoogle").then((m) => m.MapaGoogle), { ssr: false, loading: Cargando });
const MapaDemo = dynamic(() => import("@/components/mapa/MapaDemo").then((m) => m.MapaDemo), { ssr: false, loading: Cargando });

/** Mapa de Google si hay API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY); si no, el mapa de muestra. */
export function MapaEstacionamientos(props: PropsMapa) {
  return config.googleMapsKey ? <MapaGoogle {...props} /> : <MapaDemo {...props} />;
}
