import Link from "next/link";
import type { EstacionamientoDetalle } from "@/lib/conductor.types";
import { SERVICIOS, textoDistancia } from "@/lib/conductor";
import { CommonIcon } from "@/components/common/CommonIcon";
import { CommonPill, CommonTag } from "@/components/common/CommonPill";
import { CommonTitle } from "@/components/common/CommonText";
import { EstadoPill } from "@/components/mapa/EstadoPill";

export const urlComoLlegar = (u: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}`;

/** Nombre, dirección, estado y servicios del estacionamiento. */
export function CabeceraEstacionamiento({ est }: { est: EstacionamientoDetalle }) {
  return (
    <header className="flex flex-col gap-3">
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
        <CommonIcon name="anterior" size={16} />
        Volver al mapa
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CommonTitle as="h1">{est.nombre}</CommonTitle>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            {est.direccion} · {est.barrio}
            {est.distancia != null && ` · a ${textoDistancia(est.distancia)}`}
          </p>
        </div>
        <a
          href={urlComoLlegar(est.ubicacion)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface-raised px-3 text-sm font-semibold hover:bg-surface-sunken"
        >
          <CommonIcon name="navegar" size={16} />
          Cómo llegar
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <EstadoPill estado={est.estado} />
        {est.calificacion && (
          <CommonPill icon="estrella" tone="amber">
            {est.calificacion.toLocaleString("es-AR")}
          </CommonPill>
        )}
        <CommonPill icon="reloj">{est.horario}</CommonPill>
        <CommonPill icon="ticket" tone="coral">
          {est.senaPct > 0 ? `Reservás con ${est.senaPct} % de seña` : "Reservás sin seña"}
        </CommonPill>
        {est.evento && <CommonTag>{est.evento}</CommonTag>}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px] text-ink-muted">
        {est.servicios.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <CommonIcon name={SERVICIOS[s].icon} size={16} />
            {SERVICIOS[s].label}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <CommonIcon name="reloj" size={16} />
          Te guardamos el lugar {est.toleranciaMin} min después de tu hora de llegada
        </li>
      </ul>
    </header>
  );
}
