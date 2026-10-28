import type { EstadoDisponibilidad } from "@/lib/conductor.types";
import { ESTADOS_DISPONIBILIDAD } from "@/lib/conductor";
import { CommonPill } from "@/components/common/CommonPill";

/** "Hay lugar", "Últimos lugares" o "Sold-out": siempre con ícono además del color. */
export function EstadoPill({ estado, size }: { estado: EstadoDisponibilidad; size?: "sm" | "md" }) {
  const e = ESTADOS_DISPONIBILIDAD[estado];
  return (
    <CommonPill tone={e.tone} icon={e.icon} size={size}>
      {e.label}
    </CommonPill>
  );
}
