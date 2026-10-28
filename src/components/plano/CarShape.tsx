import type { CSSProperties } from "react";
import { PINTURAS, VEHICULOS, type TipoVehiculo } from "@/lib/vehiculos";

interface Props {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Semilla para elegir la pintura (el id de la plaza): siempre el mismo color para el mismo lugar. */
  semilla: string;
  tipo?: TipoVehiculo;
  /** Gira el frente hacia abajo (fila que mira al carril de abajo). */
  invertido?: boolean;
}

const pintura = (semilla: string) => {
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PINTURAS[h % PINTURAS.length];
};

/** Vehículo en vista superior de ESTACIONARTE, centrado en la plaza y orientado según su lado largo. */
export function CarShape({ x, y, w, h, semilla, tipo = "auto", invertido }: Props) {
  const v = VEHICULOS[tipo];
  const vertical = h >= w;
  const largo = vertical ? h : w;
  const ancho = vertical ? w : h;
  const escala = Math.min((ancho * 0.78) / v.w, (largo * 0.86) / v.h);
  const giro = (vertical ? 0 : 90) + (invertido ? 180 : 0);
  const estilo = { "--ea-paint": `var(--paint-${pintura(semilla)})` } as CSSProperties;
  return (
    <g
      transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${giro}) scale(${escala}) translate(${-v.w / 2} ${-v.h / 2})`}
      pointerEvents="none"
      style={estilo}
      dangerouslySetInnerHTML={{ __html: v.svg }}
    />
  );
}
