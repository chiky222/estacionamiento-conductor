/** Datos de ejemplo del "Galpón Central". Solo los usa la API simulada. */
import type { DatosTablero, Plaza } from "@/lib/types";
import { hoy, isoFecha, sumarDias } from "@/lib/format";
import { idPlaza } from "@/lib/plano";
import { cobroDesde, tarifaEn } from "@/lib/tarifas";

/** Generador pseudoaleatorio con semilla: el ejemplo sale siempre igual. */
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

function patenteAzar(r: () => number, moto: boolean) {
  const L = "ABCDEFGHJKLMNPRSTVWXYZ";
  const l = () => L[Math.floor(r() * L.length)];
  const d = () => Math.floor(r() * 10);
  return moto ? `${d()}${d()}${d()} ${l()}${l()}${l()}` : `${l()}${l()} ${d()}${d()}${d()} ${l()}${l()}`;
}

export function datosDeEjemplo(): DatosTablero {
  const HOY = hoy();
  const d: DatosTablero = {
    turno: { nombre: "Turno tarde", sede: "Galpón Central", cajaBase: 98500 },
    configuracion: { senaPct: 0 },
    galpon: { ancho: 40, largo: 26, puertas: { ent: { lado: "izq", pos: 13.5 }, sal: { lado: "der", pos: 13.5 } } },
    tarifas: [
      { id: "std", nombre: "Rotativo estándar", hora: 2000, fraccion: 30, tope: 14000, mensual: 95000 },
      { id: "tec", nombre: "Techado", hora: 2800, fraccion: 30, tope: 18000, mensual: 120000 },
      { id: "moto", nombre: "Moto", hora: 900, fraccion: 30, tope: 6000, mensual: 38000 },
      { id: "vip", nombre: "Preferencial", hora: 4000, fraccion: 15, tope: 28000, mensual: 210000 },
    ],
    pisos: [
      { id: "p0", nombre: "Planta baja", orden: 0 },
      { id: "p1", nombre: "Piso 1", orden: 1 },
    ],
    sectores: [
      { id: "A", pisoId: "p0", nombre: "Techado abonados", x: 2, y: 2, cols: 10, rows: 2, bw: 2.5, bl: 5, rot: false, vehiculo: "auto", tarifaId: "tec", tipo: "mixto", color: 0 },
      { id: "B", pisoId: "p0", nombre: "Rotativo sur", x: 2, y: 15, cols: 8, rows: 2, bw: 2.5, bl: 5, rot: false, vehiculo: "auto", tarifaId: "std", tipo: "rotativo", color: 1 },
      { id: "C", pisoId: "p0", nombre: "Motos", x: 24, y: 15, cols: 10, rows: 2, bw: 1.2, bl: 2.5, rot: false, vehiculo: "moto", tarifaId: "moto", tipo: "rotativo", color: 2 },
      { id: "D", pisoId: "p0", nombre: "Preferencial camionetas", x: 28.5, y: 2, cols: 3, rows: 2, bw: 3, bl: 5.5, rot: false, vehiculo: "camioneta", tarifaId: "vip", tipo: "rotativo", color: 3 },
      { id: "E", pisoId: "p1", nombre: "Nivel 1 norte", x: 2, y: 2, cols: 12, rows: 2, bw: 2.5, bl: 5, rot: false, vehiculo: "auto", tarifaId: "std", tipo: "rotativo", color: 4 },
      { id: "F", pisoId: "p1", nombre: "Nivel 1 sur (espiga)", x: 2, y: 15, cols: 6, rows: 2, bw: 2.5, bl: 5, rot: false, espiga: 45, vehiculo: "auto", tarifaId: "std", tipo: "rotativo", color: 5 },
    ],
    objetos: [
      { id: "o1", pisoId: "p0", tipo: "oficina", label: "Oficina", x: 24, y: 21, w: 8, h: 4 },
      { id: "o2", pisoId: "p0", tipo: "banos", label: "Baños", x: 34, y: 21, w: 5, h: 4 },
      { id: "o3", pisoId: "p1", tipo: "rampa", label: "Rampa a planta baja", x: 34, y: 2, w: 5, h: 4 },
      { id: "o4", pisoId: "p1", tipo: "zona", label: "Local en obra", x: 26, y: 15, w: 12, h: 9 },
    ],
    reglas: [
      { id: "r1", tipo: "horario", nombre: "Tarifa nocturna", activa: true, sectores: ["A", "B", "D"], dias: [], desde: "22:00", hasta: "06:59", modo: "pct", valor: -30 },
      { id: "r2", tipo: "horario", nombre: "Fin de semana", activa: true, sectores: ["B", "D"], dias: [0, 6], desde: "00:00", hasta: "23:59", modo: "pct", valor: 15 },
      { id: "r3", tipo: "evento", nombre: "Show en el estadio · general", activa: true, sectores: ["B"], dias: [], fecha: isoFecha(HOY), desde: "18:00", hasta: "23:59", modo: "unica", valor: 9000 },
      { id: "r5", tipo: "evento", nombre: "Show en el estadio · preferencial", activa: true, sectores: ["D"], dias: [], fecha: isoFecha(HOY), desde: "18:00", hasta: "23:59", modo: "unica", valor: 16000 },
      { id: "r4", tipo: "evento", nombre: "Partido de local", activa: true, sectores: ["A", "B", "C", "D", "E", "F"], dias: [], fecha: isoFecha(sumarDias(HOY, 2)), desde: "15:00", hasta: "21:00", modo: "pct", valor: 30 },
    ],
    plazas: {},
    movimientos: [
      { id: "m1", minuto: 1168, tipo: "ingreso", detalle: "AF 314 JM · B-10", monto: 0 },
      { id: "m2", minuto: 1160, tipo: "cobro", detalle: "Salida PL 902 KC · B-06", monto: 8400 },
      { id: "m3", minuto: 1152, tipo: "ingreso", detalle: "AD 771 RT · D-01", monto: 0 },
      { id: "m4", minuto: 1140, tipo: "cobro", detalle: "Salida 118 OBN · C-04", monto: 2700 },
      { id: "m5", minuto: 1131, tipo: "cobro", detalle: "Salida AE 640 BV · B-12", monto: 12000 },
      { id: "m6", minuto: 1120, tipo: "ingreso", detalle: "441 ACH · C-11", monto: 0 },
      { id: "m7", minuto: 1105, tipo: "cobro", detalle: "Pago de abono · Silva · A-09", monto: 120000 },
      { id: "m8", minuto: 1092, tipo: "egreso", detalle: "MK 205 PS · A-06", monto: 0 },
    ],
  };

  const r = rng(77);
  const nombres = ["M. Rodríguez", "L. Fernández", "S. Gómez", "J. Pérez", "C. Díaz", "A. Romero", "V. Sosa", "N. Acosta", "D. Benítez", "F. Molina", "R. Silva", "E. Castro", "P. Ríos", "G. Luna", "T. Vega", "H. Ortiz"];
  const ocupadas: Record<string, number[]> = {
    A: [0, 1, 2, 4, 5, 7, 8, 10, 11, 13, 14],
    B: [0, 1, 3, 4, 6, 9, 10, 13, 15],
    C: [0, 1, 2, 5, 6, 7, 10, 11, 12, 14, 16, 18],
    D: [0, 3, 4],
    E: [0, 2, 3, 5, 8, 9, 13, 14, 17, 20],
    F: [1, 2, 6, 9, 10],
  };
  const ingresosB = [452, 478, 505, 520, 612, 688, 1115, 1135, 1150];
  const ingresosD = [1090, 1125, 1145];
  const momentoHoy = (minuto: number) => ({ fecha: isoFecha(HOY), dow: HOY.getDay(), minuto });

  d.sectores.forEach((sec) => {
    const n = sec.cols * sec.rows;
    const moto = sec.id === "C";
    for (let i = 0; i < n; i++) {
      const fila = Math.floor(i / sec.cols);
      const col = i % sec.cols;
      const p: Plaza = { id: idPlaza(sec, fila, col), sectorId: sec.id, fila, columna: col, estado: "libre", tipo: "std" };
      const k = ocupadas[sec.id]?.indexOf(i) ?? -1;
      if (sec.id === "A") {
        if (i === 0) p.tipo = "pmr";
        if (i < 16) {
          p.abono = { vence: isoFecha(sumarDias(HOY, i === 3 ? -6 : i === 11 ? -2 : 5 + i * 2)), precio: 120000 };
          // Lugares cedidos (subalquiler): A-07 está cedido hoy y A-10 es del usuario de la app del conductor.
          if (i === 6) p.abono.cesiones = [{ id: "c-a07-hoy", fecha: isoFecha(HOY), desde: 480, hasta: 1439 }];
          if (i === 9)
            Object.assign(p.abono, {
              usuarioId: "u-demo",
              credito: 8400,
              cesiones: [
                { id: "c-a10-ayer", fecha: isoFecha(sumarDias(HOY, -1)), desde: 540, hasta: 1080, cobrado: 16800 },
                { id: "c-a10-man", fecha: isoFecha(sumarDias(HOY, 1)), desde: 540, hasta: 1080 },
              ],
            });
          p.cliente = nombres[i];
          p.patente = patenteAzar(r, false);
          p.vehiculo = "auto";
          if (k >= 0) {
            p.estado = "ocupada";
            p.desde = 390 + Math.floor(r() * 180);
          } else p.estado = "reservada";
        } else if (i === 19) {
          p.estado = "bloqueada";
          p.motivo = "Gotera en el techo";
        }
      } else {
        if (k >= 0) {
          p.estado = "ocupada";
          p.patente = patenteAzar(r, moto);
          // En el sector de camionetas también estaciona algún auto.
          p.vehiculo = moto ? "moto" : sec.id === "D" && k !== 1 ? "camioneta" : "auto";
          p.cliente = "";
          p.desde = sec.id === "B" ? ingresosB[k] : sec.id === "D" ? ingresosD[k] : 480 + Math.floor(r() * 620);
          p.cobro = cobroDesde(tarifaEn(d.tarifas, d.reglas, sec, momentoHoy(p.desde)));
        }
        if (sec.id === "B") {
          if (i === 2) Object.assign(p, { estado: "reservada", cliente: "Reserva web · Pérez", hasta: 1185 });
          if (i === 11) Object.assign(p, { estado: "reservada", cliente: "Reserva web · Duarte", hasta: 1230 });
          if (i === 7) Object.assign(p, { estado: "bloqueada", motivo: "Mancha de aceite" });
          if (i === 14 || i === 15) p.tipo = "ev";
        }
        if (sec.id === "D" && (i === 1 || i === 5)) Object.assign(p, { estado: "reservada", cliente: "Reserva show", hasta: 1200 });
      }
      d.plazas[p.id] = p;
    }
  });
  return d;
}
