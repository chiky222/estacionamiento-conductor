import type { EstacionamientoResumen } from "@/lib/conductor.types";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

interface Props {
  est: EstacionamientoResumen;
  seleccionado: boolean;
  onClick: () => void;
}

/**
 * Pin del mapa con el precio: petróleo si hay lugar, ámbar si quedan pocos, gris tachado si está lleno.
 * Lo usan el mapa de Google (dentro de un AdvancedMarker) y el mapa de muestra.
 */
export function MarcadorPrecio({ est, seleccionado, onClick }: Props) {
  const lleno = est.estado === "sold_out";
  const pocos = est.estado === "pocos";
  const valor = "$" + Math.round(est.precioDesde.valor).toLocaleString("es-AR");
  const precio = est.precioDesde.modo === "unica" ? valor : `${valor}/h`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`${est.nombre}, ${lleno ? "sin lugar" : `desde ${precio}`}`}
      aria-pressed={seleccionado}
      className={cn(
        "group relative flex -translate-x-1/2 -translate-y-full flex-col items-center transition-transform outline-none",
        seleccionado ? "z-20 scale-110" : "z-10 hover:z-20 hover:scale-105",
      )}
    >
      <span
        className={cn(
          "flex h-8 items-center gap-1 rounded-full border-2 pr-2.5 pl-1 text-[13px] font-bold whitespace-nowrap shadow-e2",
          lleno
            ? "border-surface-raised bg-surface-sunken text-ink-muted"
            : pocos
              ? "border-surface-raised bg-amber text-on-amber"
              : "border-surface-raised bg-brand text-on-brand",
          seleccionado && "border-ink",
        )}
      >
        <span className={cn("grid size-6 place-items-center rounded-full", lleno ? "bg-surface-raised" : "bg-surface-raised/25")}>
          <CommonIcon name={lleno ? "cerrar" : "estacionamiento"} size={15} strokeWidth={2.25} />
        </span>
        {lleno ? <span>Sold-out</span> : <span className="font-display tabular">{precio}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "-mt-[5px] size-2.5 rotate-45 border-r-2 border-b-2",
          lleno ? "border-surface-raised bg-surface-sunken" : pocos ? "border-surface-raised bg-amber" : "border-surface-raised bg-brand",
          seleccionado && "border-ink",
        )}
      />
    </button>
  );
}

/** Punto azul de "estás acá". */
export function MarcadorUbicacion() {
  return (
    <span className="pointer-events-none relative block size-4 -translate-x-1/2 -translate-y-1/2" aria-label="Tu ubicación">
      <span className="mapa-pulso absolute inset-0 rounded-full" style={{ background: "var(--map-me)" }} />
      <span className="absolute inset-0 rounded-full border-[3px] border-surface-raised shadow-e1" style={{ background: "var(--map-me)" }} />
    </span>
  );
}
