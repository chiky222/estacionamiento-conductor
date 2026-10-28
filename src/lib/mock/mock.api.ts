/**
 * API simulada en el navegador para la app del conductor. Implementa los endpoints de docs/CONTRATO.md
 * con los estacionamientos de ejemplo de mock.seed.ts. Los datos viven en localStorage.
 * Cuando el back esté listo, se pone NEXT_PUBLIC_API_MODE=api y este archivo deja de cargarse.
 */
import type { ClaseVehiculo, Momento, Plaza, Sector } from "@/lib/types";
import type {
  Cotizacion,
  EstacionamientoDetalle,
  EstacionamientoResumen,
  MedioPago,
  ModalidadPago,
  Pago,
  PlazaPublica,
  Reserva,
  TarifaSector,
  Ubicacion,
  UsuarioSesion,
} from "@/lib/conductor.types";
import { ApiError } from "@/lib/errors";
import { CLASES_VEHICULO } from "@/lib/constants";
import { hhmm, isoFecha } from "@/lib/format";
import { etiquetaPlaza, parseIdPlaza, plazaVacia, recorrerPlazas, vehiculosPermitidos } from "@/lib/plano";
import { costoEntre, eventosActivos, senaDeReserva, tarifaDeSector, tarifaEn } from "@/lib/tarifas";
import { normalizarPatente } from "@/lib/patente";
import { distanciaM, estadoDisponibilidad } from "@/lib/conductor";
import { CENTRO_DEMO, estacionamientosDeEjemplo, type EstacionamientoMock } from "@/lib/mock/mock.seed";

const CLAVE = "conductor-mock-v1";
const LATENCIA_MS = 220;
/** Minutos que se retiene el lugar mientras se completa un pago externo. */
const RETENCION_MIN = 10;

/** El "factory" de pasarelas visto desde el front: cada medio lo resuelve una pasarela. */
const MEDIOS_PAGO: MedioPago[] = [
  { id: "mercadopago", pasarela: "mercadopago", nombre: "Mercado Pago", descripcion: "Dinero en cuenta, tarjetas guardadas o cuotas", flujo: "redireccion" },
  { id: "tarjeta", pasarela: "mercadopago", nombre: "Tarjeta de crédito o débito", descripcion: "Visa, Mastercard, American Express, Naranja, Cabal", flujo: "tarjeta", marcas: ["Visa", "Mastercard", "Amex", "Naranja", "Cabal"] },
  { id: "modo", pasarela: "modo", nombre: "MODO", descripcion: "Pagá con QR desde la app de tu banco", flujo: "qr" },
];

type ReservaMock = Reserva & { usuarioId: string };
/** Plaza del tablero con la reserva de la app que la ocupa (el back la vincula igual). */
type PlazaApp = Plaza & { reservaId?: string };
type PagoMock = Pago;

interface Db {
  estacionamientos: EstacionamientoMock[];
  reservas: ReservaMock[];
  pagos: Record<string, PagoMock>;
  /** Idempotency-Key → id de reserva. */
  idempotencia: Record<string, string>;
  usuario: UsuarioSesion | null;
}

let db: Db | null = null;

function cargar(): Db {
  if (db) return db;
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) db = JSON.parse(raw) as Db;
  } catch {
    // localStorage puede no estar disponible (modo privado): seguimos en memoria.
  }
  if (!db) {
    db = { estacionamientos: estacionamientosDeEjemplo(), reservas: [], pagos: {}, idempotencia: {}, usuario: null };
    guardar();
  }
  return db;
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(db));
  } catch {
    // Sin persistencia: los cambios duran hasta recargar.
  }
}

const nuevoId = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1000);
const clon = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const err = (status: number, code: string) => new ApiError(status, code, "mock-" + nuevoId(""));
const codigoCorto = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

const momentoDe = (d: Date): Momento => ({ fecha: isoFecha(d), dow: d.getDay(), minuto: d.getHours() * 60 + d.getMinutes() });

function buscarEst(id: string) {
  const e = cargar().estacionamientos.find((x) => x.meta.id === id);
  if (!e) throw err(404, "NOT_FOUND");
  return e;
}

const abiertoEn = (e: EstacionamientoMock, m: number) => e.meta.abre == null || (m >= e.meta.abre && m <= (e.meta.cierra ?? 1439));
const textoHorario = (e: EstacionamientoMock) => (e.meta.abre == null ? "Abierto 24 h" : `${hhmm(e.meta.abre)} a ${hhmm(e.meta.cierra ?? 1439)}`);

/** Precio vigente de cada sector en un momento. */
function tarifasEn(e: EstacionamientoMock, m: Momento): TarifaSector[] {
  const d = e.datos;
  return d.sectores.map((s) => {
    const ef = tarifaEn(d.tarifas, d.reglas, s, m);
    return { sectorId: s.id, nombre: s.nombre, modo: ef.modo, valor: ef.valor, base: ef.base, fraccion: ef.tarifa.fraccion, tope: ef.tarifa.tope, reglas: ef.aplicadas.map((r) => r.nombre) };
  });
}

function resumen(e: EstacionamientoMock, vehiculo: ClaseVehiculo, cerca?: Ubicacion): EstacionamientoResumen {
  const d = e.datos;
  const ahora = new Date();
  const m = momentoDe(ahora);
  const disp = Object.fromEntries(CLASES_VEHICULO.map((c) => [c.value, { libres: 0, total: 0 }])) as EstacionamientoResumen["disponibilidad"];
  d.sectores.forEach((s) => {
    const permitidos = vehiculosPermitidos(s);
    recorrerPlazas(s, d.plazas, (p) => {
      if (p.estado === "bloqueada") return;
      permitidos.forEach((v) => {
        disp[v].total++;
        if (p.estado === "libre") disp[v].libres++;
      });
    });
  });
  const tarifas = tarifasEn(e, m);
  const compatibles = tarifas.filter((t) => vehiculosPermitidos(d.sectores.find((s) => s.id === t.sectorId)!).includes(vehiculo));
  const base = compatibles.length ? compatibles : tarifas;
  const masBarata = base.reduce((a, b) => (b.valor < a.valor ? b : a), base[0]);
  const abierto = abiertoEn(e, m.minuto);
  return {
    id: e.meta.id,
    nombre: e.meta.nombre,
    direccion: e.meta.direccion,
    barrio: e.meta.barrio,
    ubicacion: e.meta.ubicacion,
    horario: textoHorario(e),
    abierto,
    precioDesde: { modo: masBarata.modo, valor: masBarata.valor },
    disponibilidad: disp,
    estado: abierto ? estadoDisponibilidad(disp[vehiculo].libres, disp[vehiculo].total) : "sold_out",
    senaPct: d.configuracion.senaPct,
    servicios: e.meta.servicios,
    calificacion: e.meta.calificacion,
    evento: eventosActivos(d.reglas, m)[0]?.nombre,
    distancia: cerca ? Math.round(distanciaM(cerca, e.meta.ubicacion)) : undefined,
  };
}

/** Plaza vista desde afuera: sin patente, cliente ni horarios. */
function plazasPublicas(e: EstacionamientoMock) {
  const out: Record<string, PlazaPublica> = {};
  e.datos.sectores.forEach((s) =>
    recorrerPlazas(s, e.datos.plazas, (p) => {
      out[p.id] = {
        id: p.id,
        sectorId: p.sectorId,
        fila: p.fila,
        columna: p.columna,
        tipo: p.tipo,
        estado: p.estado === "libre" ? "libre" : p.estado === "ocupada" ? "ocupada" : "no_disponible",
        ...(p.estado === "ocupada" ? { vehiculo: p.vehiculo } : {}),
      };
    }),
  );
  return out;
}

/* ====== cotización y reservas ====== */

interface PedidoCotizacion {
  plazaId: string;
  vehiculo: ClaseVehiculo;
  desde: string;
  hasta: string;
}

function validarPedido(e: EstacionamientoMock, b: PedidoCotizacion) {
  const desde = new Date(b.desde);
  const hasta = new Date(b.hasta);
  const minutos = Math.round((hasta.getTime() - desde.getTime()) / 60000);
  const ahora = Date.now();
  if (Number.isNaN(minutos) || minutos < 30 || minutos > e.meta.reservaMaxHoras * 60) throw err(400, "HORARIO_INVALIDO");
  if (desde.getTime() < ahora - 15 * 60000 || desde.getTime() > ahora + 24 * 3600000) throw err(400, "HORARIO_INVALIDO");
  if (!abiertoEn(e, momentoDe(desde).minuto)) throw err(409, "ESTACIONAMIENTO_CERRADO");
  const { sectorId, fila, columna } = parseIdPlaza(b.plazaId);
  const s = e.datos.sectores.find((x) => x.id === sectorId);
  if (!s || fila >= s.rows || columna >= s.cols) throw err(404, "NOT_FOUND");
  if (!vehiculosPermitidos(s).includes(b.vehiculo)) throw err(409, "VEHICULO_NO_ENTRA");
  return { s, desde, hasta, minutos };
}

function cotizar(e: EstacionamientoMock, b: PedidoCotizacion): Cotizacion & { sector: Sector } {
  const { s, desde, minutos } = validarPedido(e, b);
  const d = e.datos;
  const m = momentoDe(desde);
  // El precio se toma en la hora de llegada, igual que el tablero lo fija al ingresar.
  const ef = tarifaEn(d.tarifas, d.reglas, s, m);
  const t = tarifaDeSector(d.tarifas, s);
  const total = costoEntre(t, ef, m.minuto, m.minuto + minutos);
  const sena = senaDeReserva(d.configuracion.senaPct, t, ef, m.minuto, m.minuto + minutos);
  return {
    sector: s,
    plazaId: b.plazaId,
    desde: b.desde,
    hasta: b.hasta,
    minutos,
    precio: { modo: ef.modo, valor: ef.valor },
    reglas: ef.aplicadas.map((r) => r.nombre),
    total,
    senaPct: d.configuracion.senaPct,
    sena,
    saldo: total - sena,
  };
}

function usuarioActual() {
  const u = cargar().usuario;
  if (!u) throw err(401, "UNAUTHENTICATED");
  return u;
}

/** Ocupa la plaza en el tablero del gestor como una reserva más (estado "reservada"). */
function retenerPlaza(e: EstacionamientoMock, r: ReservaMock) {
  const d = e.datos;
  const { sectorId, fila, columna } = parseIdPlaza(r.plazaId);
  const s = d.sectores.find((x) => x.id === sectorId)!;
  const p = d.plazas[r.plazaId] ?? plazaVacia(s, fila, columna);
  if (p.estado !== "libre") throw err(409, "PLAZA_NO_DISPONIBLE");
  const reservada: PlazaApp = { ...p, estado: "reservada", cliente: `App · ${r.patente}`, patente: r.patente, hasta: momentoDe(new Date(r.hasta)).minuto, reservaId: r.id };
  d.plazas[r.plazaId] = reservada;
}

function liberarPlaza(e: EstacionamientoMock, r: ReservaMock) {
  const p = e.datos.plazas[r.plazaId];
  if (p && (p as PlazaApp).reservaId === r.id) e.datos.plazas[r.plazaId] = { id: p.id, sectorId: p.sectorId, fila: p.fila, columna: p.columna, estado: "libre", tipo: p.tipo };
}

/** Pago aprobado: la reserva queda confirmada y lo pagado se guarda como seña de la plaza (el tablero lo descuenta al cobrar). */
function aprobar(r: ReservaMock, monto: number) {
  const e = buscarEst(r.estacionamiento.id);
  r.estado = "confirmada";
  r.pagado = monto;
  r.saldo = Math.max(0, r.total - monto);
  delete r.retenidaHasta;
  const p = e.datos.plazas[r.plazaId];
  if (p) p.sena = monto;
  const ahora = momentoDe(new Date());
  e.datos.movimientos.unshift({ id: nuevoId("m"), minuto: ahora.minuto, tipo: "cobro", detalle: `${r.modalidad === "total" ? "Pago online" : "Seña online"} · ${r.patente} · ${r.plazaEtiqueta}`, monto });
}

/** Estados que dependen del reloj: retención vencida, reserva en curso o terminada. */
function actualizar(r: ReservaMock) {
  const ahora = Date.now();
  if (r.estado === "pendiente_pago" && r.retenidaHasta && new Date(r.retenidaHasta).getTime() < ahora) {
    r.estado = "vencida";
    liberarPlaza(buscarEst(r.estacionamiento.id), r);
  }
  if (r.estado === "confirmada" && new Date(r.hasta).getTime() < ahora) r.estado = "finalizada";
  return r;
}

function cobrar(r: ReservaMock, medio: MedioPago, monto: number, tokenTarjeta?: string): PagoMock {
  const pago: PagoMock = { id: nuevoId("pay"), reservaId: r.id, medioId: medio.id, pasarela: medio.pasarela, estado: "pendiente", monto };
  if (medio.flujo === "tarjeta") {
    if (!tokenTarjeta) throw err(400, "MEDIO_PAGO_INVALIDO");
    // Tarjeta de prueba terminada en 0002 = rechazada (como las tarjetas de test de las pasarelas).
    pago.estado = tokenTarjeta.endsWith("0002") ? "rechazado" : "aprobado";
  } else {
    pago.redirectUrl = `/pago/simulado?pago=${pago.id}`;
  }
  cargar().pagos[pago.id] = pago;
  r.pago = clon(pago);
  if (pago.estado === "aprobado") aprobar(r, monto);
  return pago;
}

type Body = Record<string, unknown>;
type Ruta = { metodo: string; patron: RegExp; h: (params: string[], body: Body, q: URLSearchParams, headers: Record<string, string>) => unknown };

const rutas: Ruta[] = [
  // Sesión
  { metodo: "GET", patron: /^\/api\/sesion\/actual$/, h: () => cargar().usuario },
  {
    metodo: "POST",
    patron: /^\/api\/sesion\/(login|registro|google-demo)$/,
    h: (_, b) => {
      const email = String(b.email ?? "conductor@ejemplo.com").trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw err(400, "INVALID_ARGUMENT");
      const nombre = String(b.nombre || email.split("@")[0]);
      cargar().usuario = { id: "u-demo", nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), email, rol: "conductor", patente: cargar().usuario?.patente };
      return cargar().usuario;
    },
  },
  {
    metodo: "POST",
    patron: /^\/api\/sesion\/logout$/,
    h: () => {
      cargar().usuario = null;
      return { ok: true };
    },
  },

  // Estacionamientos (públicos)
  {
    metodo: "GET",
    patron: /^\/api\/publico\/estacionamientos$/,
    h: (_, __, q) => {
      const vehiculo = (q.get("vehiculo") ?? "auto") as ClaseVehiculo;
      const cerca = q.get("lat") ? { lat: Number(q.get("lat")), lng: Number(q.get("lng")) } : CENTRO_DEMO;
      const radio = Number(q.get("radio") || 5000);
      return cargar()
        .estacionamientos.map((e) => resumen(e, vehiculo, cerca))
        // Fuera los que no tienen plazas para ese vehículo (ej. una guardería de motos si busca auto).
        .filter((r) => r.disponibilidad[vehiculo].total > 0 && (r.distancia ?? 0) <= radio && (!q.get("conLugar") || r.estado !== "sold_out"))
        // Más cerca primero, pero los llenos al final: es lo que el conductor no puede usar.
        .sort((a, b) => Number(a.estado === "sold_out") - Number(b.estado === "sold_out") || (a.distancia ?? 0) - (b.distancia ?? 0));
    },
  },
  {
    metodo: "GET",
    patron: /^\/api\/publico\/estacionamientos\/([^/]+)$/,
    h: ([id], _, q) => {
      const e = buscarEst(id);
      const vehiculo = (q.get("vehiculo") ?? "auto") as ClaseVehiculo;
      const desde = q.get("desde") ? new Date(q.get("desde")!) : new Date();
      const det: EstacionamientoDetalle = {
        ...resumen(e, vehiculo, CENTRO_DEMO),
        telefono: e.meta.telefono,
        toleranciaMin: e.meta.toleranciaMin,
        reservaMaxHoras: e.meta.reservaMaxHoras,
        plano: {
          galpon: e.datos.galpon,
          pisos: e.datos.pisos,
          sectores: e.datos.sectores,
          objetos: e.datos.objetos,
          plazas: plazasPublicas(e),
          tarifas: tarifasEn(e, momentoDe(desde)),
        },
      };
      return det;
    },
  },
  {
    metodo: "POST",
    patron: /^\/api\/publico\/estacionamientos\/([^/]+)\/cotizacion$/,
    h: ([id], b) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sector, ...c } = cotizar(buscarEst(id), b as unknown as PedidoCotizacion);
      return c;
    },
  },

  // Pagos
  {
    metodo: "GET",
    patron: /^\/api\/pagos\/medios$/,
    h: (_, __, q) => {
      const id = q.get("estacionamientoId");
      const habilitados = id ? buscarEst(id).meta.medios : MEDIOS_PAGO.map((m) => m.id);
      return MEDIOS_PAGO.filter((m) => habilitados.includes(m.id));
    },
  },
  {
    metodo: "GET",
    patron: /^\/api\/pagos\/([^/]+)$/,
    h: ([id]) => {
      const p = cargar().pagos[id];
      if (!p) throw err(404, "NOT_FOUND");
      return p;
    },
  },
  {
    // Hace de pasarela externa + webhook: en el back real lo confirma POST /api/pagos/webhook/:pasarela.
    metodo: "POST",
    patron: /^\/api\/demo\/pagos\/([^/]+)$/,
    h: ([id], b) => {
      const d = cargar();
      const p = d.pagos[id];
      if (!p) throw err(404, "NOT_FOUND");
      if (p.estado !== "pendiente") throw err(409, "PAGO_YA_PROCESADO");
      const r = d.reservas.find((x) => x.id === p.reservaId)!;
      actualizar(r);
      if (r.estado === "vencida") throw err(409, "RESERVA_VENCIDA");
      p.estado = b.aprobar ? "aprobado" : "rechazado";
      r.pago = clon(p);
      if (p.estado === "aprobado") aprobar(r, p.monto);
      return p;
    },
  },

  // Reservas
  {
    metodo: "POST",
    patron: /^\/api\/reservas$/,
    h: (_, b, __, headers) => {
      const u = usuarioActual();
      const d = cargar();
      const clave = headers["Idempotency-Key"];
      if (clave && d.idempotencia[clave]) {
        const r = d.reservas.find((x) => x.id === d.idempotencia[clave])!;
        return { reserva: r, pago: r.pago };
      }
      const e = buscarEst(String(b.estacionamientoId));
      const patente = normalizarPatente(String(b.patente ?? ""));
      if (!patente) throw err(400, "PATENTE_INVALIDA");
      const c = cotizar(e, b as unknown as PedidoCotizacion);
      const modalidad = (b.modalidad === "total" ? "total" : "sena") as ModalidadPago;
      const monto = modalidad === "total" ? c.total : c.sena;
      const medio = MEDIOS_PAGO.find((m) => m.id === b.medioPagoId && e.meta.medios.includes(m.id));
      if (monto > 0 && !medio) throw err(400, "MEDIO_PAGO_INVALIDO");
      const piso = e.datos.pisos.find((p) => p.id === c.sector.pisoId);
      const { fila, columna } = parseIdPlaza(c.plazaId);
      const r: ReservaMock = {
        id: nuevoId("res"),
        usuarioId: u.id,
        codigo: codigoCorto(),
        estacionamiento: { id: e.meta.id, nombre: e.meta.nombre, direccion: e.meta.direccion, ubicacion: e.meta.ubicacion },
        plazaId: c.plazaId,
        plazaEtiqueta: etiquetaPlaza(c.sector, fila, columna),
        sectorNombre: c.sector.nombre,
        pisoNombre: piso?.nombre ?? "",
        vehiculo: b.vehiculo as ClaseVehiculo,
        patente,
        desde: c.desde,
        hasta: c.hasta,
        toleranciaMin: e.meta.toleranciaMin,
        modalidad,
        total: c.total,
        sena: c.sena,
        pagado: 0,
        saldo: c.total,
        estado: "pendiente_pago",
        retenidaHasta: new Date(Date.now() + RETENCION_MIN * 60000).toISOString(),
        creadaEn: new Date().toISOString(),
      };
      retenerPlaza(e, r);
      d.reservas.unshift(r);
      if (clave) d.idempotencia[clave] = r.id;
      u.patente = patente;
      const pago = monto > 0 ? cobrar(r, medio!, monto, b.tokenTarjeta as string | undefined) : (aprobar(r, 0), undefined);
      return { reserva: r, pago };
    },
  },
  { metodo: "GET", patron: /^\/api\/reservas\/mias$/, h: () => cargar().reservas.filter((r) => r.usuarioId === usuarioActual().id).map(actualizar) },
  {
    metodo: "GET",
    patron: /^\/api\/reservas\/([^/]+)$/,
    h: ([id]) => {
      const r = cargar().reservas.find((x) => x.id === id && x.usuarioId === usuarioActual().id);
      if (!r) throw err(404, "NOT_FOUND");
      return actualizar(r);
    },
  },
  {
    metodo: "POST",
    patron: /^\/api\/reservas\/([^/]+)\/pago$/,
    h: ([id], b) => {
      const r = cargar().reservas.find((x) => x.id === id && x.usuarioId === usuarioActual().id);
      if (!r) throw err(404, "NOT_FOUND");
      actualizar(r);
      if (r.estado === "vencida") throw err(409, "RESERVA_VENCIDA");
      if (r.estado !== "pendiente_pago") throw err(409, "PAGO_YA_PROCESADO");
      const e = buscarEst(r.estacionamiento.id);
      const medio = MEDIOS_PAGO.find((m) => m.id === b.medioPagoId && e.meta.medios.includes(m.id));
      if (!medio) throw err(400, "MEDIO_PAGO_INVALIDO");
      const pago = cobrar(r, medio, r.modalidad === "total" ? r.total : r.sena, b.tokenTarjeta as string | undefined);
      return { reserva: r, pago };
    },
  },
  {
    metodo: "POST",
    patron: /^\/api\/reservas\/([^/]+)\/cancelar$/,
    h: ([id]) => {
      const r = cargar().reservas.find((x) => x.id === id && x.usuarioId === usuarioActual().id);
      if (!r) throw err(404, "NOT_FOUND");
      actualizar(r);
      // Se puede cancelar antes de la hora de llegada. La seña no se devuelve (misma regla del tablero).
      const cancelable = r.estado === "pendiente_pago" || (r.estado === "confirmada" && new Date(r.desde).getTime() > Date.now());
      if (!cancelable) throw err(409, "RESERVA_NO_CANCELABLE");
      r.reembolso = r.estado === "confirmada" ? Math.max(0, r.pagado - r.sena) : 0;
      r.estado = "cancelada";
      liberarPlaza(buscarEst(r.estacionamiento.id), r);
      return r;
    },
  },

  // Solo en la API simulada
  {
    metodo: "POST",
    patron: /^\/api\/demo\/reset$/,
    h: () => {
      const usuario = cargar().usuario;
      db = { estacionamientos: estacionamientosDeEjemplo(), reservas: [], pagos: {}, idempotencia: {}, usuario };
      return { ok: true };
    },
  },
];

export async function mockFetch<T>(metodo: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCIA_MS));
  const [ruta, qs] = path.split("?");
  const q = new URLSearchParams(qs ?? "");
  for (const r of rutas) {
    if (r.metodo !== metodo) continue;
    const m = ruta.match(r.patron);
    if (!m) continue;
    const res = r.h(m.slice(1).map(decodeURIComponent), (body ?? {}) as Body, q, headers);
    guardar();
    return clon(res) as T;
  }
  throw err(404, "NOT_FOUND");
}
