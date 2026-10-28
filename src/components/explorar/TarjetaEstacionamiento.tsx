"use client";

import Link from "next/link";
import type { ClaseVehiculo } from "@/lib/types";
import type { EstacionamientoResumen } from "@/lib/conductor.types";
import { claseVehiculo } from "@/lib/constants";
import { minutosAPie, SERVICIOS, textoDistancia, textoPrecio } from "@/lib/conductor";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";
import { CommonTag } from "@/components/common/CommonPill";
import { EstadoPill } from "@/components/mapa/EstadoPill";

interface Props {
  est: EstacionamientoResumen;
  vehiculo: ClaseVehiculo;
  seleccionado?: boolean;
  onSeleccionar?: () => void;
  /** Versión flotante sobre el mapa (con sombra y botón grande). */
  flotante?: boolean;
}

/** Ficha de un estacionamiento en la lista y sobre el mapa: precio, lugar libre, distancia y servicios. */
export function TarjetaEstacionamiento({ est, vehiculo, seleccionado, onSeleccionar, flotante }: Props) {
  const lleno = est.estado === "sold_out";
  const libres = est.disponibilidad[vehiculo].libres;
  const clase = claseVehiculo(vehiculo);
  return (
    <article
      className={cn(
        "relative rounded-[24px] border bg-surface-raised p-4 transition-shadow",
        seleccionado ? "border-brand shadow-[0_0_0_3px_var(--brand-soft)]" : "border-line",
        flotante && "shadow-e2",
        lleno && !flotante && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display text-[17px] leading-6 font-semibold">
            <Link href={`/estacionamientos/${est.id}`} className="after:absolute after:inset-0 after:rounded-[24px] focus-visible:outline-none">
              {est.nombre}
            </Link>
          </h3>
          <p className="m-0 truncate text-[13px] text-ink-muted">
            {est.direccion} · {est.barrio}
          </p>
        </div>
        <div className="text-right">
          <div className={cn("font-display text-lg leading-6 font-bold tabular", lleno ? "text-ink-muted" : "text-coral-text")}>{textoPrecio(est.precioDesde)}</div>
          {est.precioDesde.modo === "hora" && <div className="text-[11px] text-ink-muted">desde</div>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EstadoPill estado={est.estado} size="sm" />
        {!lleno && (
          <span className="text-[13px] font-semibold">
            {plural(libres, "lugar", "lugares")} para {clase.label.toLowerCase()}
          </span>
        )}
        {lleno && !est.abierto && <span className="text-[13px] text-ink-muted">Cerrado ahora · {est.horario}</span>}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-muted">
        {est.distancia != null && (
          <span className="inline-flex items-center gap-1">
            <CommonIcon name="ubicacion" size={14} />
            {textoDistancia(est.distancia)} · {minutosAPie(est.distancia)} min a pie
          </span>
        )}
        {est.calificacion && (
          <span className="inline-flex items-center gap-1">
            <CommonIcon name="estrella" size={14} className="text-amber" />
            {est.calificacion.toLocaleString("es-AR")}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <CommonIcon name="reloj" size={14} />
          {est.horario}
        </span>
        {onSeleccionar && (
          <button type="button" onClick={onSeleccionar} className="relative z-10 ml-auto inline-flex items-center gap-1 font-semibold text-brand-strong hover:underline">
            <CommonIcon name="mapa" size={14} />
            Ver en el mapa
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {est.evento && <CommonTag>{est.evento}</CommonTag>}
        <span className="rounded-[6px] bg-surface-sunken px-1.5 py-px text-xs font-semibold text-ink-muted">{est.senaPct > 0 ? `Seña ${est.senaPct} %` : "Reserva sin seña"}</span>
        <span className="ml-auto flex gap-1.5 text-ink-muted">
          {est.servicios.map((s) => (
            <span key={s} title={SERVICIOS[s].label}>
              <CommonIcon name={SERVICIOS[s].icon} size={16} label={SERVICIOS[s].label} />
            </span>
          ))}
        </span>
      </div>

      {flotante && (
        <Link
          href={`/estacionamientos/${est.id}`}
          className={cn(
            "relative z-10 mt-3 flex h-11 items-center justify-center gap-2 rounded-[16px] text-[15px] font-semibold",
            lleno ? "border border-line-strong bg-surface-raised text-ink" : "bg-brand text-on-brand hover:bg-brand-strong",
          )}
        >
          {lleno ? "Ver plano igual" : "Elegir mi lugar"}
          <CommonIcon name="siguiente" size={18} />
        </Link>
      )}
    </article>
  );
}
