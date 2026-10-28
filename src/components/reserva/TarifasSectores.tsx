"use client";

import type { ClaseVehiculo } from "@/lib/types";
import type { PlanoPublico } from "@/lib/conductor.types";
import { claseVehiculo, colorSector } from "@/lib/constants";
import { ars, plural } from "@/lib/format";
import { vehiculosPermitidos } from "@/lib/plano";
import { libresSector, tarifaDelSector, textoPrecio } from "@/lib/conductor";
import { cn } from "@/lib/utils";
import { CommonTag } from "@/components/common/CommonPill";
import { CommonEyebrow } from "@/components/common/CommonText";

interface Props {
  plano: PlanoPublico;
  vehiculo: ClaseVehiculo;
  sectorElegido?: string;
  /** Elige el mejor lugar libre de ese sector. */
  onElegirSector: (sectorId: string) => void;
}

/** Precio vigente de cada sector (con reglas y eventos ya aplicados) y cuántos lugares le quedan. */
export function TarifasSectores({ plano, vehiculo, sectorElegido, onElegirSector }: Props) {
  const pisos = new Map(plano.pisos.map((p) => [p.id, p.nombre]));
  const varios = plano.pisos.length > 1;
  return (
    <div>
      <CommonEyebrow>Tarifas por sector</CommonEyebrow>
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {plano.sectores.map((s) => {
          const t = tarifaDelSector(plano, s.id);
          const apto = vehiculosPermitidos(s).includes(vehiculo);
          const libres = libresSector(plano, s, vehiculo);
          const cambia = t && t.modo === "hora" && t.valor !== t.base;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!libres}
                onClick={() => onElegirSector(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[16px] border bg-surface-raised p-3 text-left transition-colors enabled:hover:border-brand disabled:cursor-default",
                  sectorElegido === s.id ? "border-brand" : "border-line",
                  !apto && "opacity-60",
                )}
              >
                <span className="grid size-9 flex-none place-items-center rounded-[10px] font-display text-base font-bold" style={{ background: colorSector(s.color), color: "var(--on-sector)" }}>
                  {s.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {s.nombre}
                    {varios && <span className="font-normal text-ink-muted"> · {pisos.get(s.pisoId)}</span>}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {!apto
                      ? `Solo ${vehiculosPermitidos(s).map((v) => claseVehiculo(v).plural.toLowerCase()).join(" y ")}`
                      : libres
                        ? plural(libres, "lugar libre", "lugares libres")
                        : "Sin lugares libres"}
                    {t && t.modo === "hora" && ` · fracción ${t.fraccion} min${t.tope ? ` · tope ${ars(t.tope)}` : ""}`}
                  </span>
                  {t?.reglas.map((r) => (
                    <CommonTag key={r} className="mt-1 mr-1">
                      {r}
                    </CommonTag>
                  ))}
                </span>
                {t && (
                  <span className="text-right">
                    <span className="block font-display text-base font-bold whitespace-nowrap text-coral-text tabular">{textoPrecio(t)}</span>
                    {cambia && <span className="block text-xs text-ink-muted line-through">{ars(t.base)}/h</span>}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
