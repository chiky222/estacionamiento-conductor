"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Reserva } from "@/lib/conductor.types";
import { useCarga } from "@/hooks/useCarga";
import { pagosService } from "@/services/pagos.service";
import { reservasService } from "@/services/reservas.service";
import { tarjetaService, type DatosTarjeta } from "@/services/tarjeta.service";
import { ApiError, mensajeDeError } from "@/lib/errors";
import { ars } from "@/lib/format";
import { horaDe } from "@/lib/conductor";
import { Card } from "@/components/ui/card";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { MediosPago } from "@/components/checkout/MediosPago";
import { FormTarjeta } from "@/components/checkout/FormTarjeta";
import { crearEsquemaCheckout, type CheckoutForm } from "@/components/checkout/checkout.schema";

/** Minutos y segundos que faltan para que se libere el lugar retenido. */
function useCuentaRegresiva(hasta?: string) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const resto = hasta ? Math.max(0, new Date(hasta).getTime() - ahora) : 0;
  return `${Math.floor(resto / 60000)}:${String(Math.floor((resto % 60000) / 1000)).padStart(2, "0")}`;
}

/** El pago se rechazó o quedó a medias: se puede pagar de nuevo mientras el lugar sigue retenido. */
export function PagoPendiente({ reserva, onPagado }: { reserva: Reserva; onPagado: () => void }) {
  const router = useRouter();
  const { data: medios } = useCarga(() => pagosService.medios(reserva.estacionamiento.id), [reserva.estacionamiento.id]);
  const monto = reserva.modalidad === "total" ? reserva.total : reserva.sena;
  const resto = useCuentaRegresiva(reserva.retenidaHasta);
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(crearEsquemaCheckout(medios ?? [], () => true)),
    defaultValues: { patente: reserva.patente, modalidad: reserva.modalidad, medioId: reserva.pago?.medioId, tarjeta: {} },
  });
  const medioId = form.watch("medioId");
  const medio = medios?.find((m) => m.id === medioId);

  const pagar = form.handleSubmit(async (f) => {
    try {
      const tokenTarjeta = medio?.flujo === "tarjeta" ? await tarjetaService.tokenizar(f.tarjeta as unknown as DatosTarjeta) : undefined;
      const { pago } = await reservasService.reintentarPago(reserva.id, { medioPagoId: f.medioId, tokenTarjeta });
      if (pago.redirectUrl) return router.push(pago.redirectUrl);
      if (pago.estado === "rechazado") toast.error(mensajeDeError(new ApiError(409, "PAGO_RECHAZADO")));
      onPagado();
    } catch (e) {
      toast.error(mensajeDeError(e));
      onPagado();
    }
  });

  return (
    <Card className="flex flex-col gap-3">
      <CommonTitle>Completá el pago</CommonTitle>
      {reserva.pago?.estado === "rechazado" && <CommonWarning className="mt-0">El pago con {medios?.find((m) => m.id === reserva.pago?.medioId)?.nombre ?? "ese medio"} fue rechazado. Probá de nuevo o con otro medio.</CommonWarning>}
      <p className="m-0 text-sm text-ink-muted">
        Te guardamos el lugar hasta las {reserva.retenidaHasta ? horaDe(reserva.retenidaHasta) : "—"} (quedan <span className="font-semibold text-ink tabular">{resto}</span>). Después se libera para otro conductor.
      </p>
      {medios && (
        <form onSubmit={pagar} noValidate className="flex flex-col gap-3">
          <MediosPago medios={medios} value={medioId} onChange={(id) => form.setValue("medioId", id)}>
            {medio?.flujo === "tarjeta" && <FormTarjeta register={form.register} errors={form.formState.errors.tarjeta as never} numero={form.watch("tarjeta.numero") ?? ""} />}
          </MediosPago>
          <CommonButton type="submit" color="pay" icon="tarjeta" loading={form.formState.isSubmitting}>
            Pagar {ars(monto)}
          </CommonButton>
        </form>
      )}
    </Card>
  );
}
