"use client";

import type { ClaseVehiculo, Sector } from "@/lib/types";
import type { PlazaPublica } from "@/lib/conductor.types";
import { ESCALA } from "@/lib/constants";
import { centroPlaza, claseSector, etiquetaPlaza, geometriaSector } from "@/lib/plano";
import { plazaElegible } from "@/lib/conductor";
import { CommonIconSvg } from "@/components/common/CommonIcon";
import { CarShape } from "@/components/plano/CarShape";

interface Props {
  sector: Sector;
  plaza: PlazaPublica;
  vehiculo: ClaseVehiculo;
  seleccionada: boolean;
  onElegir?: (id: string) => void;
}

/**
 * Un lugar del plano visto por el conductor. Mismo dibujo que el tablero del gestor, con menos estados:
 * libre para su vehículo (petróleo con "E", se puede tocar), elegido (petróleo lleno con tilde),
 * ocupado (vehículo apagado), no disponible (rayado) y libre pero chico para su vehículo (punteado).
 */
export function PlazaReserva({ sector: s, plaza: p, vehiculo, seleccionada, onElegir }: Props) {
  // Igual que en el tablero: en espiga la plaza se inclina y pasados los 45° se dibuja acostada.
  const g = geometriaSector(s);
  const pos = centroPlaza(s, p.fila, p.columna);
  const inc = g.inclinacion;
  const acostada = Math.abs(inc) > 45;
  const giro = acostada ? inc - Math.sign(inc) * 90 : inc;
  const w = (inc ? (acostada ? s.bl : s.bw) : g.fw) * ESCALA;
  const h = (inc ? (acostada ? s.bw : s.bl) : g.fh) * ESCALA;
  const x = -w / 2;
  const y = -h / 2;
  const chico = Math.min(w, h);
  const moto = chico < 32;
  const tam = Math.max(12, Math.min(20, chico * 0.42));
  const elegible = plazaElegible(p, s, vehiculo);
  const etiqueta = etiquetaPlaza(s, p.fila, p.columna);
  const codigo = moto ? String(p.fila * s.cols + p.columna + 1) : etiqueta;
  const anchoCodigo = codigo.length * 5.6 + 6;

  let fill = "var(--surface-sunken)";
  let stroke = "var(--line-strong)";
  let dash: string | undefined;
  let opacidad = 1;
  if (seleccionada) {
    fill = "var(--brand)";
    stroke = "var(--brand-strong)";
  } else if (elegible) {
    fill = p.tipo === "pmr" ? "var(--sky-soft)" : "var(--brand-soft)";
    stroke = "var(--brand)";
  } else if (p.estado === "no_disponible") {
    fill = "url(#rayado)";
    stroke = "var(--blocked)";
  } else if (p.estado === "libre") {
    // Libre pero el vehículo no entra (ej. camioneta en plaza de auto).
    dash = "3 3";
    opacidad = 0.6;
  }

  const accion = elegible && onElegir ? () => onElegir(p.id) : undefined;
  const estadoTexto = seleccionada ? "elegido" : elegible ? "libre" : p.estado === "libre" ? "no entra tu vehículo" : "no disponible";

  return (
    <g
      transform={`translate(${pos.x * ESCALA} ${pos.y * ESCALA})${giro ? ` rotate(${giro})` : ""}`}
      className={accion ? "group cursor-pointer" : undefined}
      onClick={accion}
      onKeyDown={accion ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), accion()) : undefined}
      role={accion ? "button" : "img"}
      tabIndex={accion ? 0 : undefined}
      aria-pressed={accion ? seleccionada : undefined}
      aria-label={`Lugar ${etiqueta}, ${estadoTexto}`}
      opacity={opacidad}
    >
      <rect
        x={x + 1.5}
        y={y + 1.5}
        width={w - 3}
        height={h - 3}
        rx={5}
        className={accion ? "group-hover:[stroke-width:2.5] group-focus-visible:[stroke:var(--focus)]" : undefined}
        style={{ fill, stroke, strokeWidth: elegible || seleccionada ? 1.6 : 1.2, strokeDasharray: dash }}
      />
      {p.estado === "ocupada" && !seleccionada && (
        // En gris: los colores quedan para lo que el conductor puede elegir.
        <g opacity={0.5} style={{ filter: "grayscale(1)" }}>
          <CarShape x={x + 2} y={y + 2} w={w - 4} h={h - 4} semilla={p.id} tipo={moto ? "moto" : (p.vehiculo ?? claseSector(s))} invertido={p.fila % 2 === 1} />
        </g>
      )}
      {seleccionada && chico >= 16 && (
        <g pointerEvents="none">
          <circle r={tam * 0.8} style={{ fill: "var(--on-brand)" }} />
          <CommonIconSvg name="check" x={-tam / 2} y={-tam / 2} size={tam} color="var(--brand-strong)" strokeWidth={2.6} />
        </g>
      )}
      {elegible && !seleccionada && chico >= 18 && (
        p.tipo === "pmr" || p.tipo === "ev" ? (
          <CommonIconSvg name={p.tipo === "pmr" ? "accesible" : "cargador"} x={-tam / 2} y={-tam / 2} size={tam} color={p.tipo === "pmr" ? "var(--sky)" : "var(--brand-strong)"} strokeWidth={2} />
        ) : (
          <text y={tam * 0.36} textAnchor="middle" pointerEvents="none" className="font-display font-bold" style={{ fill: "var(--brand-strong)", fontSize: tam, opacity: 0.9 }}>
            E
          </text>
        )
      )}
      {p.estado === "no_disponible" && !seleccionada && chico >= 18 && (
        <g pointerEvents="none">
          <circle r={tam * 0.7} style={{ fill: "var(--surface-raised)" }} />
          <CommonIconSvg name="cerrar" x={-tam / 2.6} y={-tam / 2.6} size={tam / 1.3} color="var(--ink-muted)" strokeWidth={2} />
        </g>
      )}
      <g pointerEvents="none">
        <rect x={-anchoCodigo / 2} y={y + 3.5} width={anchoCodigo} height={11} rx={3} style={{ fill: "var(--surface-raised)", opacity: 0.92 }} />
        <text y={y + 12} textAnchor="middle" className="font-mono text-[8.5px] font-semibold" style={{ fill: "var(--ink)" }}>
          {codigo}
        </text>
      </g>
      {seleccionada && <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={6} pointerEvents="none" style={{ fill: "none", stroke: "var(--focus)", strokeWidth: 3 }} />}
    </g>
  );
}
