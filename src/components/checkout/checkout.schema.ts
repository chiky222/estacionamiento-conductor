import { z } from "zod";
import type { MedioPago } from "@/lib/conductor.types";
import { patenteSchema } from "@/lib/patente";
import { tarjetaSchema } from "@/components/checkout/FormTarjeta";

/**
 * Formulario del checkout. El medio de pago solo es obligatorio si hay algo para pagar ahora,
 * y los datos de tarjeta solo si el medio elegido es con tarjeta.
 */
export const crearEsquemaCheckout = (medios: MedioPago[], hayQuePagar: (modalidad: "sena" | "total") => boolean) =>
  z
    .object({
      patente: patenteSchema,
      modalidad: z.enum(["sena", "total"]),
      medioId: z.string().optional(),
      tarjeta: z.record(z.string(), z.string()).optional(),
    })
    .superRefine((f, ctx) => {
      if (!hayQuePagar(f.modalidad)) return;
      const medio = medios.find((m) => m.id === f.medioId);
      if (!medio) return ctx.addIssue({ code: "custom", path: ["medioId"], message: "Elegí un medio de pago" });
      if (medio.flujo !== "tarjeta") return;
      const r = tarjetaSchema.safeParse(f.tarjeta ?? {});
      if (!r.success) r.error.issues.forEach((i) => ctx.addIssue({ code: "custom", path: ["tarjeta", ...i.path.map(String)], message: i.message }));
    });

export interface CheckoutForm {
  patente: string;
  modalidad: "sena" | "total";
  medioId?: string;
  tarjeta?: Record<string, string>;
}
