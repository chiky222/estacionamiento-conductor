"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ClaseVehiculo } from "@/lib/types";
import { proximoCuarto, sumarMinutos } from "@/lib/conductor";

/** Lo que el conductor va eligiendo: vehículo, horario y lugar. Sobrevive a recargar la pestaña. */
interface Borrador {
  vehiculo: ClaseVehiculo;
  /** ISO de llegada; null = "ahora" (se redondea al próximo cuarto de hora). */
  llegada: string | null;
  horas: number;
  seleccion: { estacionamientoId: string; plazaId: string } | null;
}

interface Valor extends Borrador {
  /** true cuando ya se leyó lo guardado (evita parpadeos al hidratar). */
  listo: boolean;
  desde: string;
  hasta: string;
  setVehiculo: (v: ClaseVehiculo) => void;
  setLlegada: (iso: string | null) => void;
  setHoras: (h: number) => void;
  elegirPlaza: (estacionamientoId: string, plazaId: string | null) => void;
  limpiarSeleccion: () => void;
}

const CLAVE = "conductor-borrador-v1";
const INICIAL: Borrador = { vehiculo: "auto", llegada: null, horas: 2, seleccion: null };

const Ctx = createContext<Valor | null>(null);

export function ReservaProvider({ children }: { children: React.ReactNode }) {
  const [b, setB] = useState<Borrador>(INICIAL);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CLAVE);
      if (raw) {
        const guardado = { ...INICIAL, ...(JSON.parse(raw) as Borrador) };
        // Una llegada que ya pasó vuelve a "ahora".
        if (guardado.llegada && new Date(guardado.llegada).getTime() < Date.now()) guardado.llegada = null;
        setB(guardado);
      }
    } catch {
      // Sin sessionStorage seguimos con los valores por defecto.
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(b));
    } catch {
      // Sin persistencia.
    }
  }, [b, listo]);

  const actualizar = useCallback((p: Partial<Borrador>) => setB((x) => ({ ...x, ...p })), []);

  const valor = useMemo<Valor>(() => {
    const desde = b.llegada ?? proximoCuarto().toISOString();
    return {
      ...b,
      listo,
      desde,
      hasta: sumarMinutos(desde, b.horas * 60),
      // Cambiar de vehículo puede dejar el lugar elegido en un sector donde ya no entra.
      setVehiculo: (vehiculo) => actualizar({ vehiculo, seleccion: null }),
      setLlegada: (llegada) => actualizar({ llegada }),
      setHoras: (horas) => actualizar({ horas }),
      elegirPlaza: (estacionamientoId, plazaId) => actualizar({ seleccion: plazaId ? { estacionamientoId, plazaId } : null }),
      limpiarSeleccion: () => actualizar({ seleccion: null }),
    };
  }, [b, listo, actualizar]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useReserva() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReserva va dentro de <ReservaProvider>");
  return v;
}
