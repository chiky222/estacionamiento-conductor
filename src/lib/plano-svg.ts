/** Geometría en píxeles del dibujo SVG del plano (puertas y recorrido). */
import type { ClavePuerta, Galpon } from "@/lib/types";
import { ESCALA } from "@/lib/constants";

export interface GeomPuerta {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Punto medio de la puerta. */
  ax: number;
  ay: number;
  /** Dirección hacia adentro del galpón. */
  dx: number;
  dy: number;
  /** Posición y anclaje del rótulo. */
  lx: number;
  ly: number;
  anchor: "start" | "middle" | "end";
}

const ANCHO_PUERTA_M = 4;

export function geomPuerta(g: Galpon, clave: ClavePuerta): GeomPuerta {
  const pt = g.puertas[clave];
  const W = g.ancho * ESCALA;
  const H = g.largo * ESCALA;
  const L = ANCHO_PUERTA_M * ESCALA;
  const p = pt.pos * ESCALA;
  if (pt.lado === "izq") return { x1: 0, y1: p - L / 2, x2: 0, y2: p + L / 2, ax: 0, ay: p, dx: 1, dy: 0, lx: -8, ly: p + 3, anchor: "end" };
  if (pt.lado === "der") return { x1: W, y1: p - L / 2, x2: W, y2: p + L / 2, ax: W, ay: p, dx: -1, dy: 0, lx: W + 8, ly: p + 3, anchor: "start" };
  if (pt.lado === "arr") return { x1: p - L / 2, y1: 0, x2: p + L / 2, y2: 0, ax: p, ay: 0, dx: 0, dy: 1, lx: p, ly: -12, anchor: "middle" };
  return { x1: p - L / 2, y1: H, x2: p + L / 2, y2: H, ax: p, ay: H, dx: 0, dy: -1, lx: p, ly: H + 20, anchor: "middle" };
}

/** Recorrido en "L" o en "S" entre la entrada y la salida. */
export function caminoFlujo(g: Galpon) {
  const a = geomPuerta(g, "ent");
  const b = geomPuerta(g, "sal");
  const hor = (l: string) => l === "izq" || l === "der";
  const h1 = hor(g.puertas.ent.lado);
  const h2 = hor(g.puertas.sal.lado);
  if (h1 && h2) return `M${a.ax} ${a.ay} H${(a.ax + b.ax) / 2} V${b.ay} H${b.ax}`;
  if (!h1 && !h2) return `M${a.ax} ${a.ay} V${(a.ay + b.ay) / 2} H${b.ax} V${b.ay}`;
  if (h1) return `M${a.ax} ${a.ay} H${b.ax} V${b.ay}`;
  return `M${a.ax} ${a.ay} V${b.ay} H${b.ax}`;
}
