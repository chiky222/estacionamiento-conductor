"use client";

import type { Cotizacion, EstacionamientoDetalle } from "@/lib/conductor.types";
import { TIPOS_PLAZA } from "@/lib/constants";
import { ars, duracion } from "@/lib/format";
import { datosPlaza, diaDe, horaDe } from "@/lib/conductor";
import { Card } from "@/components/ui/card";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonPill } from "@/components/common/CommonPill";
import { CommonEyebrow, CommonHint, CommonWarning } from "@/components/common/CommonText";
import { CommonSpinner } from "@/components/common/CommonSpinner";

interface Props {
  est: EstacionamientoDetalle;
  plazaId: string | null;
  cot: Cotizacion | null;
  cargando: boolean;
  error: string | null;
  desde: string;
  hasta: string;
  onElegirPorMi: () => void;
  onQuitar: () => void;
  onContinuar: () => void;
}

/** Lugar elegido con la cotización del back y el botón para ir al pago. */
export function ResumenSeleccion({ est, plazaId, cot, cargando, error, desde, hasta, onElegirPorMi, onQuitar, onContinuar }: Props) {
  const info = plazaId ? datosPlaza(est.plano, plazaId) : null;
  const lleno = est.estado === "sold_out";
  if (!info)
    return (
      <Card>
        <CommonEyebrow>Tu lugar</CommonEyebrow>
        <p className="mt-2 mb-3 text-[15px]">
          {lleno ? "No quedan lugares libres para tu vehículo en este horario." : "Tocá un lugar libre (E) en el plano, o dejá que elijamos el más conveniente."}
        </p>
        <CommonButton color="primary" icon="check" className="w-full" onClick={onElegirPorMi} disabled={lleno}>
          Elegir por mí
        </CommonButton>
        <CommonHint>Elegimos el más barato y, a igual precio, el más cerca de la entrada.</CommonHint>
      </Card>
    );

  const minutos = Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 60000);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CommonEyebrow>Tu lugar</CommonEyebrow>
          <div className="font-display text-[40px] leading-[44px] font-bold tracking-[-.01em]">{info.etiqueta}</div>
          <p className="m-0 text-[13px] text-ink-muted">
            Sector {info.sector.id} · {info.sector.nombre}
            {info.piso && est.plano.pisos.length > 1 ? ` · ${info.piso.nombre}` : ""}
          </p>
        </div>
        <CommonButton size="sm" color="ghost" onClick={onQuitar}>
          Cambiar
        </CommonButton>
      </div>
      {info.tipo !== "std" && (
        <CommonPill tone="sky" icon={info.tipo === "pmr" ? "accesible" : "cargador"} size="sm" className="w-fit">
          {TIPOS_PLAZA.find((t) => t.value === info.tipo)?.label}
        </CommonPill>
      )}
      <div className="rounded-[16px] bg-surface-sunken p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-muted">Llegás</span>
          <span className="font-semibold">
            {diaDe(desde)} {horaDe(desde)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">Te vas</span>
          <span className="font-semibold">
            {horaDe(hasta)} · {duracion(minutos)}
          </span>
        </div>
      </div>
      {error ? (
        <CommonWarning>{error}</CommonWarning>
      ) : !cot ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <CommonSpinner className="text-brand" /> Calculando el precio…
        </div>
      ) : (
        <div className={cargando ? "opacity-60 transition-opacity" : undefined}>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Estadía estimada</span>
            <span className="font-semibold tabular">{ars(cot.total)}</span>
          </div>
          {cot.senaPct > 0 ? (
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold">Reservás con una seña de</span>
              <span className="font-display text-2xl font-bold text-coral-text tabular">{ars(cot.sena)}</span>
            </div>
          ) : (
            <p className="m-0 mt-1 text-sm font-semibold">Reservás sin seña: pagás al salir o todo ahora, como prefieras.</p>
          )}
          {cot.reglas.length > 0 && <CommonHint className="mt-1">Incluye: {cot.reglas.join(", ")}.</CommonHint>}
        </div>
      )}
      <CommonButton color="primary" icon="siguiente" className="w-full" onClick={onContinuar} disabled={!cot || !!error}>
        Continuar al pago
      </CommonButton>
    </Card>
  );
}

/** En el celular: barra fija abajo con el lugar y el botón, para no tener que bajar hasta el resumen. */
export function BarraContinuar({ etiqueta, cot, onContinuar }: { etiqueta: string; cot: Cotizacion | null; onContinuar: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-glass px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-[640px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-6 font-bold">{etiqueta}</div>
          <div className="truncate text-[13px] text-ink-muted">
            {cot ? (cot.senaPct > 0 ? `Seña ${ars(cot.sena)} · total ${ars(cot.total)}` : `Total ${ars(cot.total)}`) : "Calculando…"}
          </div>
        </div>
        <CommonButton color="primary" icon="siguiente" onClick={onContinuar} disabled={!cot}>
          Continuar
        </CommonButton>
      </div>
    </div>
  );
}
