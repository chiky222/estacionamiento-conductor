/**
 * Estacionamientos de ejemplo alrededor de Palermo (CABA). Solo los usa la API simulada.
 * Cada uno es un tablero completo del gestor (DatosTablero) más los datos públicos que ve el conductor.
 * El primero es el mismo "Galpón Central" del tablero del gestor.
 */
import type { ClaseVehiculo, DatosTablero, Plaza, Regla, Sector, Tarifa } from "@/lib/types";
import type { Servicio, Ubicacion } from "@/lib/conductor.types";
import { claseVehiculo } from "@/lib/constants";
import { hoy, isoFecha } from "@/lib/format";
import { idPlaza } from "@/lib/plano";
import { datosDeEjemplo } from "@/lib/mock/mock.galpon-central";
import { CENTRO_DEFECTO } from "@/lib/conductor";

export interface MetaEstacionamiento {
  id: string;
  nombre: string;
  direccion: string;
  barrio: string;
  ubicacion: Ubicacion;
  /** Minutos del día; sin valores = abierto 24 h. */
  abre?: number;
  cierra?: number;
  servicios: Servicio[];
  calificacion: number;
  telefono: string;
  toleranciaMin: number;
  reservaMaxHoras: number;
  /** Medios de pago que habilitó el gestor (ids de MEDIOS_PAGO). */
  medios: string[];
}

export interface EstacionamientoMock {
  meta: MetaEstacionamiento;
  datos: DatosTablero;
}

/** Punto de búsqueda por defecto (Plaza Serrano). */
export const CENTRO_DEMO: Ubicacion = CENTRO_DEFECTO;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TARIFAS: Tarifa[] = [
  { id: "std", nombre: "Rotativo", hora: 2200, fraccion: 30, tope: 15000, mensual: 98000 },
  { id: "tec", nombre: "Techado", hora: 2900, fraccion: 30, tope: 19000, mensual: 125000 },
  { id: "moto", nombre: "Moto", hora: 900, fraccion: 30, tope: 6000, mensual: 38000 },
  { id: "cam", nombre: "Camioneta", hora: 3400, fraccion: 30, tope: 22000, mensual: 150000 },
];

type SectorBase = Pick<Sector, "id" | "nombre" | "x" | "y" | "cols" | "rows"> & Partial<Sector> & { vehiculo: ClaseVehiculo };

/** Sector con las medidas estándar de su clase de vehículo. */
const sector = (s: SectorBase, color: number): Sector => {
  const c = claseVehiculo(s.vehiculo);
  return { pisoId: "p0", bw: c.bw, bl: c.bl, rot: false, tarifaId: s.vehiculo === "moto" ? "moto" : s.vehiculo === "camioneta" ? "cam" : "std", tipo: "rotativo", color, ...s };
};

interface Opciones {
  ancho: number;
  largo: number;
  pisos?: { id: string; nombre: string }[];
  sectores: SectorBase[];
  objetos?: DatosTablero["objetos"];
  reglas?: Regla[];
  /** Fracción de plazas ocupadas por sector (0 a 1). `*` = el resto. */
  ocupacion: Record<string, number>;
  senaPct: number;
  semilla: number;
  /** Precio por hora distinto al estándar, por tarifa. */
  precios?: Partial<Record<string, number>>;
}

function tablero(nombre: string, o: Opciones): DatosTablero {
  const r = rng(o.semilla);
  const sectores = o.sectores.map((s, i) => sector(s, i));
  const plazas: Record<string, Plaza> = {};
  sectores.forEach((s) => {
    const occ = o.ocupacion[s.id] ?? o.ocupacion["*"] ?? 0.5;
    for (let f = 0; f < s.rows; f++)
      for (let c = 0; c < s.cols; c++) {
        const p: Plaza = { id: idPlaza(s, f, c), sectorId: s.id, fila: f, columna: c, estado: "libre", tipo: "std" };
        const x = r();
        if (x < occ) {
          p.estado = "ocupada";
          p.vehiculo = s.vehiculo === "camioneta" && r() < 0.3 ? "auto" : s.vehiculo;
          p.desde = 600;
        } else if (x < occ + 0.05 && occ < 1) {
          p.estado = r() < 0.5 ? "reservada" : "bloqueada";
          if (p.estado === "reservada") Object.assign(p, { cliente: "Reserva", hasta: 1380 });
        }
        if (s.vehiculo === "auto" && f === 0 && c === 0) p.tipo = "pmr";
        if (s.vehiculo === "auto" && f === s.rows - 1 && c === s.cols - 1 && r() < 0.6) p.tipo = "ev";
        plazas[p.id] = p;
      }
  });
  return {
    turno: { nombre: "Turno", sede: nombre, cajaBase: 0 },
    configuracion: { senaPct: o.senaPct },
    galpon: { ancho: o.ancho, largo: o.largo, puertas: { ent: { lado: "izq", pos: o.largo / 2 }, sal: { lado: "der", pos: o.largo / 2 } } },
    pisos: (o.pisos ?? [{ id: "p0", nombre: "Planta baja" }]).map((p, i) => ({ ...p, orden: i })),
    sectores,
    objetos: o.objetos ?? [],
    plazas,
    tarifas: TARIFAS.map((t) => ({ ...t, hora: o.precios?.[t.id] ?? t.hora })),
    reglas: o.reglas ?? [],
    movimientos: [],
  };
}

const MEDIOS_TODOS = ["mercadopago", "tarjeta", "modo"];

export function estacionamientosDeEjemplo(): EstacionamientoMock[] {
  const HOY = isoFecha(hoy());
  const central = datosDeEjemplo();
  central.configuracion.senaPct = 20;
  // En la demo el Galpón Central permite ceder lugares de abonados; A-10 es del usuario demo (ver mock.galpon-central).
  central.configuracion.subalquiler = { habilitado: true, pctAbonado: 50 };

  return [
    {
      meta: {
        id: "galpon-central",
        nombre: "Galpón Central",
        direccion: "Av. Córdoba 5230",
        barrio: "Palermo",
        ubicacion: { lat: -34.5912, lng: -58.4347 },
        servicios: ["techado", "24h", "pmr", "ev", "seguridad"],
        calificacion: 4.7,
        telefono: "11 4772-0000",
        toleranciaMin: 15,
        reservaMaxHoras: 12,
        medios: MEDIOS_TODOS,
      },
      datos: central,
    },
    {
      meta: {
        id: "cochera-serrano",
        nombre: "Cochera Plaza Serrano",
        direccion: "Jorge Luis Borges 1720",
        barrio: "Palermo Soho",
        ubicacion: { lat: -34.5878, lng: -58.4285 },
        servicios: ["techado", "seguridad"],
        calificacion: 4.4,
        telefono: "11 4831-1111",
        toleranciaMin: 15,
        reservaMaxHoras: 8,
        medios: MEDIOS_TODOS,
      },
      datos: tablero("Cochera Plaza Serrano", {
        ancho: 26,
        largo: 18,
        semilla: 11,
        senaPct: 30,
        ocupacion: { "*": 1 },
        precios: { std: 3200 },
        sectores: [
          { id: "A", nombre: "Planta", x: 2, y: 1.5, cols: 8, rows: 1, vehiculo: "auto" },
          { id: "B", nombre: "Fondo", x: 2, y: 11.5, cols: 8, rows: 1, vehiculo: "auto" },
        ],
        objetos: [{ id: "o1", pisoId: "p0", tipo: "oficina", label: "Caja", x: 22.5, y: 1.5, w: 3, h: 3 }],
      }),
    },
    {
      meta: {
        id: "parking-scalabrini",
        nombre: "Parking Scalabrini",
        direccion: "Av. Scalabrini Ortiz 1650",
        barrio: "Palermo",
        ubicacion: { lat: -34.5917, lng: -58.4246 },
        servicios: ["24h", "ev", "pmr", "lavado"],
        calificacion: 4.5,
        telefono: "11 4833-2222",
        toleranciaMin: 20,
        reservaMaxHoras: 12,
        medios: MEDIOS_TODOS,
      },
      datos: tablero("Parking Scalabrini", {
        ancho: 44,
        largo: 26,
        semilla: 22,
        senaPct: 25,
        ocupacion: { A: 0.55, B: 0.4, C: 0.5 },
        precios: { std: 2400 },
        sectores: [
          { id: "A", nombre: "Espiga norte", x: 2, y: 2, cols: 10, rows: 1, vehiculo: "auto", espiga: 45 },
          { id: "B", nombre: "Central", x: 2, y: 14, cols: 10, rows: 2, vehiculo: "auto" },
          { id: "C", nombre: "Motos", x: 30, y: 14, cols: 10, rows: 2, vehiculo: "moto" },
        ],
        objetos: [
          { id: "o1", pisoId: "p0", tipo: "banos", label: "Baños", x: 37, y: 8.5, w: 5, h: 4 },
          { id: "o2", pisoId: "p0", tipo: "carga", label: "Lavadero", x: 30, y: 21, w: 12, h: 4 },
        ],
      }),
    },
    {
      meta: {
        id: "garage-dorrego",
        nombre: "Garage Dorrego",
        direccion: "Dorrego 1480",
        barrio: "Villa Crespo",
        ubicacion: { lat: -34.5878, lng: -58.4419 },
        abre: 7 * 60,
        cierra: 24 * 60 - 1,
        servicios: ["techado"],
        calificacion: 4.2,
        telefono: "11 4855-3333",
        toleranciaMin: 15,
        reservaMaxHoras: 6,
        medios: ["mercadopago", "tarjeta"],
      },
      datos: tablero("Garage Dorrego", {
        ancho: 24,
        largo: 22,
        semilla: 33,
        senaPct: 0,
        ocupacion: { A: 0.88, B: 0.9 },
        sectores: [
          { id: "A", nombre: "Autos", x: 2, y: 2, cols: 8, rows: 2, vehiculo: "auto" },
          { id: "B", nombre: "Camionetas", x: 2, y: 15, cols: 4, rows: 1, vehiculo: "camioneta" },
        ],
        objetos: [{ id: "o1", pisoId: "p0", tipo: "columna", label: "Columna", x: 17, y: 16, w: 1, h: 1 }],
      }),
    },
    {
      meta: {
        id: "estacionamiento-humboldt",
        nombre: "Estacionamiento Humboldt",
        direccion: "Humboldt 420",
        barrio: "Villa Crespo",
        ubicacion: { lat: -34.5946, lng: -58.4469 },
        servicios: ["24h", "seguridad"],
        calificacion: 4.0,
        telefono: "11 4857-4444",
        toleranciaMin: 10,
        reservaMaxHoras: 8,
        medios: MEDIOS_TODOS,
      },
      datos: tablero("Estacionamiento Humboldt", {
        ancho: 40,
        largo: 24,
        semilla: 44,
        senaPct: 50,
        ocupacion: { A: 1, B: 1, C: 0.6 },
        sectores: [
          { id: "A", nombre: "Norte", x: 2, y: 2, cols: 12, rows: 1, vehiculo: "auto" },
          { id: "B", nombre: "Sur", x: 2, y: 13, cols: 12, rows: 1, vehiculo: "auto" },
          { id: "C", nombre: "Motos", x: 2, y: 19.5, cols: 14, rows: 1, vehiculo: "moto" },
        ],
        reglas: [
          { id: "r1", tipo: "evento", nombre: "Recital en el Movistar Arena", activa: true, sectores: ["A", "B", "C"], dias: [], fecha: HOY, desde: "16:00", hasta: "23:59", modo: "pct", valor: 60 },
        ],
      }),
    },
    {
      meta: {
        id: "cochera-juan-b-justo",
        nombre: "Cochera Juan B. Justo",
        direccion: "Av. Juan B. Justo 1960",
        barrio: "Palermo Hollywood",
        ubicacion: { lat: -34.5837, lng: -58.4371 },
        servicios: ["techado", "24h", "seguridad", "pmr"],
        calificacion: 4.8,
        telefono: "11 4776-5555",
        toleranciaMin: 15,
        reservaMaxHoras: 12,
        medios: MEDIOS_TODOS,
      },
      datos: tablero("Cochera Juan B. Justo", {
        ancho: 34,
        largo: 22,
        semilla: 55,
        senaPct: 20,
        ocupacion: { A: 0.6, B: 0.45, C: 0.3, D: 0.5 },
        pisos: [
          { id: "p0", nombre: "Planta baja" },
          { id: "p1", nombre: "Subsuelo" },
        ],
        sectores: [
          { id: "A", nombre: "Planta baja", x: 2, y: 2, cols: 10, rows: 1, vehiculo: "auto", tarifaId: "tec" },
          { id: "B", nombre: "Camionetas", x: 2, y: 14, cols: 6, rows: 1, vehiculo: "camioneta" },
          { id: "C", nombre: "Subsuelo norte", x: 2, y: 2, cols: 10, rows: 1, vehiculo: "auto", pisoId: "p1" },
          { id: "D", nombre: "Subsuelo sur", x: 2, y: 14, cols: 10, rows: 1, vehiculo: "auto", pisoId: "p1" },
        ],
        objetos: [
          { id: "o1", pisoId: "p0", tipo: "rampa", label: "Rampa al subsuelo", x: 24, y: 14, w: 6, h: 5 },
          { id: "o2", pisoId: "p1", tipo: "rampa", label: "Rampa a planta baja", x: 28, y: 9, w: 5, h: 4 },
        ],
      }),
    },
    {
      meta: {
        id: "parking-medrano",
        nombre: "Parking Medrano",
        direccion: "Medrano 940",
        barrio: "Almagro",
        ubicacion: { lat: -34.5978, lng: -58.4214 },
        servicios: ["24h"],
        calificacion: 4.1,
        telefono: "11 4862-6666",
        toleranciaMin: 15,
        reservaMaxHoras: 12,
        medios: MEDIOS_TODOS,
      },
      datos: tablero("Parking Medrano", {
        ancho: 30,
        largo: 20,
        semilla: 66,
        senaPct: 15,
        ocupacion: { A: 0.7, B: 0.6 },
        precios: { std: 1800 },
        sectores: [
          { id: "A", nombre: "Calle", x: 2, y: 1.5, cols: 10, rows: 1, vehiculo: "auto" },
          { id: "B", nombre: "Fondo", x: 2, y: 13, cols: 10, rows: 1, vehiculo: "auto", rot: false },
        ],
      }),
    },
    {
      meta: {
        id: "motos-thames",
        nombre: "Guardería de motos Thames",
        direccion: "Thames 1120",
        barrio: "Palermo",
        ubicacion: { lat: -34.5933, lng: -58.4300 },
        abre: 8 * 60,
        cierra: 22 * 60,
        servicios: ["techado", "seguridad"],
        calificacion: 4.6,
        telefono: "11 4899-7777",
        toleranciaMin: 15,
        reservaMaxHoras: 10,
        medios: ["mercadopago"],
      },
      datos: tablero("Guardería de motos Thames", {
        ancho: 22,
        largo: 12,
        semilla: 77,
        senaPct: 0,
        ocupacion: { A: 0.5 },
        sectores: [{ id: "A", nombre: "Motos", x: 2, y: 2, cols: 14, rows: 2, vehiculo: "moto" }],
      }),
    },
  ];
}
