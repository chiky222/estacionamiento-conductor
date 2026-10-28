/** Geometría del plano, estadísticas de ocupación y validación del layout. Funciones puras. */
import type { ClaseVehiculo, ClavePuerta, DatosTablero, Galpon, Objeto, Piso, Plaza, Sector, Seleccion } from "@/lib/types";
import { hoy } from "@/lib/format";
import { CLASES_VEHICULO, claseVehiculo, type Orientacion } from "@/lib/constants";

export const idPlaza = (s: Pick<Sector, "id">, fila: number, col: number) => `${s.id}-${fila}-${col}`;

export const parseIdPlaza = (id: string) => {
  const [sectorId, f, c] = id.split("-");
  return { sectorId, fila: +f, columna: +c };
};

/** Etiqueta visible: "B-03". */
export const etiquetaPlaza = (s: Sector, fila: number, col: number) =>
  `${s.id}-${String(fila * s.cols + col + 1).padStart(2, "0")}`;

export const plazaVacia = (s: Sector, fila: number, col: number): Plaza => ({
  id: idPlaza(s, fila, col),
  sectorId: s.id,
  fila,
  columna: col,
  estado: "libre",
  tipo: "std",
});

/** Si el sector creció y la plaza todavía no existe, se la trata como libre. */
export const plazaDe = (plazas: Record<string, Plaza>, s: Sector, fila: number, col: number) =>
  plazas[idPlaza(s, fila, col)] ?? plazaVacia(s, fila, col);

export const cantPlazas = (s: Sector) => s.cols * s.rows;

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Medidas del sector (en metros). w × h es el sector sin girar; fh es el alto de una fila y
 * `paso` la distancia entre plazas vecinas de una fila (igual a fw salvo en espiga).
 * En espiga cada plaza bw × bl se inclina `espiga` grados: las vecinas se tocan por el lado largo
 * (bw / cos) o, muy inclinadas, por la punta (bl / sen); `ext` es el ancho que ocupa una plaza inclinada.
 * Si tiene ángulo, el sector gira sobre su centro y `caja` es el rectángulo que ocupa en el plano
 * (lo que se usa para superposiciones, límites del galpón y arrastre).
 */
export function geometriaSector(s: Sector) {
  const inclinacion = s.espiga ?? 0;
  let fw = s.rot ? s.bl : s.bw;
  let fh = s.rot ? s.bw : s.bl;
  let paso = fw;
  let ext = fw;
  if (inclinacion) {
    const a = (Math.abs(inclinacion) * Math.PI) / 180;
    const sen = Math.sin(a);
    const cos = Math.cos(a);
    paso = r2(Math.min(cos > 1e-6 ? s.bw / cos : Infinity, sen > 1e-6 ? s.bl / sen : Infinity));
    ext = r2(s.bw * cos + s.bl * sen);
    fh = r2(s.bl * cos + s.bw * sen);
    fw = paso;
  }
  // La separación se suma entre plazas vecinas (no en los bordes): entre columnas y entre filas.
  const sep = s.sep ?? 0;
  paso = r2(paso + sep);
  const pasoFila = r2(fh + sep);
  const w = r2((s.cols - 1) * paso + ext);
  const h = r2((s.rows - 1) * pasoFila + fh);
  const ang = ((s.angulo ?? 0) % 360 + 360) % 360;
  const rad = (ang * Math.PI) / 180;
  const cw = Math.round((Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) * 100) / 100;
  const ch = Math.round((Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))) * 100) / 100;
  const caja = { x: s.x + (w - cw) / 2, y: s.y + (h - ch) / 2, w: cw, h: ch };
  return { fw, fh, paso, pasoFila, sep, ext, w, h, ang, caja, inclinacion };
}

/** Centro de una plaza en metros, dentro del sector sin girar. */
export function centroPlaza(s: Sector, fila: number, col: number) {
  const g = geometriaSector(s);
  return { x: s.x + g.ext / 2 + col * g.paso, y: s.y + g.fh / 2 + fila * g.pasoFila };
}

/** Clase de vehículo del sector; los datos viejos no la tienen y se deduce del ancho de plaza. */
export const claseSector = (s: Sector): ClaseVehiculo => s.vehiculo ?? (s.bw < 1.6 ? "moto" : "auto");

/** Qué vehículos pueden entrar en las plazas de un sector: los de su clase o más chicos (según `orden`). */
export function vehiculosPermitidos(s: Sector): ClaseVehiculo[] {
  const tope = claseVehiculo(claseSector(s)).orden;
  return CLASES_VEHICULO.filter((c) => c.orden <= tope).map((c) => c.value);
}

/** Orientación tal como se muestra en el formulario. */
export const orientacionSector = (s: Sector): Orientacion =>
  s.espiga ? "espiga" : (s.angulo ?? 0) % 360 !== 0 ? "rotado" : s.rot ? "horizontal" : "vertical";

export function recorrerPlazas(s: Sector, plazas: Record<string, Plaza>, fn: (p: Plaza, fila: number, col: number) => void) {
  for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) fn(plazaDe(plazas, s, r, c), r, c);
}

export interface Conteo {
  ocupadas: number;
  reservadas: number;
  bloqueadas: number;
  libres: number;
  total: number;
}

export function conteoSector(s: Sector, plazas: Record<string, Plaza>): Conteo {
  const t: Conteo = { ocupadas: 0, reservadas: 0, bloqueadas: 0, libres: 0, total: cantPlazas(s) };
  recorrerPlazas(s, plazas, (p) => {
    if (p.estado === "ocupada") t.ocupadas++;
    else if (p.estado === "reservada") t.reservadas++;
    else if (p.estado === "bloqueada") t.bloqueadas++;
    else t.libres++;
  });
  return t;
}

export function conteoTotal(d: Pick<DatosTablero, "sectores" | "plazas">): Conteo {
  const t: Conteo = { ocupadas: 0, reservadas: 0, bloqueadas: 0, libres: 0, total: 0 };
  d.sectores.forEach((s) => {
    const x = conteoSector(s, d.plazas);
    t.ocupadas += x.ocupadas;
    t.reservadas += x.reservadas;
    t.bloqueadas += x.bloqueadas;
    t.libres += x.libres;
    t.total += x.total;
  });
  return t;
}

/** Días de atraso del abono (0 si está al día o no tiene abono). */
export function diasDeMora(p: Plaza) {
  if (!p.abono) return 0;
  const vence = new Date(p.abono.vence + "T00:00:00");
  const d = Math.floor((hoy().getTime() - vence.getTime()) / 864e5);
  return d > 0 ? d : 0;
}

interface ItemLayout {
  id: string;
  pisoId?: string;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function itemsLayout(sectores: Sector[], objetos: Objeto[]): ItemLayout[] {
  return [
    ...sectores.map((s) => {
      const { caja } = geometriaSector(s);
      return { id: s.id, pisoId: s.pisoId, nombre: "Sector " + s.id, ...caja };
    }),
    ...objetos.map((o) => ({ id: o.id, pisoId: o.pisoId, nombre: o.label || "Objeto", x: o.x, y: o.y, w: o.w, h: o.h })),
  ];
}

/** Elementos que se superponen o se salen del galpón. */
export function conflictos(galpon: Galpon, sectores: Sector[], objetos: Objeto[]) {
  const ids = new Set<string>();
  const mensajes: { texto: string; ids: string[] }[] = [];
  const it = itemsLayout(sectores, objetos);
  const e = 1e-6;
  it.forEach((a) => {
    if (a.x < -e || a.y < -e || a.x + a.w > galpon.ancho + e || a.y + a.h > galpon.largo + e) {
      ids.add(a.id);
      mensajes.push({ texto: a.nombre + " sale del galpón", ids: [a.id] });
    }
  });
  for (let i = 0; i < it.length; i++)
    for (let j = i + 1; j < it.length; j++) {
      const a = it[i];
      const b = it[j];
      // Cada piso es un plano aparte: lo de pisos distintos nunca choca.
      if (a.pisoId !== b.pisoId) continue;
      if (a.x < b.x + b.w - e && b.x < a.x + a.w - e && a.y < b.y + b.h - e && b.y < a.y + a.h - e) {
        ids.add(a.id);
        ids.add(b.id);
        mensajes.push({ texto: `${a.nombre} se superpone con ${b.nombre}`, ids: [a.id, b.id] });
      }
    }
  return { ids, mensajes };
}

/** Primer lugar libre (en pasos de 0,5 m) donde entra un rectángulo de w × h. */
export function buscarLugar(galpon: Galpon, sectores: Sector[], objetos: Objeto[], w: number, h: number) {
  const it = itemsLayout(sectores, objetos);
  const choca = (x: number, y: number) => it.some((a) => x < a.x + a.w && a.x < x + w && y < a.y + a.h && a.y < y + h);
  for (let y = 0; y <= galpon.largo - h; y += 0.5)
    for (let x = 0; x <= galpon.ancho - w; x += 0.5) if (!choca(x, y)) return { x, y };
  return { x: 0, y: 0 };
}

export const limitarPuerta = (galpon: Galpon, lado: string, pos: number) => {
  const largo = lado === "izq" || lado === "der" ? galpon.largo : galpon.ancho;
  return Math.round(Math.max(2, Math.min(Math.max(2, largo - 2), pos)) * 100) / 100;
};

/* ====== pisos ====== */

/** Pisos de abajo hacia arriba. */
export const pisosOrdenados = (pisos: Piso[]) => [...pisos].sort((a, b) => a.orden - b.orden);

/** Piso donde está cada puerta: el indicado o, si no, el más bajo. */
export const pisoDePuerta = (d: Pick<DatosTablero, "galpon" | "pisos">, clave: ClavePuerta) =>
  d.galpon.puertas[clave].pisoId ?? pisosOrdenados(d.pisos)[0]?.id;

/** Piso al que pertenece lo seleccionado (para mostrar ese piso en el plano). */
export function pisoDeSeleccion(d: DatosTablero, sel: Seleccion | null): string | undefined {
  if (!sel) return undefined;
  if (sel.tipo === "puerta") return pisoDePuerta(d, sel.id);
  if (sel.tipo === "objeto") return d.objetos.find((o) => o.id === sel.id)?.pisoId;
  const sectorId = sel.tipo === "sector" ? sel.id : parseIdPlaza(sel.id).sectorId;
  return d.sectores.find((s) => s.id === sectorId)?.pisoId;
}

/** Sectores y objetos de un piso. */
export const delPiso = <T extends { pisoId: string }>(lista: T[], pisoId: string) => lista.filter((x) => x.pisoId === pisoId);
