/**
 * Tokenización de tarjetas. Los datos de la tarjeta van del navegador directo a la pasarela y al back
 * solo llega un token de un uso: así nuestro back nunca ve números de tarjeta (PCI).
 * - API simulada: devuelve un token de prueba (la tarjeta 4000 0000 0000 0002 se rechaza).
 * - Back real: usa el SDK MercadoPago.js v2 (createCardToken) con NEXT_PUBLIC_MP_PUBLIC_KEY.
 */
import { config } from "@/lib/config";
import { ApiError } from "@/lib/errors";

export interface DatosTarjeta {
  numero: string;
  /** "MM/AA" */
  vence: string;
  cvv: string;
  titular: string;
  dni: string;
}

interface SdkMercadoPago {
  createCardToken: (d: Record<string, string>) => Promise<{ id: string }>;
}
declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, op?: { locale: string }) => SdkMercadoPago;
  }
}

let sdk: Promise<SdkMercadoPago> | null = null;
function cargarSdk() {
  sdk ??= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => (window.MercadoPago ? ok(new window.MercadoPago(config.mpPublicKey, { locale: "es-AR" })) : mal(new ApiError(0, "NETWORK_ERROR")));
    s.onerror = () => mal(new ApiError(0, "NETWORK_ERROR"));
    document.head.appendChild(s);
  });
  return sdk;
}

export const tarjetaService = {
  async tokenizar(t: DatosTarjeta): Promise<string> {
    const numero = t.numero.replace(/\D/g, "");
    if (config.modoApi === "mock") return `tok_test_${numero.slice(-4)}`;
    const [mes, anio] = t.vence.split("/");
    const mp = await cargarSdk();
    const r = await mp.createCardToken({
      cardNumber: numero,
      cardholderName: t.titular,
      cardExpirationMonth: mes,
      cardExpirationYear: "20" + anio,
      securityCode: t.cvv,
      identificationType: "DNI",
      identificationNumber: t.dni,
    });
    return r.id;
  },
};
