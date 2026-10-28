"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ubicacion } from "@/lib/conductor.types";
import type { PropsMapa } from "@/components/mapa/MapaEstacionamientos";
import { MarcadorPrecio, MarcadorUbicacion } from "@/components/mapa/MarcadorPrecio";
import { MapaControles } from "@/components/mapa/MapaControles";
import { clamp } from "@/lib/format";

/*
 * Mapa de muestra para trabajar sin API key de Google Maps: un plano estilizado de Palermo
 * (calles en diagonal, avenidas y plazas) con la misma proyección para los pines.
 * Con NEXT_PUBLIC_GOOGLE_MAPS_API_KEY se usa MapaGoogle y este componente no se carga.
 */
const LIM = { latMax: -34.58, latMin: -34.601, lngMin: -58.454, lngMax: -58.415 };
const W = 1000;
// Alto proporcional a la zona (en metros), para que las distancias no se deformen.
const H = 653;
const ANG = -32;
const ZOOM = [1, 3.2] as const;

const proyectar = (u: Ubicacion) => ({
  x: ((u.lng - LIM.lngMin) / (LIM.lngMax - LIM.lngMin)) * W,
  y: ((LIM.latMax - u.lat) / (LIM.latMax - LIM.latMin)) * H,
});

type Familia = 1 | 2;
const AVENIDAS: { nombre: string; por: Ubicacion; familia: Familia; ancho?: number }[] = [
  { nombre: "Av. Córdoba", por: { lat: -34.5916, lng: -58.4352 }, familia: 1 },
  { nombre: "Av. Santa Fe", por: { lat: -34.5838, lng: -58.4196 }, familia: 1 },
  { nombre: "Av. Corrientes", por: { lat: -34.5985, lng: -58.4342 }, familia: 1 },
  { nombre: "Av. Scalabrini Ortiz", por: { lat: -34.5922, lng: -58.4238 }, familia: 2 },
  { nombre: "Av. Dorrego", por: { lat: -34.5872, lng: -58.4428 }, familia: 2 },
  { nombre: "Av. Juan B. Justo", por: { lat: -34.5829, lng: -58.4362 }, familia: 2, ancho: 14 },
];
const PLAZAS: { nombre: string; en: Ubicacion; w: number; h: number }[] = [
  { nombre: "Plaza Serrano", en: { lat: -34.5889, lng: -58.4305 }, w: 26, h: 20 },
  { nombre: "Plaza Palermo Viejo", en: { lat: -34.5855, lng: -58.4252 }, w: 48, h: 34 },
  { nombre: "Plaza Armenia", en: { lat: -34.5947, lng: -58.4398 }, w: 40, h: 30 },
];

const rad = (g: number) => (g * Math.PI) / 180;
const direccion = (f: Familia) => {
  const a = rad(f === 1 ? ANG : ANG + 90);
  return { dx: Math.cos(a), dy: Math.sin(a), grados: f === 1 ? ANG : ANG + 90 };
};

function FondoCiudad() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="absolute inset-0 block" aria-hidden>
      <defs>
        {/* Manzanas de ~120 m: grilla girada como el damero de Palermo. */}
        <pattern id="manzanas" width={34} height={34} patternUnits="userSpaceOnUse" patternTransform={`rotate(${ANG})`}>
          <rect width={34} height={34} style={{ fill: "var(--map-street)" }} />
          <rect x={3} y={3} width={28} height={28} rx={2} style={{ fill: "var(--map-block)" }} />
        </pattern>
      </defs>
      <rect width={W} height={H} style={{ fill: "var(--map-land)" }} />
      <rect width={W} height={H} fill="url(#manzanas)" />
      {PLAZAS.map((p) => {
        const c = proyectar(p.en);
        return (
          <g key={p.nombre} transform={`translate(${c.x} ${c.y}) rotate(${ANG})`}>
            <rect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} rx={3} style={{ fill: "var(--map-park)" }} />
            <text y={p.h / 2 + 11} textAnchor="middle" className="font-sans text-[8px] font-semibold" style={{ fill: "var(--map-label)" }}>
              {p.nombre}
            </text>
          </g>
        );
      })}
      {/* Vías del ferrocarril San Martín, junto a Juan B. Justo. */}
      {(() => {
        const c = proyectar({ lat: -34.5815, lng: -58.4345 });
        const d = direccion(2);
        return (
          <line x1={c.x - d.dx * 1400} y1={c.y - d.dy * 1400} x2={c.x + d.dx * 1400} y2={c.y + d.dy * 1400} strokeDasharray="2 5" style={{ stroke: "var(--map-rail)", strokeWidth: 4 }} />
        );
      })()}
      {AVENIDAS.map((a) => {
        const c = proyectar(a.por);
        const d = direccion(a.familia);
        const ancho = a.ancho ?? 11;
        const ax = c.x - d.dx * 1400;
        const ay = c.y - d.dy * 1400;
        const bx = c.x + d.dx * 1400;
        const by = c.y + d.dy * 1400;
        // El rótulo va un poco corrido del punto, para no quedar debajo de un pin.
        const lx = c.x + d.dx * 150;
        const ly = c.y + d.dy * 150;
        const giro = d.grados > 90 ? d.grados - 180 : d.grados;
        return (
          <g key={a.nombre}>
            <line x1={ax} y1={ay} x2={bx} y2={by} style={{ stroke: "var(--map-avenue-edge)", strokeWidth: ancho + 2 }} />
            <line x1={ax} y1={ay} x2={bx} y2={by} style={{ stroke: "var(--map-avenue)", strokeWidth: ancho }} />
            <text
              transform={`translate(${lx} ${ly}) rotate(${giro})`}
              textAnchor="middle"
              dy={3}
              className="font-sans text-[8.5px] font-bold tracking-[.04em]"
              style={{ fill: "var(--map-label)" }}
            >
              {a.nombre.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MapaDemo({ estacionamientos, seleccionadoId, onSeleccionar, centro }: PropsMapa) {
  const caja = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const [vista, setVista] = useState({ z: 1.1, tx: 0, ty: 0 });
  const [animar, setAnimar] = useState(false);
  const arrastre = useRef<{ x: number; y: number; tx: number; ty: number; movio: boolean } | null>(null);
  const iniciado = useRef(false);

  const base = tam.w && tam.h ? Math.max(tam.w / W, tam.h / H) : 1;
  const escala = base * vista.z;

  /** Mantiene el mapa cubriendo toda la caja (no se puede arrastrar más allá del borde). */
  const limitar = useCallback(
    (v: { z: number; tx: number; ty: number }) => {
      const z = clamp(v.z, ZOOM[0], ZOOM[1]);
      const s = base * z;
      return { z, tx: clamp(v.tx, tam.w - W * s, 0), ty: clamp(v.ty, tam.h - H * s, 0) };
    },
    [base, tam],
  );

  const centrarEn = useCallback(
    (u: Ubicacion, z = vista.z) => {
      const p = proyectar(u);
      const s = base * z;
      setAnimar(true);
      setVista(limitar({ z, tx: tam.w / 2 - p.x * s, ty: tam.h / 2 - p.y * s }));
    },
    [base, tam, vista.z, limitar],
  );

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Primera vez que se conoce el tamaño: centrar en el conductor.
  useEffect(() => {
    if (!tam.w || iniciado.current) return;
    iniciado.current = true;
    const p = proyectar(centro);
    const s = base * vista.z;
    setVista(limitar({ z: vista.z, tx: tam.w / 2 - p.x * s, ty: tam.h / 2 - p.y * s }));
  }, [tam, base, centro, vista.z, limitar]);

  // Al elegir un estacionamiento desde la lista, el mapa va hasta él.
  useEffect(() => {
    const e = estacionamientos.find((x) => x.id === seleccionadoId);
    if (e) centrarEn(e.ubicacion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionadoId]);

  const zoom = (factor: number, cx = tam.w / 2, cy = tam.h / 2) =>
    setVista((v) => {
      const z = clamp(v.z * factor, ZOOM[0], ZOOM[1]);
      const k = z / v.z;
      // Zoom alrededor del punto (cursor o centro): ese punto queda quieto.
      return limitar({ z, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k });
    });

  return (
    <div
      ref={caja}
      className="relative h-full w-full touch-none overflow-hidden bg-[var(--map-land)] select-none"
      onPointerDown={(e) => {
        // Sobre un pin no se arrastra: si se captura el puntero, el click no le llega al botón.
        if ((e.target as HTMLElement).closest("button")) return;
        setAnimar(false);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        arrastre.current = { x: e.clientX, y: e.clientY, tx: vista.tx, ty: vista.ty, movio: false };
      }}
      onPointerMove={(e) => {
        const a = arrastre.current;
        if (!a) return;
        const dx = e.clientX - a.x;
        const dy = e.clientY - a.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) a.movio = true;
        setVista((v) => limitar({ ...v, tx: a.tx + dx, ty: a.ty + dy }));
      }}
      onPointerUp={() => {
        const a = arrastre.current;
        arrastre.current = null;
        // Un toque sin arrastrar sobre el fondo deselecciona (sobre un pin no se llega acá).
        if (a && !a.movio) onSeleccionar(null);
      }}
      onWheel={(e) => {
        const r = caja.current!.getBoundingClientRect();
        setAnimar(false);
        zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
      }}
      role="application"
      aria-label="Mapa de estacionamientos"
    >
      <div
        className={animar ? "absolute top-0 left-0 transition-transform duration-500 ease-out" : "absolute top-0 left-0"}
        style={{ width: W * escala, height: H * escala, transform: `translate(${vista.tx}px, ${vista.ty}px)` }}
      >
        <FondoCiudad />
        <div className="absolute" style={proyectarPx(centro, escala)}>
          <MarcadorUbicacion />
        </div>
        {estacionamientos.map((e) => (
          <div key={e.id} className="absolute" style={{ ...proyectarPx(e.ubicacion, escala), zIndex: e.id === seleccionadoId ? 3 : e.estado === "sold_out" ? 1 : 2 }}>
            <MarcadorPrecio est={e} seleccionado={e.id === seleccionadoId} onClick={() => onSeleccionar(e.id)} />
          </div>
        ))}
      </div>
      <MapaControles onAcercar={() => zoom(1.3)} onAlejar={() => zoom(1 / 1.3)} onCentrar={() => centrarEn(centro)} />
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-[6px] bg-surface-glass px-2 py-0.5 text-[11px] font-medium text-ink-muted backdrop-blur">
        Mapa de muestra · con la API key de Google Maps se ve el mapa real
      </p>
    </div>
  );
}

const proyectarPx = (u: Ubicacion, s: number) => {
  const p = proyectar(u);
  return { left: p.x * s, top: p.y * s };
};
