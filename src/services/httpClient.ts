/**
 * Único cliente HTTP del front. Todos los services pasan por acá.
 * - NEXT_PUBLIC_API_MODE=mock (por defecto): responde la API simulada del navegador.
 * - NEXT_PUBLIC_API_MODE=api: pega al back real con la cookie de sesión.
 * Respuesta esperada del back: `{ data }` en éxito y `{ code, message, requestId }` en error.
 */
import { ApiError } from "@/lib/errors";
import { config } from "@/lib/config";

type Metodo = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type Opciones = { headers?: Record<string, string> };

// Deduplica GETs iguales que están en vuelo (ej. dos componentes pidiendo lo mismo al montar).
const enVuelo = new Map<string, Promise<unknown>>();

async function pedirAlBack<T>(metodo: Metodo, path: string, body?: unknown, op?: Opciones): Promise<T> {
  let res: Response;
  try {
    res = await fetch(config.apiUrl + path, {
      method: metodo,
      credentials: "include",
      headers: { ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...op?.headers },
      body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR");
  }
  const json = await res.json().catch(() => ({}));
  // Al login, volviendo después a donde estaba (ej. el checkout).
  if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login?volver=" + encodeURIComponent(location.pathname + location.search);
  if (!res.ok) throw new ApiError(res.status, json.code ?? "INTERNAL_ERROR", json.requestId);
  return json.data as T;
}

async function request<T>(metodo: Metodo, path: string, body?: unknown, op?: Opciones): Promise<T> {
  if (config.modoApi === "mock") {
    // Import dinámico: con el back real, la API simulada ni siquiera entra al bundle que se ejecuta.
    const { mockFetch } = await import("@/lib/mock/mock.api");
    return mockFetch<T>(metodo, path, body, op?.headers);
  }
  if (metodo !== "GET") return pedirAlBack<T>(metodo, path, body, op);
  const previo = enVuelo.get(path);
  if (previo) return previo as Promise<T>;
  const p = pedirAlBack<T>(metodo, path).finally(() => enVuelo.delete(path));
  enVuelo.set(path, p);
  return p;
}

/** Arma "?a=1&b=2" salteando valores vacíos. */
export const query = (q: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString();
  return s ? "?" + s : "";
};

export const httpClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, op?: Opciones) => request<T>("POST", path, body ?? {}, op),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
