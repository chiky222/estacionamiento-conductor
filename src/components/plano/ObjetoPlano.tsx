import type { Objeto, TipoObjeto } from "@/lib/types";
import type { NombreIcono } from "@/lib/iconos";
import { ESCALA } from "@/lib/constants";
import { CommonIconSvg } from "@/components/common/CommonIcon";

// Igual que en el tablero: servicios en cielo, carga en ámbar, estructura en gris.
const ELEMENTO: Record<TipoObjeto, { icono: NombreIcono; fondo: string; tinta: string }> = {
  oficina: { icono: "oficina", fondo: "var(--sky-soft)", tinta: "var(--sky)" },
  banos: { icono: "bano", fondo: "var(--sky-soft)", tinta: "var(--sky)" },
  carga: { icono: "utilitario", fondo: "var(--amber-soft)", tinta: "var(--amber-text)" },
  rampa: { icono: "siguiente", fondo: "var(--surface-sunken)", tinta: "var(--ink-muted)" },
  columna: { icono: "columna", fondo: "var(--surface-sunken)", tinta: "var(--ink-muted)" },
  zona: { icono: "cerrar", fondo: "url(#rayado)", tinta: "var(--ink-muted)" },
};

/** Oficina, baños, rampa…: solo de referencia para ubicarse (el conductor no los toca). */
export function ObjetoPlano({ objeto: o }: { objeto: Objeto }) {
  const e = ELEMENTO[o.tipo] ?? ELEMENTO.columna;
  const x = o.x * ESCALA;
  const y = o.y * ESCALA;
  const w = o.w * ESCALA;
  const h = o.h * ESCALA;
  const chico = Math.min(w, h);
  const compacto = chico < 44;
  const tam = Math.max(12, Math.min(22, chico * 0.5));
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx={compacto ? 4 : 8} style={{ fill: e.fondo, stroke: `color-mix(in srgb, ${e.tinta} 45%, transparent)`, strokeWidth: 1.5, strokeDasharray: o.tipo === "zona" ? "5 3" : undefined }} />
      <CommonIconSvg name={e.icono} x={x + w / 2 - tam / 2} y={compacto ? y + h / 2 - tam / 2 : y + h / 2 - tam + 1} size={tam} color={e.tinta} />
      {!compacto && (
        <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className="font-sans text-[11px] font-semibold" style={{ fill: e.tinta }}>
          {o.label}
        </text>
      )}
    </g>
  );
}
