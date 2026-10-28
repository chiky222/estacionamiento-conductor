import { httpClient } from "@/services/httpClient";
import type { MiAbono } from "@/lib/conductor.types";

const base = (estacionamientoId: string, plazaId: string) => `/api/abonos/${encodeURIComponent(estacionamientoId)}/${encodeURIComponent(plazaId)}/cesiones`;

/** Abonos mensuales del conductor y las franjas en que cede su lugar (subalquiler). */
export const abonosService = {
  mios: () => httpClient.get<MiAbono[]>("/api/abonos/mios"),
  /** `desde` y `hasta` en ISO, del mismo día. */
  ceder: (estacionamientoId: string, plazaId: string, body: { desde: string; hasta: string }) => httpClient.post<MiAbono>(base(estacionamientoId, plazaId), body),
  quitarCesion: (estacionamientoId: string, plazaId: string, cesionId: string) =>
    httpClient.delete<MiAbono>(`${base(estacionamientoId, plazaId)}/${encodeURIComponent(cesionId)}`),
};
