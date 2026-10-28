"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MiAbono } from "@/lib/conductor.types";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCarga } from "@/hooks/useCarga";
import { abonosService } from "@/services/abonos.service";
import { mensajeDeError } from "@/lib/errors";
import { Card } from "@/components/ui/card";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { IngresoForm } from "@/components/sesion/IngresoForm";
import { TarjetaAbono } from "@/components/abono/TarjetaAbono";

/** "Mi abono": el lugar que alquila por mes y los horarios en que lo cede para que se alquile. */
export function MiAbonoView() {
  const { usuario, cargando: cargandoSesion } = useUserSession();
  const { data, cargando, error } = useCarga(usuario ? () => abonosService.mios() : null, [usuario?.id]);
  // Después de ceder o quitar, el back devuelve el abono actualizado: se reemplaza en la lista.
  const [abonos, setAbonos] = useState<MiAbono[] | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  useEffect(() => setAbonos(data), [data]);

  const reemplazar = (a: MiAbono) => setAbonos((l) => (l ?? []).map((x) => (x.estacionamiento.id === a.estacionamiento.id && x.plazaId === a.plazaId ? a : x)));

  const accion = async (clave: string, fn: () => Promise<MiAbono>, ok: string) => {
    setPendiente(clave);
    try {
      reemplazar(await fn());
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error(mensajeDeError(e));
      return false;
    } finally {
      setPendiente(null);
    }
  };

  if (cargandoSesion) return <CommonLoading />;
  if (!usuario)
    return (
      <main className="mx-auto max-w-[420px] p-4 pt-10">
        <Card className="p-6">
          <CommonTitle as="h1" className="mb-4 text-2xl">
            Ingresá para ver tu abono
          </CommonTitle>
          <IngresoForm volver="/abono" />
        </Card>
      </main>
    );

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-4 p-4 pb-10">
      <CommonTitle as="h1">Mi abono</CommonTitle>
      {error && <CommonWarning>{error}</CommonWarning>}
      {cargando && !abonos ? (
        <CommonLoading />
      ) : !abonos?.length ? (
        <Card>
          <p className="m-0">No tenés un abono mensual en un estacionamiento que permita ceder el lugar.</p>
        </Card>
      ) : (
        abonos.map((a) => (
          <TarjetaAbono
            key={a.estacionamiento.id + a.plazaId}
            abono={a}
            pendiente={pendiente}
            onCeder={(desde, hasta) => accion("ceder", () => abonosService.ceder(a.estacionamiento.id, a.plazaId, { desde, hasta }), "Listo: tu lugar queda cedido en ese horario")}
            onQuitar={(id) => void accion("quitar:" + id, () => abonosService.quitarCesion(a.estacionamiento.id, a.plazaId, id), "Quitaste ese horario")}
          />
        ))
      )}
    </main>
  );
}
