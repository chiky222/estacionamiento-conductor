/** Única lectura de variables de entorno del front (ver .env.example). */
export const config = {
  modoApi: process.env.NEXT_PUBLIC_API_MODE ?? "mock",
  apiUrl:
    process.env.NEXT_PUBLIC_ENTORNO === "develop"
      ? (process.env.NEXT_PUBLIC_API_URL_DEV ?? "http://localhost:8080")
      : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"),
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  googleMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  /** Public key de Mercado Pago, para tokenizar tarjetas en el navegador (no es secreta). */
  mpPublicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "",
};
