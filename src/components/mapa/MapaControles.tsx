import { CommonIcon } from "@/components/common/CommonIcon";

/** Botones de zoom y "mi ubicación" (los mismos en el mapa de Google y en el de muestra). */
export function MapaControles({ onAcercar, onAlejar, onCentrar }: { onAcercar: () => void; onAlejar: () => void; onCentrar: () => void }) {
  const boton = "grid size-10 place-items-center bg-surface-raised text-ink hover:bg-surface-sunken";
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex flex-col overflow-hidden rounded-[10px] border border-line shadow-e1">
        <button type="button" className={boton} onClick={onAcercar} aria-label="Acercar">
          <CommonIcon name="mas" size={18} />
        </button>
        <span className="h-px bg-line" />
        <button type="button" className={boton} onClick={onAlejar} aria-label="Alejar">
          <CommonIcon name="menos" size={18} />
        </button>
      </div>
      <button type="button" className={`${boton} rounded-[10px] border border-line shadow-e1`} onClick={onCentrar} aria-label="Ir a mi ubicación">
        <CommonIcon name="ubicacionActual" size={18} />
      </button>
    </div>
  );
}
