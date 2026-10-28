import type { EstadoReserva } from "@/lib/conductor.types";
import { ESTADOS_RESERVA } from "@/lib/conductor";
import { CommonPill } from "@/components/common/CommonPill";

export function EstadoReservaPill({ estado, size }: { estado: EstadoReserva; size?: "sm" | "md" }) {
  const e = ESTADOS_RESERVA[estado];
  return (
    <CommonPill tone={e.tone} icon={e.icon} size={size}>
      {e.label}
    </CommonPill>
  );
}
