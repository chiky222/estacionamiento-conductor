"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useReserva } from "@/contexts/ReservaContext";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCarga } from "@/hooks/useCarga";
import { useCotizacion } from "@/hooks/useCotizacion";
import { estacionamientosService } from "@/services/estacionamientos.service";
import { pagosService } from "@/services/pagos.service";
import { reservasService } from "@/services/reservas.service";
import { tarjetaService, type DatosTarjeta } from "@/services/tarjeta.service";
import { ApiError, mensajeDeError } from "@/lib/errors";
import { ars } from "@/lib/format";
import { normalizarPatente } from "@/lib/patente";
import { claseVehiculo } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonField } from "@/components/common/CommonField";
import { CommonLicensePlate } from "@/components/common/CommonLicensePlate";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonIcon } from "@/components/common/CommonIcon";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { IngresoForm } from "@/components/sesion/IngresoForm";
import { ModalidadPago, montosDe } from "@/components/checkout/ModalidadPago";
import { MediosPago } from "@/components/checkout/MediosPago";
import { FormTarjeta } from "@/components/checkout/FormTarjeta";
import { ResumenCompra } from "@/components/checkout/ResumenCompra";
import { crearEsquemaCheckout, type CheckoutForm } from "@/components/checkout/checkout.schema";

function Paso({ n, titulo, children, apagado }: { n: number; titulo: string; children: React.ReactNode; apagado?: boolean }) {
  return (
    <Card className={apagado ? "pointer-events-none opacity-50" : undefined} aria-disabled={apagado || undefined}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-full bg-brand-soft font-display text-sm font-bold text-brand-strong">{n}</span>
        <CommonTitle as="h2" className="text-[17px] leading-6">
          {titulo}
        </CommonTitle>
      </div>
      {children}
    </Card>
  );
}

/** Paso 3: datos, seña o total y medio de pago. Crea la reserva y su pago en el back. */
export function CheckoutView() {
  const router = useRouter();
  const r = useReserva();
  const { usuario, cargando: cargandoSesion } = useUserSession();
  const estId = r.seleccion?.estacionamientoId ?? null;
  const plazaId = r.seleccion?.plazaId ?? null;
  const { data: est } = useCarga(estId ? () => estacionamientosService.detalle(estId, r.vehiculo, r.desde, r.hasta) : null, [estId, r.vehiculo, r.desde, r.hasta]);
  const { data: medios } = useCarga(estId ? () => pagosService.medios(estId) : null, [estId]);
  const { cot, error: errCot } = useCotizacion(estId, plazaId, r.vehiculo, r.desde, r.hasta);
  // Una clave por intento de compra: si se toca "Pagar" dos veces o se corta la red, el back no duplica la reserva.
  const [enviado, setEnviado] = useState(false);
  const idempotencia = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  const esquema = useMemo(() => crearEsquemaCheckout(medios ?? [], (m) => (cot ? montosDe(cot, m).ahora > 0 : true)), [medios, cot]);
  const form = useForm<CheckoutForm>({ resolver: zodResolver(esquema), defaultValues: { patente: "", modalidad: "sena", tarjeta: {} } });
  const { register, watch, setValue, handleSubmit, formState } = form;
  const modalidad = watch("modalidad");
  const medioId = watch("medioId");
  const numeroTarjeta = watch("tarjeta.numero") ?? "";

  // Completa la patente con la última que usó.
  useEffect(() => {
    if (usuario?.patente && !form.getValues("patente")) setValue("patente", usuario.patente);
  }, [usuario, form, setValue]);
  // Con un solo medio habilitado, ya queda elegido.
  useEffect(() => {
    if (medios?.length && !form.getValues("medioId")) setValue("medioId", medios[0].id);
  }, [medios, form, setValue]);

  if (enviado) return <CommonLoading texto="Abriendo tu reserva…" />;
  if (r.listo && !r.seleccion)
    return (
      <main className="mx-auto max-w-[560px] p-4 pt-10">
        <CommonWarning>Primero elegí un lugar en el plano de un estacionamiento.</CommonWarning>
        <Link href="/" className="mt-4 inline-flex font-semibold text-brand-strong hover:underline">
          Ir al mapa
        </Link>
      </main>
    );
  if (!r.listo || !est || !cot || !medios)
    return errCot ? (
      <main className="mx-auto max-w-[560px] p-4 pt-10">
        <CommonWarning>{errCot}</CommonWarning>
        <Link href={estId ? `/estacionamientos/${estId}` : "/"} className="mt-4 inline-flex font-semibold text-brand-strong hover:underline">
          Elegir otro lugar
        </Link>
      </main>
    ) : (
      <CommonLoading texto="Preparando tu reserva…" />
    );

  const { ahora } = montosDe(cot, modalidad);
  const medio = medios.find((m) => m.id === medioId);
  const logueado = !!usuario;

  const pagar = handleSubmit(async (f) => {
    try {
      const tokenTarjeta = ahora > 0 && medio?.flujo === "tarjeta" ? await tarjetaService.tokenizar(f.tarjeta as unknown as DatosTarjeta) : undefined;
      const { reserva, pago } = await reservasService.crear(
        {
          estacionamientoId: est.id,
          plazaId: cot.plazaId,
          vehiculo: r.vehiculo,
          patente: normalizarPatente(f.patente),
          desde: cot.desde,
          hasta: cot.hasta,
          modalidad: f.modalidad,
          medioPagoId: ahora > 0 ? f.medioId : undefined,
          tokenTarjeta,
        },
        idempotencia.current,
      );
      setEnviado(true);
      r.limpiarSeleccion();
      // Mercado Pago, MODO…: el pago se completa en la pasarela, que después vuelve a la reserva.
      if (pago?.redirectUrl) {
        if (pago.redirectUrl.startsWith("/")) router.push(pago.redirectUrl);
        else window.location.href = pago.redirectUrl;
        return;
      }
      if (pago?.estado === "rechazado") toast.error(mensajeDeError(new ApiError(409, "PAGO_RECHAZADO")));
      router.push(`/reservas/${reserva.id}`);
    } catch (e) {
      toast.error(mensajeDeError(e));
      // Si el lugar se ocupó mientras pagaba, vuelve al plano a elegir otro.
      if (e instanceof ApiError && (e.code === "PLAZA_NO_DISPONIBLE" || e.code === "SOLD_OUT")) {
        r.limpiarSeleccion();
        router.push(`/estacionamientos/${est.id}`);
      }
    }
  });

  const textoBoton = !logueado ? "Ingresá para continuar" : ahora > 0 ? `Pagar ${ars(ahora)}${medio?.flujo === "redireccion" ? ` con ${medio.nombre}` : ""}` : "Confirmar reserva";
  const boton = (
    <CommonButton type="submit" color={ahora > 0 ? "pay" : "primary"} icon={ahora > 0 ? "tarjeta" : "check"} className="w-full" loading={formState.isSubmitting} disabled={!logueado}>
      {textoBoton}
    </CommonButton>
  );

  return (
    <main className="mx-auto max-w-[1100px] p-4 pb-28 lg:pb-10">
      <Link href={`/estacionamientos/${est.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
        <CommonIcon name="anterior" size={16} />
        Cambiar lugar u horario
      </Link>
      <CommonTitle as="h1" className="mt-2 mb-4">
        Confirmá y pagá
      </CommonTitle>
      {/* Fuera del <form> del checkout: el ingreso tiene su propio formulario. */}
      {!logueado && !cargandoSesion && (
        <Card className="mb-4 max-w-[640px]">
          <CommonTitle as="h2" className="mb-1 text-[17px] leading-6">
            Ingresá para reservar
          </CommonTitle>
          <p className="mt-0 mb-3 text-sm text-ink-muted">Tu lugar sigue elegido: no perdés nada.</p>
          <IngresoForm volver="/checkout" />
        </Card>
      )}
      <form onSubmit={pagar} noValidate className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-4">
          <Paso n={1} titulo="Tu vehículo" apagado={!logueado}>
            <div className="flex flex-wrap items-end gap-4">
              <CommonField label={`Patente del ${claseVehiculo(r.vehiculo).label.toLowerCase()}`} error={formState.errors.patente?.message} className="min-w-[220px] flex-1">
                <Input autoComplete="off" placeholder="AB 123 CD" className="font-mono uppercase" {...register("patente")} />
              </CommonField>
              {normalizarPatente(watch("patente")) && <CommonLicensePlate value={normalizarPatente(watch("patente"))} />}
            </div>
            <p className="mt-2 mb-0 text-[13px] text-ink-muted">Con la patente te reconocen en la entrada y el lugar queda a tu nombre.</p>
          </Paso>
          <Paso n={2} titulo="¿Cómo querés pagar?" apagado={!logueado}>
            <ModalidadPago cot={cot} value={modalidad} onChange={(m) => setValue("modalidad", m)} />
          </Paso>
          {ahora > 0 && (
            <Paso n={3} titulo="Medio de pago" apagado={!logueado}>
              <MediosPago medios={medios} value={medioId} onChange={(id) => setValue("medioId", id, { shouldValidate: formState.isSubmitted })}>
                {medio?.flujo === "tarjeta" && <FormTarjeta register={register} errors={formState.errors.tarjeta as never} numero={numeroTarjeta} />}
                {medio?.flujo === "redireccion" && <p className="m-0 text-[13px] text-ink-muted">Te llevamos a {medio.nombre} para pagar y volvés acá con tu reserva confirmada.</p>}
                {medio?.flujo === "qr" && <p className="m-0 text-[13px] text-ink-muted">Te mostramos un QR para escanear con la app de tu banco.</p>}
              </MediosPago>
              {formState.errors.medioId && <CommonWarning>{formState.errors.medioId.message}</CommonWarning>}
            </Paso>
          )}
          <div className="lg:hidden">{boton}</div>
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-[72px]">
          <ResumenCompra est={est} cot={cot} vehiculo={r.vehiculo} modalidad={modalidad}>
            <div className="hidden lg:block">{boton}</div>
          </ResumenCompra>
        </div>
      </form>
    </main>
  );
}
