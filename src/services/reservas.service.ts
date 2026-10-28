import { httpClient } from "@/services/httpClient";
import type { NuevaReserva, Pago, Reserva } from "@/lib/conductor.types";

/** Reservas del conductor logueado. */
export const reservasService = {
  /**
   * Crea la reserva y su pago. `idempotencia` evita reservar dos veces si se toca "Pagar" dos veces
   * o se corta la red a mitad de camino: el back devuelve la misma reserva para la misma clave.
   */
  crear: (body: NuevaReserva, idempotencia: string) =>
    httpClient.post<{ reserva: Reserva; pago?: Pago }>("/api/reservas", body, { headers: { "Idempotency-Key": idempotencia } }),
  mias: () => httpClient.get<Reserva[]>("/api/reservas/mias"),
  detalle: (id: string) => httpClient.get<Reserva>(`/api/reservas/${encodeURIComponent(id)}`),
  cancelar: (id: string) => httpClient.post<Reserva>(`/api/reservas/${encodeURIComponent(id)}/cancelar`),
  /** Pagar de nuevo una reserva cuyo pago se rechazó (mientras el lugar sigue retenido). */
  reintentarPago: (id: string, body: Pick<NuevaReserva, "medioPagoId" | "tokenTarjeta" | "cuotas">) =>
    httpClient.post<{ reserva: Reserva; pago: Pago }>(`/api/reservas/${encodeURIComponent(id)}/pago`, body),
};
