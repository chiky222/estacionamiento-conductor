import { z } from "zod";

/**
 * Normaliza una patente argentina: "ab123cd" → "AB 123 CD", "abc123" → "ABC 123", "123abc" → "123 ABC" (moto).
 * Devuelve "" si no llega a 5 caracteres válidos.
 */
export function normalizarPatente(v: string) {
  const t = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (t.length < 5) return "";
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/))) return `${m[1]} ${m[2]} ${m[3]}`;
  if ((m = t.match(/^([A-Z]{3})(\d{3})$/))) return `${m[1]} ${m[2]}`;
  if ((m = t.match(/^(\d{3})([A-Z]{3})$/))) return `${m[1]} ${m[2]}`;
  return t;
}

export const patenteSchema = z
  .string()
  .trim()
  .refine((v) => normalizarPatente(v) !== "", "Ingresá una patente válida");

export const ingresoSchema = z.object({
  patente: patenteSchema,
  cliente: z.string().trim().max(28, "Máximo 28 caracteres"),
});

export type IngresoForm = z.infer<typeof ingresoSchema>;
