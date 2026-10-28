/** Emails de abonados: se comparan sin distinguir mayúsculas. Archivo compartido con la app del conductor. */
import { z } from "zod";

export const normalizarEmail = (s: string) => s.trim().toLowerCase();

export const emailSchema = z.string().trim().email("Ingresá un email válido").max(80);

export const emailValido = (s: string) => emailSchema.safeParse(s).success;
