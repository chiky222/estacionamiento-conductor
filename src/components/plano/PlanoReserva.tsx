"use client";

import type { ClaseVehiculo } from "@/lib/types";
import type { PlanoPublico } from "@/lib/conductor.types";
import { ESCALA, MARGEN } from "@/lib/constants";
import { delPiso, pisoDePuerta } from "@/lib/plano";
import { caminoFlujo } from "@/lib/plano-svg";
import { PlanoDefs } from "@/components/plano/PlanoDefs";
import { SectorReserva } from "@/components/plano/SectorReserva";
import { ObjetoPlano } from "@/components/plano/ObjetoPlano";
import { PuertaPlano } from "@/components/plano/PuertaPlano";

interface Props {
  plano: PlanoPublico;
  pisoId: string;
  vehiculo: ClaseVehiculo;
  seleccionId: string | null;
  /** Sin esto el plano es solo de lectura (ej. en el comprobante, para mostrar dónde queda el lugar). */
  onElegir?: (plazaId: string) => void;
}

/** Plano del estacionamiento a escala (20 px = 1 m), con la misma geometría que el tablero del gestor. */
export function PlanoReserva({ plano, pisoId, vehiculo, seleccionId, onElegir }: Props) {
  const W = plano.galpon.ancho * ESCALA;
  const H = plano.galpon.largo * ESCALA;
  const datos = { galpon: plano.galpon, pisos: plano.pisos };
  const conEntrada = pisoDePuerta(datos, "ent") === pisoId;
  const conSalida = pisoDePuerta(datos, "sal") === pisoId;
  const ancho = W + 2 * MARGEN;
  return (
    // En el celular el plano no se achica de más: se desplaza de costado para que cada lugar se pueda tocar.
    <div className="overflow-x-auto overscroll-x-contain rounded-[16px] border border-line bg-surface-raised">
      <svg
        viewBox={`0 0 ${ancho} ${H + 2 * MARGEN}`}
        role="group"
        aria-label="Plano del estacionamiento: tocá un lugar libre para elegirlo"
        className="block h-auto w-full select-none"
        style={{ minWidth: Math.min(ancho, 640) }}
      >
        <PlanoDefs />
        <g transform={`translate(${MARGEN} ${MARGEN})`}>
          <rect width={W} height={H} rx={4} style={{ fill: "var(--floor)" }} />
          <rect width={W} height={H} fill="url(#grilla-1)" />
          {conEntrada && conSalida && (
            <path d={caminoFlujo(plano.galpon)} className="plano-flujo" strokeLinecap="round" style={{ fill: "none", stroke: "var(--flow)", strokeWidth: 3, strokeDasharray: "8 8", opacity: 0.9 }} />
          )}
          {delPiso(plano.objetos, pisoId).map((o) => (
            <ObjetoPlano key={o.id} objeto={o} />
          ))}
          {delPiso(plano.sectores, pisoId).map((s) => (
            <SectorReserva key={s.id} sector={s} plano={plano} vehiculo={vehiculo} seleccionId={seleccionId} onElegir={onElegir} />
          ))}
          {conEntrada && <PuertaPlano galpon={plano.galpon} clave="ent" />}
          {conSalida && <PuertaPlano galpon={plano.galpon} clave="sal" />}
          <rect x={-3} y={-3} width={W + 6} height={H + 6} rx={6} pointerEvents="none" style={{ fill: "none", stroke: "var(--wall)", strokeWidth: 6 }} />
        </g>
      </svg>
    </div>
  );
}
