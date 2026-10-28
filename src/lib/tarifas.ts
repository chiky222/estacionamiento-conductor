/**
 * Cálculo de precios. Lo usa el front para mostrar previsualizaciones y la API simulada
 * para fijar el precio al ingresar. El back real debe replicar estas mismas reglas.
 */
import type { CobroFijado, Momento, Plaza, Regla, Sector, Tarifa } from "@/lib/types";
import { aMinutos, ars } from "@/lib/format";

export const tarifaDeSector = (tarifas: Tarifa[], s: Sector) => tarifas.find((t) => t.id === s.tarifaId) ?? tarifas[0];

export function reglaAplica(r: Regla, sectorId: string, m: Momento) {
  if (!r.activa || !r.sectores.includes(sectorId)) return false;
  const d = aMinutos(r.desde);
  const h = aMinutos(r.hasta);
  // Si "desde" es mayor que "hasta", la franja cruza la medianoche (ej. 22:00 a 06:59).
  const dentro = d <= h ? m.minuto >= d && m.minuto <= h : m.minuto >= d || m.minuto <= h;
  if (!dentro) return false;
  if (r.tipo === "evento") return r.fecha === m.fecha;
  return !r.dias.length || r.dias.includes(m.dow);
}

/** Aplica el efecto de una regla sobre un precio por hora. Redondea a $10. */
export const aplicarEfecto = (r: Pick<Regla, "modo" | "valor">, valor: number) =>
  r.modo === "pct" ? Math.round((valor * (1 + r.valor / 100)) / 10) * 10 : r.valor;

export interface TarifaEfectiva {
  modo: "hora" | "unica";
  valor: number;
  base: number;
  aplicadas: Regla[];
  tarifa: Tarifa;
}

export function tarifaEn(tarifas: Tarifa[], reglas: Regla[], s: Sector, m: Momento): TarifaEfectiva {
  const t = tarifaDeSector(tarifas, s);
  let modo: "hora" | "unica" = "hora";
  let valor = t.hora;
  // Los eventos se aplican después que las horarias: así las pisan.
  const aplicadas = reglas
    .filter((r) => reglaAplica(r, s.id, m))
    .sort((a, b) => (a.tipo === "evento" ? 1 : 0) - (b.tipo === "evento" ? 1 : 0));
  aplicadas.forEach((r) => {
    if (r.modo === "pct") valor = aplicarEfecto(r, valor);
    else if (r.modo === "hora") {
      modo = "hora";
      valor = r.valor;
    } else {
      modo = "unica";
      valor = r.valor;
    }
  });
  return { modo, valor, base: t.hora, aplicadas, tarifa: t };
}

export const cobroDesde = (ef: TarifaEfectiva): CobroFijado => ({
  modo: ef.modo,
  valor: ef.valor,
  base: ef.base,
  regla: ef.aplicadas.map((x) => x.nombre).join(", "),
});

export const textoTarifa = (ef: { modo: string; valor: number }) =>
  ef.modo === "unica" ? "Único " + ars(ef.valor) : ars(ef.valor) + "/h";

export const textoEfecto = (r: Pick<Regla, "modo" | "valor">) =>
  r.modo === "pct" ? (r.valor > 0 ? "+" : "") + r.valor + "%" : r.modo === "hora" ? ars(r.valor) + "/h" : "único " + ars(r.valor);

/** Costo de la estadía: por fracciones, con tope diario proporcional a la tarifa fijada. */
export function costoEstadia(t: Tarifa, p: Plaza, ahora: number) {
  const c = p.cobro;
  if (!c || p.desde == null) return 0;
  if (c.modo === "unica") return c.valor;
  const frac = t.fraccion || 30;
  const mins = Math.max(0, ahora - p.desde);
  const fracciones = Math.max(1, Math.ceil(mins / frac));
  const v = Math.round((((fracciones * frac) / 60) * c.valor) / 10) * 10;
  const tope = t.tope ? t.tope * (c.valor / (c.base || c.valor)) : Infinity;
  return Math.min(v, Math.round(tope / 10) * 10);
}

/** Costo de una estadía de `desde` a `hasta` (minutos del día) con la tarifa vigente; si `hasta` es menor, cruza la medianoche. */
export function costoEntre(t: Tarifa, ef: TarifaEfectiva, desde: number, hasta: number) {
  const fin = hasta > desde ? hasta : hasta + 1440;
  const p = { desde, cobro: cobroDesde(ef) } as Plaza;
  return costoEstadia(t, p, fin);
}

/** Seña de una reserva: `pct` % de lo que costaría la estadía reservada. Redondea a $10. */
export const senaDeReserva = (pct: number, t: Tarifa, ef: TarifaEfectiva, desde: number, hasta: number) =>
  pct > 0 ? Math.round((costoEntre(t, ef, desde, hasta) * pct) / 100 / 10) * 10 : 0;

/** Cobro de la salida descontando la seña (nunca negativo). */
export function cobroConSena(t: Tarifa, p: Plaza, ahora: number) {
  const total = costoEstadia(t, p, ahora);
  const sena = p.sena ?? 0;
  return { total, sena, aPagar: Math.max(0, total - sena) };
}

export const eventosActivos = (reglas: Regla[], m: Momento) =>
  reglas.filter((r) => r.tipo === "evento" && r.activa && r.fecha === m.fecha && r.sectores.some((id) => reglaAplica(r, id, m)));

/** Eventos de hoy que empiezan en las próximas 3 horas. */
export const eventosProximos = (reglas: Regla[], m: Momento) =>
  reglas.filter(
    (r) =>
      r.tipo === "evento" &&
      r.activa &&
      r.fecha === m.fecha &&
      aMinutos(r.desde) > m.minuto &&
      aMinutos(r.desde) - m.minuto <= 180,
  );

export const reglaRigeAhora = (r: Regla, m: Momento) => r.activa && r.sectores.some((id) => reglaAplica(r, id, m));
