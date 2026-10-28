import type { ClavePuerta, Galpon } from "@/lib/types";
import { geomPuerta } from "@/lib/plano-svg";

/** Entrada (petróleo) o salida (coral) con flecha de sentido, como en el tablero. */
export function PuertaPlano({ galpon, clave }: { galpon: Galpon; clave: ClavePuerta }) {
  const g = geomPuerta(galpon, clave);
  const entrada = clave === "ent";
  const sx = entrada ? g.dx : -g.dx;
  const sy = entrada ? g.dy : -g.dy;
  const px = -sy;
  const py = sx;
  const punta = [g.ax + sx * 14, g.ay + sy * 14];
  const b1 = [g.ax - sx * 5 + px * 10, g.ay - sy * 5 + py * 10];
  const b2 = [g.ax - sx * 5 - px * 10, g.ay - sy * 5 - py * 10];
  const lado = galpon.puertas[clave].lado;
  const lateral = lado === "izq" || lado === "der";
  const color = entrada ? "var(--brand)" : "var(--coral)";
  const texto = entrada ? "var(--brand-strong)" : "var(--coral-text)";
  return (
    <g pointerEvents="none">
      <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} style={{ stroke: "var(--floor)", strokeWidth: 9 }} />
      <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} strokeLinecap="round" style={{ stroke: color, strokeWidth: 3, strokeDasharray: "6 5" }} />
      <polygon points={`${punta[0]},${punta[1]} ${b1[0]},${b1[1]} ${b2[0]},${b2[1]}`} strokeLinejoin="round" style={{ fill: color, stroke: color, strokeWidth: 2 }} />
      <text
        {...(lateral ? { transform: `translate(${lado === "izq" ? -10 : g.ax + 18} ${g.ay}) rotate(-90)`, textAnchor: "middle" as const } : { x: g.lx, y: g.ly, textAnchor: g.anchor })}
        className="font-sans text-[10px] font-bold tracking-[.08em]"
        style={{ fill: texto, paintOrder: "stroke", stroke: "var(--surface-raised)", strokeWidth: 3, strokeLinejoin: "round" }}
      >
        {entrada ? "ENTRADA" : "SALIDA"}
      </text>
    </g>
  );
}
