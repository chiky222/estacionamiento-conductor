"use client";

import { useEffect, useState } from "react";
import type { ClaseVehiculo } from "@/lib/types";
import type { Cotizacion } from "@/lib/conductor.types";
import { estacionamientosService } from "@/services/estacionamientos.service";
import { mensajeDeError } from "@/lib/errors";

/**
 * Cotización del back para el lugar y horario elegidos. El precio lo calcula siempre el back
 * (reglas, eventos, fracciones y tope); el front no inventa montos.
 */
export function useCotizacion(estacionamientoId: string | null, plazaId: string | null, vehiculo: ClaseVehiculo, desde: string, hasta: string) {
  const [cot, setCot] = useState<Cotizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!estacionamientoId || !plazaId) {
      setCot(null);
      setError(null);
      return;
    }
    let vigente = true;
    setCargando(true);
    // Pequeña espera: si toca varias duraciones seguidas, se cotiza solo la última.
    const t = setTimeout(async () => {
      try {
        const c = await estacionamientosService.cotizar(estacionamientoId, { plazaId, vehiculo, desde, hasta });
        if (vigente) {
          setCot(c);
          setError(null);
        }
      } catch (e) {
        if (vigente) {
          setCot(null);
          setError(mensajeDeError(e));
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }, 200);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [estacionamientoId, plazaId, vehiculo, desde, hasta]);

  return { cot, error, cargando };
}
