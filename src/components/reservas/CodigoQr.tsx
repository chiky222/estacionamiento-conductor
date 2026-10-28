"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR con el código de la reserva: lo lee el scanner de la entrada (Estacionamiento-scanner). */
export function CodigoQr({ valor, tam = 168 }: { valor: string; tam?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(valor, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#10241f", light: "#ffffff" } }).then(setSvg);
  }, [valor]);
  // Fondo blanco fijo también en tema oscuro: los lectores leen mejor el QR clásico.
  return <div role="img" aria-label={`Código QR de la reserva ${valor}`} className="overflow-hidden rounded-[10px] bg-white p-1" style={{ width: tam, height: tam }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
