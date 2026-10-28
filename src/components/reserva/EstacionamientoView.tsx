"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useReserva } from "@/contexts/ReservaContext";
import { useCarga } from "@/hooks/useCarga";
import { useCotizacion } from "@/hooks/useCotizacion";
import { estacionamientosService } from "@/services/estacionamientos.service";
import { datosPlaza, mejorPlaza, plazaElegible } from "@/lib/conductor";
import { pisosOrdenados } from "@/lib/plano";
import { Card } from "@/components/ui/card";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { CabeceraEstacionamiento } from "@/components/reserva/CabeceraEstacionamiento";
import { SelectorVehiculo } from "@/components/reserva/SelectorVehiculo";
import { SelectorHorario } from "@/components/reserva/SelectorHorario";
import { TarifasSectores } from "@/components/reserva/TarifasSectores";
import { BarraContinuar, ResumenSeleccion } from "@/components/reserva/ResumenSeleccion";
import { PlanoReserva } from "@/components/plano/PlanoReserva";
import { PisoTabs } from "@/components/plano/PisoTabs";
import { LeyendaPlano } from "@/components/plano/LeyendaPlano";

/** Paso 2: el plano del estacionamiento para elegir el lugar, con las tarifas de cada sector. */
export function EstacionamientoView({ id }: { id: string }) {
  const router = useRouter();
  const r = useReserva();
  const { vehiculo, desde, hasta, listo } = r;
  // Los precios dependen de la hora de llegada (reglas horarias y eventos): se piden para ese momento.
  const { data: est, error, cargando } = useCarga(listo ? () => estacionamientosService.detalle(id, vehiculo, desde) : null, [listo, id, vehiculo, desde], { cadaMs: 20000 });
  const plazaId = r.seleccion?.estacionamientoId === id ? r.seleccion.plazaId : null;
  const [pisoId, setPisoId] = useState<string | null>(null);
  const { cot, error: errCot, cargando: cotizando } = useCotizacion(plazaId ? id : null, plazaId, vehiculo, desde, hasta);

  const plano = est?.plano;
  const pisoActual = useMemo(() => {
    if (!plano) return null;
    return pisoId ?? (plazaId ? datosPlaza(plano, plazaId)?.sector.pisoId : null) ?? pisosOrdenados(plano.pisos)[0].id;
  }, [plano, pisoId, plazaId]);

  // Si al refrescar el lugar elegido se ocupó (o ya no entra el vehículo), se avisa y se suelta.
  useEffect(() => {
    if (!plano || !plazaId) return;
    const info = datosPlaza(plano, plazaId);
    const p = plano.plazas[plazaId];
    if (!info || !p || !plazaElegible(p, info.sector, vehiculo)) {
      toast.warning("El lugar que elegiste se acaba de ocupar. Elegí otro.");
      r.limpiarSeleccion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plano, plazaId, vehiculo]);

  if (!listo || (cargando && !est)) return <CommonLoading texto="Cargando el plano…" />;
  if (error || !est || !plano || !pisoActual)
    return (
      <main className="mx-auto max-w-[720px] p-4">
        <CommonWarning>{error ?? "No encontramos el estacionamiento."}</CommonWarning>
      </main>
    );

  const elegir = (pid: string) => r.elegirPlaza(id, pid === plazaId ? null : pid);
  const elegirMejor = (sectorId?: string) => {
    const pid = mejorPlaza(plano, vehiculo, sectorId);
    if (!pid) return toast.info("No quedan lugares libres para tu vehículo.");
    r.elegirPlaza(id, pid);
    setPisoId(datosPlaza(plano, pid)?.sector.pisoId ?? null);
  };
  const continuar = () => router.push("/checkout");
  const info = plazaId ? datosPlaza(plano, plazaId) : null;

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4 pb-28 lg:pb-8">
      <CabeceraEstacionamiento est={est} />
      <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SelectorVehiculo />
        <SelectorHorario compacto maxHoras={est.reservaMaxHoras} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CommonTitle>Elegí tu lugar</CommonTitle>
            <PisoTabs plano={plano} vehiculo={vehiculo} value={pisoActual} onChange={setPisoId} />
          </div>
          <PlanoReserva plano={plano} pisoId={pisoActual} vehiculo={vehiculo} seleccionId={plazaId} onElegir={elegir} />
          <LeyendaPlano />
        </Card>
        <div className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <ResumenSeleccion
            est={est}
            plazaId={plazaId}
            cot={cot}
            cargando={cotizando}
            error={errCot}
            desde={desde}
            hasta={hasta}
            onElegirPorMi={() => elegirMejor()}
            onQuitar={r.limpiarSeleccion}
            onContinuar={continuar}
          />
          <TarifasSectores plano={plano} vehiculo={vehiculo} sectorElegido={info?.sector.id} onElegirSector={elegirMejor} />
        </div>
      </div>
      {info && <BarraContinuar etiqueta={info.etiqueta} cot={cot} onContinuar={continuar} />}
    </main>
  );
}
