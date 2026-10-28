"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeDeError } from "@/lib/errors";

/**
 * Carga datos de un service y los vuelve a pedir cuando cambian las dependencias.
 * Con `cadaMs` refresca solo (la disponibilidad cambia todo el tiempo); al refrescar no vuelve a
 * mostrar "cargando", para que el mapa y el plano no parpadeen.
 * Cuando el back tenga Socket.io, el refresco periódico se reemplaza por el evento de disponibilidad.
 */
export function useCarga<T>(cargar: (() => Promise<T>) | null, deps: unknown[], { cadaMs }: { cadaMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(!!cargar);
  const fn = useRef(cargar);
  fn.current = cargar;
  // Descarta respuestas viejas si cambian los filtros mientras se está pidiendo.
  const turno = useRef(0);

  const pedir = useCallback(async (silencioso = false) => {
    if (!fn.current) return;
    const mio = ++turno.current;
    if (!silencioso) setCargando(true);
    try {
      const d = await fn.current();
      if (mio === turno.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (mio === turno.current && !silencioso) setError(mensajeDeError(e));
    } finally {
      if (mio === turno.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    pedir();
    if (!cadaMs) return;
    const t = setInterval(() => pedir(true), cadaMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cadaMs, pedir]);

  return { data, error, cargando, recargar: () => pedir(true) };
}
