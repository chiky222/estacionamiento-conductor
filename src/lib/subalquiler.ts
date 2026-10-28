/**
 * Subalquiler de abonos: el abonado cede su plaza en las franjas que no la usa, el estacionamiento la alquila
 * y el abonado se lleva `pctAbonado` % de lo cobrado como crédito para su próximo pago.
 * Lo habilita el gestor (Configuracion.subalquiler). Archivo compartido con la app del conductor: mantenerlos iguales.
 */
import type { Cesion, Configuracion, Plaza, Subalquiler } from "@/lib/types";

export const SUBALQUILER_POR_DEFECTO: Subalquiler = { habilitado: false, pctAbonado: 50 };

export const subalquilerDe = (c: Configuracion): Subalquiler => c.subalquiler ?? SUBALQUILER_POR_DEFECTO;

export const subalquilerHabilitado = (c: Configuracion) => !!c.subalquiler?.habilitado;

/** Cesión de la plaza que está corriendo en ese momento, si hay. */
export const cesionEn = (p: Plaza, fecha: string, minuto: number): Cesion | undefined =>
  p.abono?.cesiones?.find((c) => c.fecha === fecha && c.desde <= minuto && minuto < c.hasta);

/** Cesión que cubre entera la franja `desde`-`hasta` de una fecha (para reservar dentro de ella). */
export const cesionQueCubre = (p: Plaza, fecha: string, desde: number, hasta: number): Cesion | undefined =>
  p.abono?.cesiones?.find((c) => c.fecha === fecha && c.desde <= desde && hasta <= c.hasta);

/** La plaza es de un abonado ausente y está cedida en ese momento: se puede usar como una libre. */
export const cedidaYLibre = (p: Plaza, c: Configuracion, fecha: string, minuto: number) =>
  subalquilerHabilitado(c) && p.estado === "reservada" && !!p.abono && !!cesionEn(p, fecha, minuto);

/** Si una franja nueva se pisa con otra del mismo día. */
export const cesionSuperpuesta = (cesiones: Cesion[], fecha: string, desde: number, hasta: number) =>
  cesiones.some((c) => c.fecha === fecha && desde < c.hasta && c.desde < hasta);

/** Parte del abonado de un cobro, redondeada a $10. */
export const parteAbonado = (monto: number, pct: number) => Math.round((monto * pct) / 100 / 10) * 10;

/** Franjas de hoy en adelante, ordenadas. */
export const cesionesDesde = (cesiones: Cesion[] = [], fecha: string) =>
  cesiones.filter((c) => c.fecha >= fecha).sort((a, b) => (a.fecha === b.fecha ? a.desde - b.desde : a.fecha < b.fecha ? -1 : 1));
