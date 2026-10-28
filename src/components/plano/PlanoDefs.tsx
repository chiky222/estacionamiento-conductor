import { ESCALA } from "@/lib/constants";

/** Patrones del plano: grilla de 1 m y 5 m, grilla de puntos del editor y rayados de reserva y fuera de servicio. */
export function PlanoDefs() {
  return (
    <defs>
      <pattern id="grilla-1" width={ESCALA} height={ESCALA} patternUnits="userSpaceOnUse">
        <path d={`M${ESCALA} 0L0 0 0 ${ESCALA}`} fill="none" style={{ stroke: "var(--grid)", strokeWidth: 0.6 }} />
      </pattern>
      <pattern id="grilla-5" width={ESCALA * 5} height={ESCALA * 5} patternUnits="userSpaceOnUse">
        <path d={`M${ESCALA * 5} 0L0 0 0 ${ESCALA * 5}`} fill="none" style={{ stroke: "var(--grid-strong)", strokeWidth: 0.9 }} />
      </pattern>
      <pattern id="grilla-puntos" width={ESCALA} height={ESCALA} patternUnits="userSpaceOnUse">
        <circle cx={0} cy={0} r={1.3} style={{ fill: "var(--grid-dot)" }} />
        <circle cx={ESCALA} cy={0} r={1.3} style={{ fill: "var(--grid-dot)" }} />
        <circle cx={0} cy={ESCALA} r={1.3} style={{ fill: "var(--grid-dot)" }} />
        <circle cx={ESCALA} cy={ESCALA} r={1.3} style={{ fill: "var(--grid-dot)" }} />
      </pattern>
      <pattern id="rayado-reserva" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={12} height={12} style={{ fill: "var(--amber-soft)" }} />
        <line x1={0} y1={0} x2={0} y2={12} style={{ stroke: "var(--amber)", strokeWidth: 5, opacity: 0.35 }} />
      </pattern>
      <pattern id="rayado" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={12} height={12} style={{ fill: "var(--surface-sunken)" }} />
        <line x1={0} y1={0} x2={0} y2={12} style={{ stroke: "var(--blocked)", strokeWidth: 5, opacity: 0.35 }} />
      </pattern>
    </defs>
  );
}
