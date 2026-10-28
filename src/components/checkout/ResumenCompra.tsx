import type { ClaseVehiculo } from "@/lib/types";
import type { Cotizacion, EstacionamientoDetalle, ModalidadPago } from "@/lib/conductor.types";
import { claseVehiculo } from "@/lib/constants";
import { ars, duracion } from "@/lib/format";
import { datosPlaza, diaDe, horaDe, textoPrecio } from "@/lib/conductor";
import { colorSector } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { CommonEyebrow, CommonHint } from "@/components/common/CommonText";
import { CommonTag } from "@/components/common/CommonPill";
import { montosDe } from "@/components/checkout/ModalidadPago";

interface Props {
  est: EstacionamientoDetalle;
  cot: Cotizacion;
  vehiculo: ClaseVehiculo;
  modalidad: ModalidadPago;
  children?: React.ReactNode;
}

/** Resumen fijo a la derecha: lugar, horario y cuánto se paga ahora y al salir. */
export function ResumenCompra({ est, cot, vehiculo, modalidad, children }: Props) {
  const info = datosPlaza(est.plano, cot.plazaId);
  const { ahora, alSalir } = montosDe(cot, modalidad);
  const fila = (a: React.ReactNode, b: React.ReactNode, fuerte = false) => (
    <div className={fuerte ? "flex items-baseline justify-between gap-3" : "flex justify-between gap-3 text-sm"}>
      <span className={fuerte ? "font-semibold" : "text-ink-muted"}>{a}</span>
      <span className={fuerte ? "font-display text-[28px] leading-8 font-bold text-coral-text tabular" : "text-right font-semibold tabular"}>{b}</span>
    </div>
  );
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {info && (
          <span className="grid h-14 min-w-14 place-items-center rounded-[16px] px-2 font-display text-lg font-bold" style={{ background: colorSector(info.sector.color), color: "var(--on-sector)" }}>
            {info.etiqueta}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-[17px] font-semibold">{est.nombre}</div>
          <div className="truncate text-[13px] text-ink-muted">{est.direccion}</div>
          {info && (
            <div className="truncate text-[13px] text-ink-muted">
              Sector {info.sector.nombre}
              {est.plano.pisos.length > 1 && info.piso ? ` · ${info.piso.nombre}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-[16px] bg-surface-sunken p-3">
        {fila("Llegada", `${diaDe(cot.desde)} ${horaDe(cot.desde)}`)}
        {fila("Salida", `${horaDe(cot.hasta)} · ${duracion(cot.minutos)}`)}
        {fila("Vehículo", claseVehiculo(vehiculo).label)}
        {fila("Tolerancia", `${est.toleranciaMin} min`)}
      </div>

      <div className="flex flex-col gap-1.5">
        <CommonEyebrow>Importe</CommonEyebrow>
        {fila(`Estadía (${textoPrecio(cot.precio)})`, ars(cot.total))}
        {cot.reglas.map((r) => (
          <CommonTag key={r} className="w-fit">
            {r}
          </CommonTag>
        ))}
        {cot.senaPct > 0 && fila(`Seña ${cot.senaPct} %`, ars(cot.sena))}
        <div className="my-1 h-px bg-line" />
        {fila("Pagás ahora", ars(ahora), true)}
        {fila("Pagás al salir", ars(alSalir))}
      </div>
      {children}
      <CommonHint className="mt-0">
        Si te quedás más tiempo, la diferencia se cobra al salir con la tarifa del lugar.{" "}
        {cot.sena > 0
          ? modalidad === "total"
            ? `Si cancelás antes de llegar te devolvemos todo menos la seña (${ars(cot.sena)}).`
            : "Si cancelás o no llegás, la seña no se devuelve."
          : "Podés cancelar sin costo antes de tu hora de llegada."}
      </CommonHint>
    </Card>
  );
}
