/** Formateadores y helpers de fechas/horas. Puros, sin estado. */

export const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const ars = (n: number) => "$ " + Math.round(n).toLocaleString("es-AR");

export const metros = (n: number) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const redondear2 = (n: number) => Math.round(n * 100) / 100;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const numero = (v: string | number, porDefecto = 0) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isNaN(n) ? porDefecto : n;
};

/** 1250 → "1,3k": para las plazas del plano, donde no entra el precio completo. */
export const miles = (v: number) =>
  v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString("es-AR") + "k" : String(Math.round(v));

export const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const sumarDias = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const isoFecha = (d: Date) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

export const hhmm = (m: number) => {
  const r = Math.max(0, Math.round(m));
  return String(Math.floor(r / 60) % 24).padStart(2, "0") + ":" + String(r % 60).padStart(2, "0");
};

export const aMinutos = (s: string) => {
  const p = String(s || "0:0").split(":");
  return (+p[0] || 0) * 60 + (+p[1] || 0);
};

/** "2026-10-15" → "15/10" */
export const diaMes = (s: string) => {
  const p = s.split("-");
  return p[2] + "/" + p[1];
};

export const duracion = (m: number) => {
  const r = Math.max(0, Math.round(m));
  const h = Math.floor(r / 60);
  return h ? `${h} h ${String(r % 60).padStart(2, "0")} min` : `${r} min`;
};

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
