"use client";

import { useMemo, useState } from "react";
import { useReserva } from "@/contexts/ReservaContext";
import { useCarga } from "@/hooks/useCarga";
import { estacionamientosService } from "@/services/estacionamientos.service";
import { CENTRO_DEFECTO } from "@/lib/conductor";
import { plural } from "@/lib/format";
import { MapaEstacionamientos } from "@/components/mapa/MapaEstacionamientos";
import { TarjetaEstacionamiento } from "@/components/explorar/TarjetaEstacionamiento";
import { FiltrosBusqueda } from "@/components/explorar/FiltrosBusqueda";
import { LeyendaMapa } from "@/components/explorar/LeyendaMapa";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { CommonSpinner } from "@/components/common/CommonSpinner";

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Pantalla principal: mapa con los estacionamientos que usan la app (precio y si hay lugar) y la lista.
 * En compu la lista va a la izquierda; en el celular, debajo del mapa.
 */
export function ExplorarView() {
  const { vehiculo, listo } = useReserva();
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [soloConLugar, setSoloConLugar] = useState(false);
  const [texto, setTexto] = useState("");
  const centro = CENTRO_DEFECTO;

  // La disponibilidad cambia todo el tiempo: se refresca cada 30 s.
  const { data, cargando, error } = useCarga(
    listo ? () => estacionamientosService.listar({ vehiculo, cerca: centro, soloConLugar }) : null,
    [listo, vehiculo, soloConLugar],
    { cadaMs: 30000 },
  );

  const lista = useMemo(() => {
    const t = normalizar(texto.trim());
    const todos = data ?? [];
    return t ? todos.filter((e) => normalizar(`${e.nombre} ${e.direccion} ${e.barrio}`).includes(t)) : todos;
  }, [data, texto]);
  const conLugar = lista.filter((e) => e.estado !== "sold_out").length;
  const seleccionado = lista.find((e) => e.id === seleccionadoId) ?? null;

  if (!listo) return <CommonLoading />;

  return (
    <main className="lg:grid lg:h-[calc(100dvh-57px)] lg:grid-cols-[minmax(360px,440px)_1fr]">
      <section className="relative h-[58dvh] min-h-[340px] lg:col-start-2 lg:row-start-1 lg:h-auto">
        <MapaEstacionamientos estacionamientos={lista} seleccionadoId={seleccionadoId} onSeleccionar={setSeleccionadoId} centro={centro} />
        <LeyendaMapa className="absolute top-3 left-3 z-10" />
        {cargando && data && (
          <span className="absolute top-14 left-3 z-10 rounded-full bg-surface-glass p-1.5 shadow-e1">
            <CommonSpinner className="text-brand" />
          </span>
        )}
        {seleccionado && (
          <div className="absolute inset-x-3 bottom-8 z-20 mx-auto max-w-[420px] lg:right-auto lg:left-4">
            <TarjetaEstacionamiento est={seleccionado} vehiculo={vehiculo} flotante />
          </div>
        )}
      </section>

      <aside className="flex min-h-0 flex-col border-line lg:col-start-1 lg:row-start-1 lg:border-r">
        <div className="border-b border-line bg-surface p-4">
          <CommonTitle as="h1" className="mb-1 text-[24px] leading-[30px]">
            ¿Dónde estacionás?
          </CommonTitle>
          <p className="mt-0 mb-3 text-sm text-ink-muted">Elegí el estacionamiento, después tu lugar en el plano, y reservalo pagando la seña o el total.</p>
          <FiltrosBusqueda texto={texto} onTexto={setTexto} soloConLugar={soloConLugar} onSoloConLugar={setSoloConLugar} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error && <CommonWarning>{error}</CommonWarning>}
          {cargando && !data ? (
            <CommonLoading texto="Buscando estacionamientos…" />
          ) : (
            <>
              <p className="mt-0 mb-3 text-[13px] font-semibold text-ink-muted" aria-live="polite">
                {plural(lista.length, "estacionamiento", "estacionamientos")} cerca · {conLugar} con lugar ahora
              </p>
              <div className="flex flex-col gap-3">
                {lista.map((e) => (
                  <TarjetaEstacionamiento key={e.id} est={e} vehiculo={vehiculo} seleccionado={e.id === seleccionadoId} onSeleccionar={() => setSeleccionadoId(e.id)} />
                ))}
                {!lista.length && <p className="text-sm text-ink-muted">No encontramos estacionamientos con esos filtros.</p>}
              </div>
            </>
          )}
        </div>
      </aside>
    </main>
  );
}
