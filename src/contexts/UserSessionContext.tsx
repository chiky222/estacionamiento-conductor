"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UsuarioSesion } from "@/lib/conductor.types";
import { sesionService } from "@/services/sesion.service";

interface Valor {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  ingresar: (email: string, password: string) => Promise<UsuarioSesion>;
  registrarse: (nombre: string, email: string, password: string) => Promise<UsuarioSesion>;
  salir: () => Promise<void>;
  /** Vuelve a pedir la sesión (ej. al volver del login con Google). */
  refrescar: () => Promise<void>;
}

const Ctx = createContext<Valor | null>(null);

/** Sesión del conductor. No hace falta para buscar ni ver planos; sí para reservar y pagar. */
export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      setUsuario(await sesionService.actual());
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const valor = useMemo<Valor>(
    () => ({
      usuario,
      cargando,
      refrescar,
      ingresar: async (email, password) => {
        const u = await sesionService.ingresar({ email, password });
        setUsuario(u);
        return u;
      },
      registrarse: async (nombre, email, password) => {
        const u = await sesionService.registrarse({ nombre, email, password });
        setUsuario(u);
        return u;
      },
      salir: async () => {
        await sesionService.salir();
        setUsuario(null);
      },
    }),
    [usuario, cargando, refrescar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useUserSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUserSession va dentro de <UserSessionProvider>");
  return v;
}
