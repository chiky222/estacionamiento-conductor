import { httpClient, query } from "@/services/httpClient";
import type { MedioPago, Pago } from "@/lib/conductor.types";

/** Medios de pago que habilita el back (cada uno sale de una pasarela del factory). */
export const pagosService = {
  medios: (estacionamientoId: string) => httpClient.get<MedioPago[]>("/api/pagos/medios" + query({ estacionamientoId })),
  estado: (pagoId: string) => httpClient.get<Pago>(`/api/pagos/${encodeURIComponent(pagoId)}`),
  /** Solo en la API simulada: hace de pasarela externa y aprueba o rechaza el pago. */
  simular: (pagoId: string, aprobar: boolean) => httpClient.post<Pago>(`/api/demo/pagos/${encodeURIComponent(pagoId)}`, { aprobar }),
};
