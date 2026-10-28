import { httpClient, query } from "@/services/httpClient";
import type { ClaseVehiculo } from "@/lib/types";
import type { Cotizacion, EstacionamientoDetalle, EstacionamientoResumen, Ubicacion } from "@/lib/conductor.types";

export interface FiltroBusqueda {
  vehiculo: ClaseVehiculo;
  cerca?: Ubicacion;
  /** Metros alrededor de `cerca`. */
  radio?: number;
  soloConLugar?: boolean;
}

/** Estacionamientos que usan la app: mapa, lista y plano para elegir lugar. */
export const estacionamientosService = {
  listar: (f: FiltroBusqueda) =>
    httpClient.get<EstacionamientoResumen[]>(
      "/api/publico/estacionamientos" +
        query({ vehiculo: f.vehiculo, lat: f.cerca?.lat, lng: f.cerca?.lng, radio: f.radio, conLugar: f.soloConLugar ? 1 : undefined }),
    ),
  /**
   * `desde` = hora de llegada: las tarifas del plano se calculan para ese momento. Con `hasta`, los lugares
   * de abonados cedidos en todo ese horario aparecen libres.
   */
  detalle: (id: string, vehiculo: ClaseVehiculo, desde?: string, hasta?: string) =>
    httpClient.get<EstacionamientoDetalle>(`/api/publico/estacionamientos/${encodeURIComponent(id)}` + query({ vehiculo, desde, hasta })),
  cotizar: (id: string, body: { plazaId: string; vehiculo: ClaseVehiculo; desde: string; hasta: string }) =>
    httpClient.post<Cotizacion>(`/api/publico/estacionamientos/${encodeURIComponent(id)}/cotizacion`, body),
};
