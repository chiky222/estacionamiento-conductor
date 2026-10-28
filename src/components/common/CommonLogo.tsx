import { cn } from "@/lib/utils";

/**
 * Logotipo de LIBRE: "LIBR" en una sans geométrica de trazo parejo (8 de grosor sobre 48 de alto, terminales
 * rectos) y la E final como cartel de estacionamiento. Las letras se dibujan a mano en vez de usar una fuente
 * para que el alto de mayúscula coincida exacto con el cartel y el logo no dependa de que cargue la tipografía.
 * Los colores salen de tokens para que funcione en ambos temas.
 */
export function CommonLogo({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <svg viewBox="0 0 182 48" height={height} width={(height * 182) / 48} role="img" aria-label="LIBRE" className={cn("block", className)}>
      <g fill="none" strokeWidth={8} strokeLinecap="butt" strokeLinejoin="miter" style={{ stroke: "var(--ink)" }}>
        {/* L */}
        <path d="M4 0V44H28" />
        {/* I */}
        <path d="M40 0V48" />
        {/* B: panza de arriba un poco más chica que la de abajo, como en las B bien dibujadas. */}
        <path d="M56 0V48M52 4H69A9.5 9.5 0 0 1 69 23H52M52 23H71A10.5 10.5 0 0 1 71 44H52" />
        {/* R */}
        <path d="M98 0V48M94 4H112A10 10 0 0 1 112 24H94" />
      </g>
      {/* Pierna de la R como polígono: así apoya plana sobre la línea de base en vez de cortarse en diagonal. */}
      <polygon points="104.5,24 113.5,24 127,48 118,48" style={{ fill: "var(--ink)" }} />
      <g transform="translate(134 0)">
        <CarteleE />
      </g>
    </svg>
  );
}

/** El cartel E (isotipo), 48 × 48. */
function CarteleE() {
  return (
    <>
      <rect width={48} height={48} rx={12} style={{ fill: "var(--brand)" }} />
      <rect x={3.5} y={3.5} width={41} height={41} rx={8.5} fill="none" strokeWidth={2} style={{ stroke: "var(--on-brand)" }} />
      <path d="M31 13H17v22h14M17 24h7.5" fill="none" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--on-brand)" }} />
      <circle cx={31} cy={24} r={3.4} style={{ fill: "var(--coral-bright)" }} />
    </>
  );
}
