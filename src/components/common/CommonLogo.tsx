import { cn } from "@/lib/utils";

/**
 * Logotipo de ESTACIONARTE: letras monolínea en tinta y la última E como cartel de estacionamiento.
 * Trazado copiado de estacionarte-logotipo.svg; los colores salen de tokens para que funcione en ambos temas.
 */
export function CommonLogo({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <svg viewBox="0 0 401.5 48" height={height} width={(height * 401.5) / 48} role="img" aria-label="ESTACIONARTE" className={cn("block", className)}>
      <path
        d="M24.5 6H2.5V42H24.5M2.5 24.0H19.5M56.0 10C54.0 7.2 50.5 6 47.0 6C41.0 6 37.0 9.6 37.0 15C37.0 21 42.0 22.5 47.0 24.0C52.0 25.5 57.0 27.0 57.0 33C57.0 38.4 53.0 42 47.0 42C43.0 42 39.0 40.5 36.5 37.5M67.5 6H91.5M79.5 6V42M102.0 42L114.5 6L127.0 42M107.5 31H121.5M161.5 11C159.0 7.8 155.0 6 150.5 6C143.5 6 138.5 14 138.5 24.0C138.5 34 143.5 42 150.5 42C155.0 42 159.0 40.2 161.5 37M172.0 6V42M195.5 6C203.5 6 208.5 14 208.5 24.0C208.5 34 203.5 42 195.5 42C187.5 42 182.5 34 182.5 24.0C182.5 14 187.5 6 195.5 6ZM219.0 42V6L241.0 42V6M251.5 42L264.0 6L276.5 42M257.0 31H271.0M287.0 42V6H298.5A8.5 8.5 0 0 1 298.5 23H287.0M297.0 23L307.0 42M317.5 6H341.5M329.5 6V42"
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: "var(--ink)" }}
      />
      <g transform="translate(351 0)">
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
