"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useCarga } from "@/hooks/useCarga";
import { reservasService } from "@/services/reservas.service";
import { estacionamientosService } from "@/services/estacionamientos.service";
import { mensajeDeError } from "@/lib/errors";
import { datosPlaza } from "@/lib/conductor";
import { Card } from "@/components/ui/card";
import { CommonIcon } from "@/components/common/CommonIcon";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonConfirmButton } from "@/components/common/CommonConfirmButton";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { ComprobanteReserva } from "@/components/reservas/ComprobanteReserva";
import { PagoPendiente } from "@/components/reservas/PagoPendiente";
import { PlanoReserva } from "@/components/plano/PlanoReserva";
import { urlComoLlegar } from "@/components/reserva/CabeceraEstacionamiento";

const TITULOS = {
  pendiente_pago: ["Falta un paso", "Completá el pago para confirmar tu lugar."],
  confirmada: ["¡Listo! Tu lugar te espera", "Mostrá el código o el QR en la entrada."],
  en_curso: ["Estás estacionado", "Al salir pagás lo que falte en la caja."],
  finalizada: ["Reserva finalizada", "Gracias por estacionar con nosotros."],
  cancelada: ["Reserva cancelada", "El lugar quedó libre para otro conductor."],
  vencida: ["Venció el tiempo para pagar", "El lugar se liberó. Podés elegir otro."],
} as const;

/** Comprobante de una reserva, con el plano para ver dónde queda el lugar. */
export function ReservaView({ id }: { id: string }) {
  // Mientras el pago está pendiente se consulta seguido (hasta que llegue el webhook de la pasarela).
  const { data: r, error, cargando, recargar } = useCarga(() => reservasService.detalle(id), [id], { cadaMs: 5000 });
  const { data: est } = useCarga(r ? () => estacionamientosService.detalle(r.estacionamiento.id, r.vehiculo) : null, [r?.estacionamiento.id]);

  if (cargando && !r) return <CommonLoading />;
  if (error || !r)
    return (
      <main className="mx-auto max-w-[560px] p-4 pt-10">
        <CommonWarning>{error ?? "No encontramos la reserva."}</CommonWarning>
      </main>
    );

  const [titulo, sub] = TITULOS[r.estado];
  const cancelable = r.estado === "pendiente_pago" || (r.estado === "confirmada" && new Date(r.desde).getTime() > Date.now());
  const piso = est ? datosPlaza(est.plano, r.plazaId)?.sector.pisoId : undefined;
  const cancelar = async () => {
    try {
      const c = await reservasService.cancelar(r.id);
      toast.success(c.reembolso ? `Reserva cancelada. Te devolvemos $ ${c.reembolso.toLocaleString("es-AR")}.` : "Reserva cancelada.");
      recargar();
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] p-4 pb-10">
      <div className="mb-4 flex items-start gap-3">
        {r.estado === "confirmada" && (
          <span className="grid size-12 flex-none place-items-center rounded-full bg-brand text-on-brand shadow-brand">
            <CommonIcon name="check" size={26} strokeWidth={2.5} />
          </span>
        )}
        <div>
          <CommonTitle as="h1">{titulo}</CommonTitle>
          <p className="m-0 mt-1 text-sm text-ink-muted">{sub}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[400px_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          {r.estado === "pendiente_pago" && <PagoPendiente reserva={r} onPagado={recargar} />}
          <ComprobanteReserva reserva={r} />
          <div className="flex flex-wrap gap-2">
            <a href={urlComoLlegar(r.estacionamiento.ubicacion)} target="_blank" rel="noreferrer" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-brand px-5 font-semibold text-on-brand hover:bg-brand-strong">
              <CommonIcon name="navegar" size={18} />
              Cómo llegar
            </a>
            {cancelable && (
              <CommonConfirmButton color="danger" onConfirm={cancelar} confirmLabel={r.sena && r.estado === "confirmada" ? "La seña no se devuelve. ¿Cancelar?" : "Tocá otra vez para cancelar"}>
                Cancelar reserva
              </CommonConfirmButton>
            )}
          </div>
          <Link href="/reservas" className="text-sm font-semibold text-brand-strong hover:underline">
            Ver todas mis reservas
          </Link>
        </div>
        <Card className="flex flex-col gap-3">
          <div>
            <CommonTitle>Dónde queda tu lugar</CommonTitle>
            <p className="m-0 mt-1 text-sm text-ink-muted">
              {r.estacionamiento.nombre} · {r.estacionamiento.direccion}
              {r.pisoNombre && est && est.plano.pisos.length > 1 ? ` · ${r.pisoNombre}` : ""}
            </p>
          </div>
          {est && piso ? <PlanoReserva plano={est.plano} pisoId={piso} vehiculo={r.vehiculo} seleccionId={r.plazaId} /> : <CommonLoading texto="Cargando el plano…" />}
        </Card>
      </div>
    </main>
  );
}
