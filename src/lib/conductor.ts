/** Helpers puros de la app del conductor: distancias, disponibilidad, horarios y elección de plaza. */
import type { ClaseVehiculo, Sector } from "@/lib/types";
import type { EstadoCesion, EstadoDisponibilidad, EstadoReserva, PlanoPublico, PlazaPublica, Servicio, TarifaSector, Ubicacion } from "@/lib/conductor.types";
import type { PillTone } from "@/components/common/CommonPill";
import type { NombreIcono } from "@/lib/iconos";
import { ars } from "@/lib/format";
import { etiquetaPlaza, idPlaza, pisosOrdenados, vehiculosPermitidos } from "@/lib/plano";

/* ====== distancias ====== */

/** Desde dónde se busca si el conductor no compartió su ubicación: Plaza Serrano, Palermo. */
export const CENTRO_DEFECTO: Ubicacion = { lat: -34.5886, lng: -58.4302 };

/** Distancia en metros entre dos puntos (haversine). */
export function distanciaM(a: Ubicacion, b: Ubicacion) {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 640 → "640 m"; 1830 → "1,8 km". Con "a pie" se estima a 80 m por minuto. */
export const textoDistancia = (m: number) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(Math.round(m / 100) / 10).toLocaleString("es-AR")} km`;

export const minutosAPie = (m: number) => Math.max(1, Math.round(m / 80));

/* ====== disponibilidad ====== */

/** "pocos" cuando quedan 10 % o menos de los lugares (mismo umbral que la alerta del tablero). */
export function estadoDisponibilidad(libres: number, total: number): EstadoDisponibilidad {
  if (libres <= 0) return "sold_out";
  return total && libres / total <= 0.1 ? "pocos" : "disponible";
}

export const ESTADOS_DISPONIBILIDAD: Record<EstadoDisponibilidad, { label: string; tone: PillTone; icon: NombreIcono }> = {
  disponible: { label: "Hay lugar", tone: "brand", icon: "check" },
  pocos: { label: "Últimos lugares", tone: "amber", icon: "alerta" },
  sold_out: { label: "Sold-out", tone: "neutral", icon: "cerrar" },
};

export const ESTADOS_RESERVA: Record<EstadoReserva, { label: string; tone: PillTone; icon: NombreIcono }> = {
  pendiente_pago: { label: "Pago pendiente", tone: "amber", icon: "reloj" },
  confirmada: { label: "Confirmada", tone: "brand", icon: "check" },
  en_curso: { label: "En curso", tone: "sky", icon: "auto" },
  finalizada: { label: "Finalizada", tone: "neutral", icon: "check" },
  cancelada: { label: "Cancelada", tone: "neutral", icon: "cerrar" },
  vencida: { label: "Vencida", tone: "danger", icon: "alerta" },
};

export const ESTADOS_CESION: Record<EstadoCesion, { label: string; tone: PillTone; icon: NombreIcono }> = {
  proxima: { label: "Próxima", tone: "sky", icon: "calendario" },
  en_curso: { label: "Cedido ahora", tone: "brand", icon: "check" },
  terminada: { label: "Terminada", tone: "neutral", icon: "reloj" },
};

export const SERVICIOS: Record<Servicio, { label: string; icon: NombreIcono }> = {
  techado: { label: "Techado", icon: "techo" },
  "24h": { label: "24 h", icon: "reloj" },
  pmr: { label: "Movilidad reducida", icon: "accesible" },
  ev: { label: "Carga eléctrica", icon: "cargador" },
  seguridad: { label: "Seguridad", icon: "escudo" },
  lavado: { label: "Lavado", icon: "gota" },
};

export const textoPrecio = (p: { modo: "hora" | "unica"; valor: number }) => (p.modo === "unica" ? `Único ${ars(p.valor)}` : `${ars(p.valor)}/h`);

/* ====== horarios ====== */

/** "18:30" en hora local. */
export const horaDe = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** "hoy", "mañana" o "jue 30/10". */
export function diaDe(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dif = Math.round((new Date(d).setHours(0, 0, 0, 0) - hoy.getTime()) / 864e5);
  if (dif === 0) return "hoy";
  if (dif === 1) return "mañana";
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

/** Próximo múltiplo de 15 minutos (la llegada "ahora" se redondea para que la cotización no cambie a cada segundo). */
export function proximoCuarto(base = new Date()) {
  const d = new Date(base);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return d;
}

/** Opciones de llegada: ahora y cada 30 minutos durante las próximas `horas`. */
export function opcionesLlegada(horas = 12) {
  const inicio = proximoCuarto();
  const ops = [{ value: inicio.toISOString(), label: "Ahora" }];
  const d = new Date(inicio);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  for (let i = 0; i < horas * 2; i++) {
    ops.push({ value: d.toISOString(), label: `${diaDe(d.toISOString()) === "hoy" ? "" : "mañana "}${horaDe(d.toISOString())}` });
    d.setMinutes(d.getMinutes() + 30);
  }
  return ops;
}

export const sumarMinutos = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60000).toISOString();

export const DURACIONES = [1, 2, 3, 4, 6, 8, 12];

/* ====== plano y elección de plaza ====== */

export const plazaPublicaDe = (plano: PlanoPublico, s: Sector, fila: number, col: number): PlazaPublica =>
  plano.plazas[idPlaza(s, fila, col)] ?? { id: idPlaza(s, fila, col), sectorId: s.id, fila, columna: col, estado: "libre", tipo: "std" };

/** Una plaza se puede elegir si está libre y el vehículo entra en su sector. */
export const plazaElegible = (p: PlazaPublica, s: Sector, vehiculo: ClaseVehiculo) =>
  p.estado === "libre" && vehiculosPermitidos(s).includes(vehiculo);

export const tarifaDelSector = (plano: PlanoPublico, sectorId: string): TarifaSector | undefined => plano.tarifas.find((t) => t.sectorId === sectorId);

/** Lugares libres de un sector para un vehículo. */
export function libresSector(plano: PlanoPublico, s: Sector, vehiculo: ClaseVehiculo) {
  if (!vehiculosPermitidos(s).includes(vehiculo)) return 0;
  let n = 0;
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) if (plazaPublicaDe(plano, s, r, c).estado === "libre") n++;
  return n;
}

/** Datos para mostrar una plaza elegida: etiqueta, sector y piso. */
export function datosPlaza(plano: PlanoPublico, plazaId: string) {
  const p = plano.plazas[plazaId];
  const s = plano.sectores.find((x) => x.id === (p?.sectorId ?? plazaId.split("-")[0]));
  if (!s) return null;
  const [, f, c] = plazaId.split("-").map(Number);
  const piso = plano.pisos.find((x) => x.id === s.pisoId);
  return { sector: s, etiqueta: etiquetaPlaza(s, f, c), piso, tarifa: tarifaDelSector(plano, s.id), tipo: p?.tipo ?? "std" };
}

/** Comparación lexicográfica: [precio, pmr, piso, fila, col]. */
function menor(a: number[], b: number[]) {
  const i = a.findIndex((v, k) => v !== b[k]);
  return i >= 0 && a[i] < b[i];
}

/**
 * "Elegir por mí": la plaza libre más barata donde entra el vehículo; a igual precio, una que no sea
 * de movilidad reducida, la del piso más bajo y la más cercana a la primera fila (menos vueltas para llegar).
 */
export function mejorPlaza(plano: PlanoPublico, vehiculo: ClaseVehiculo, sectorId?: string): string | null {
  const ordenPiso = new Map(pisosOrdenados(plano.pisos).map((p, i) => [p.id, i]));
  let mejor: { id: string; clave: number[] } | null = null;
  for (const s of plano.sectores) {
    if (!vehiculosPermitidos(s).includes(vehiculo) || (sectorId && s.id !== sectorId)) continue;
    const precio = tarifaDelSector(plano, s.id)?.valor ?? Infinity;
    for (let r = 0; r < s.rows; r++)
      for (let c = 0; c < s.cols; c++) {
        const p = plazaPublicaDe(plano, s, r, c);
        if (p.estado !== "libre") continue;
        // Los lugares para movilidad reducida quedan para quien los necesita: se eligen solo si no hay otros.
        const clave = [precio, p.tipo === "pmr" ? 1 : 0, ordenPiso.get(s.pisoId) ?? 0, r, c];
        if (!mejor || menor(clave, mejor.clave)) mejor = { id: p.id, clave };
      }
  }
  return mejor?.id ?? null;
}
