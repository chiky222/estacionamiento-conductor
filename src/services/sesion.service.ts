import { httpClient } from "@/services/httpClient";
import { config } from "@/lib/config";
import type { UsuarioSesion } from "@/lib/conductor.types";

/** Sesión del conductor (Passport local + Google en el back; JWT en cookie httpOnly). */
export const sesionService = {
  /** null si no hay sesión (el back responde 200 con data null en vez de 401, para no redirigir). */
  actual: () => httpClient.get<UsuarioSesion | null>("/api/sesion/actual"),
  ingresar: (body: { email: string; password: string }) => httpClient.post<UsuarioSesion>("/api/sesion/login", body),
  registrarse: (body: { nombre: string; email: string; password: string }) => httpClient.post<UsuarioSesion>("/api/sesion/registro", body),
  salir: () => httpClient.post<{ ok: true }>("/api/sesion/logout"),
  /** URL del login con Google (Passport): el back redirige de vuelta a `volver`. */
  urlGoogle: (volver: string) => `${config.apiUrl}/api/sesion/google?volver=${encodeURIComponent(volver)}`,
};
