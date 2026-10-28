import type { Reserva } from "@/lib/conductor.types";
import { claseVehiculo } from "@/lib/constants";
import { ars } from "@/lib/format";
import { diaDe, horaDe, sumarMinutos } from "@/lib/conductor";
import { Card } from "@/components/ui/card";
import { CommonLicensePlate } from "@/components/common/CommonLicensePlate";
import { CommonEyebrow } from "@/components/common/CommonText";
import { CodigoQr } from "@/components/reservas/CodigoQr";
import { EstadoReservaPill } from "@/components/reservas/EstadoReservaPill";

/** Lo que muestra en la entrada: código y QR, lugar, horario, patente y lo pagado. */
export function ComprobanteReserva({ reserva: r }: { reserva: Reserva }) {
  const activa = r.estado === "confirmada" || r.estado === "en_curso";
  const fila = (a: string, b: React.ReactNode) => (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ink-muted">{a}</span>
      <span className="text-right font-semibold tabular">{b}</span>
    </div>
  );
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-5">
        {activa && <CodigoQr valor={r.codigo} />}
        <div className="flex flex-col gap-1">
          <CommonEyebrow>Tu lugar</CommonEyebrow>
          <div className="font-display text-[48px] leading-[52px] font-bold tracking-[-.01em]">{r.plazaEtiqueta}</div>
          <div className="text-sm text-ink-muted">
            Sector {r.sectorNombre}
            {r.pisoNombre ? ` · ${r.pisoNombre}` : ""}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <EstadoReservaPill estado={r.estado} size="sm" />
            <span className="font-mono text-sm font-semibold tracking-[.12em]">{r.codigo}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 rounded-[16px] bg-surface-sunken p-3">
        {fila("Llegada", `${diaDe(r.desde)} ${horaDe(r.desde)}`)}
        {activa && fila("Te guardamos el lugar hasta", horaDe(sumarMinutos(r.desde, r.toleranciaMin)))}
        {fila("Salida", horaDe(r.hasta))}
        {fila("Vehículo", claseVehiculo(r.vehiculo).label)}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">Patente</span>
          <CommonLicensePlate value={r.patente} size="sm" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {fila("Estadía", ars(r.total))}
        {fila(!r.pagado ? "Pagado" : r.modalidad === "total" ? "Pagaste (total)" : "Pagaste (seña)", ars(r.pagado))}
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">Pagás al salir</span>
          <span className="font-display text-2xl font-bold text-coral-text tabular">{ars(r.saldo)}</span>
        </div>
        {r.estado === "cancelada" && r.reembolso != null && fila("Te devolvemos", ars(r.reembolso))}
      </div>
    </Card>
  );
}
