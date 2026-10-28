"use client";

import type { MiAbono } from "@/lib/conductor.types";
import { ars, diaMes } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { CommonEyebrow, CommonHint, CommonTitle } from "@/components/common/CommonText";
import { CederLugarForm } from "@/components/abono/CederLugarForm";
import { CesionItem } from "@/components/abono/CesionItem";

interface Props {
  abono: MiAbono;
  /** Clave de la acción en curso ("ceder" o "quitar:<id>"). */
  pendiente: string | null;
  onCeder: (desde: string, hasta: string) => Promise<boolean>;
  onQuitar: (cesionId: string) => void;
}

/** Un abono: el lugar, el crédito ganado, las franjas cedidas y el formulario para ceder otra. */
export function TarjetaAbono({ abono: a, pendiente, onCeder, onQuitar }: Props) {
  const proximas = a.cesiones.filter((c) => c.estado !== "terminada");
  const terminadas = a.cesiones.filter((c) => c.estado === "terminada").reverse();
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px] md:items-start">
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 min-w-16 place-items-center rounded-[16px] bg-amber-soft px-2 font-display text-lg font-bold text-amber-text">{a.plazaEtiqueta}</span>
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] font-semibold">{a.estacionamiento.nombre}</div>
            <div className="truncate text-[13px] text-ink-muted">
              {a.sectorNombre}
              {a.pisoNombre ? ` · ${a.pisoNombre}` : ""} · vence el {diaMes(a.vence)}
            </div>
          </div>
        </div>
        <div className="rounded-[16px] bg-brand-soft px-4 py-3 text-brand-strong">
          <CommonEyebrow className="text-brand-strong">Crédito por ceder tu lugar</CommonEyebrow>
          <div className="mt-1 font-display text-[34px] leading-[38px] font-semibold tracking-[-.02em] tabular">{ars(a.credito)}</div>
          <p className="m-0 mt-1 text-[13px]">
            Te llevás el {a.pctAbonado}% de lo que se cobra por tu lugar mientras está cedido. Se descuenta de tu próximo pago ({ars(a.precio)}).
          </p>
        </div>
        <section>
          <CommonTitle as="h2" className="mb-2 text-lg">
            Horarios cedidos
          </CommonTitle>
          {proximas.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {proximas.map((c) => (
                <CesionItem key={c.id} cesion={c} quitando={pendiente === "quitar:" + c.id} onQuitar={() => onQuitar(c.id)} />
              ))}
            </ul>
          ) : (
            <CommonHint className="mt-0">No cediste tu lugar en los próximos días.</CommonHint>
          )}
          {terminadas.length > 0 && (
            <>
              <h3 className="mt-4 mb-2 text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">Anteriores</h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {terminadas.map((c) => (
                  <CesionItem key={c.id} cesion={c} quitando={false} onQuitar={() => undefined} />
                ))}
              </ul>
            </>
          )}
        </section>
      </Card>
      <Card className="flex flex-col gap-3 md:sticky md:top-[72px]">
        <CommonTitle as="h2" className="text-lg">
          Ceder mi lugar
        </CommonTitle>
        <p className="m-0 text-sm text-ink-muted">Elegí cuándo no lo vas a usar. En ese horario otros conductores lo pueden reservar; fuera de ese horario sigue siendo tuyo.</p>
        <CederLugarForm enviando={pendiente === "ceder"} onCeder={onCeder} />
      </Card>
    </div>
  );
}
