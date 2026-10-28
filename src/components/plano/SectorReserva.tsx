"use client";

import type { ClaseVehiculo, Sector } from "@/lib/types";
import type { PlanoPublico } from "@/lib/conductor.types";
import { ESCALA, colorSector } from "@/lib/constants";
import { claseSector, geometriaSector, vehiculosPermitidos } from "@/lib/plano";
import { plazaPublicaDe, tarifaDelSector, textoPrecio } from "@/lib/conductor";
import { PlazaReserva } from "@/components/plano/PlazaReserva";
import { CommonIconSvg } from "@/components/common/CommonIcon";

interface Props {
  sector: Sector;
  plano: PlanoPublico;
  vehiculo: ClaseVehiculo;
  seleccionId: string | null;
  onElegir?: (plazaId: string) => void;
}

/** Sector con su pestaña de color, el nombre y el precio vigente; apagado si el vehículo no entra. */
export function SectorReserva({ sector: s, plano, vehiculo, seleccionId, onElegir }: Props) {
  const g = geometriaSector(s);
  const px = s.x * ESCALA;
  const py = s.y * ESCALA;
  const pw = g.w * ESCALA;
  const ph = g.h * ESCALA;
  const color = colorSector(s.color);
  const apto = vehiculosPermitidos(s).includes(vehiculo);
  const tarifa = tarifaDelSector(plano, s.id);
  const clase = claseSector(s);
  const conIcono = clase !== "auto";
  // Si el nombre no entra en el ancho del sector, la pestaña queda solo con la letra y el precio.
  const ancho = (t: string) => t.length * 6.9 + 18 + (conIcono ? 18 : 0);
  const precio = tarifa ? " · " + textoPrecio(tarifa) : "";
  const largo = `${s.id} · ${s.nombre}${precio}`;
  const rotulo = ancho(largo) <= pw + 10 ? largo : `${s.id}${precio}`;
  const anchoPestana = ancho(rotulo);
  const giro = g.ang ? `rotate(${g.ang} ${px + pw / 2} ${py + ph / 2})` : undefined;

  const plazas = [];
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const p = plazaPublicaDe(plano, s, r, c);
      plazas.push(<PlazaReserva key={p.id} sector={s} plaza={p} vehiculo={vehiculo} seleccionada={p.id === seleccionId} onElegir={onElegir} />);
    }

  return (
    <g transform={giro} opacity={apto ? 1 : 0.55}>
      <rect
        x={px - 5}
        y={py - 5}
        width={pw + 10}
        height={ph + 10}
        rx={8}
        style={{ fill: `color-mix(in srgb, ${color} 7%, transparent)`, stroke: color, strokeWidth: 1.5, strokeDasharray: apto ? undefined : "6 4" }}
      />
      {plazas}
      <g pointerEvents="none">
        <rect x={px - 5} y={py - 27} width={anchoPestana} height={22} rx={11} style={{ fill: color }} />
        {conIcono && <CommonIconSvg name={clase === "camioneta" ? "camioneta" : "moto"} x={px + 3} y={py - 23} size={14} color="var(--on-sector)" strokeWidth={2} />}
        <text x={px + 5 + (conIcono ? 17 : 0)} y={py - 12} className="font-sans text-[11px] font-bold tracking-[.04em]" style={{ fill: "var(--on-sector)" }}>
          {rotulo}
        </text>
      </g>
    </g>
  );
}
