import Link from "next/link";
import type { Reserva } from "@/lib/conductor.types";
import { ars } from "@/lib/format";
import { diaDe, horaDe } from "@/lib/conductor";
import { CommonIcon } from "@/components/common/CommonIcon";
import { EstadoReservaPill } from "@/components/reservas/EstadoReservaPill";

export function TarjetaReserva({ reserva: r }: { reserva: Reserva }) {
  return (
    <Link href={`/reservas/${r.id}`} className="flex items-center gap-4 rounded-[24px] border border-line bg-surface-raised p-4 hover:border-brand">
      <span className="grid h-14 min-w-16 place-items-center rounded-[16px] bg-surface-sunken px-2 font-display text-lg font-bold">{r.plazaEtiqueta}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[17px] font-semibold">{r.estacionamiento.nombre}</span>
        <span className="block text-[13px] text-ink-muted">
          {diaDe(r.desde)} {horaDe(r.desde)} a {horaDe(r.hasta)} · {r.patente}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <EstadoReservaPill estado={r.estado} size="sm" />
          <span className="text-[13px] text-ink-muted">Pagado {ars(r.pagado)}</span>
        </span>
      </span>
      <CommonIcon name="siguiente" size={20} className="text-ink-muted" />
    </Link>
  );
}
