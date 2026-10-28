"use client";

import Link from "next/link";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCarga } from "@/hooks/useCarga";
import { reservasService } from "@/services/reservas.service";
import { Card } from "@/components/ui/card";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { IngresoForm } from "@/components/sesion/IngresoForm";
import { TarjetaReserva } from "@/components/reservas/TarjetaReserva";

export function MisReservasView() {
  const { usuario, cargando: cargandoSesion, salir } = useUserSession();
  const { data, cargando, error } = useCarga(usuario ? () => reservasService.mias() : null, [usuario?.id]);
  if (cargandoSesion) return <CommonLoading />;
  if (!usuario)
    return (
      <main className="mx-auto max-w-[420px] p-4 pt-10">
        <Card className="p-6">
          <CommonTitle as="h1" className="mb-4 text-2xl">
            Ingresá para ver tus reservas
          </CommonTitle>
          <IngresoForm volver="/reservas" />
        </Card>
      </main>
    );
  const activas = (data ?? []).filter((r) => r.estado === "confirmada" || r.estado === "en_curso" || r.estado === "pendiente_pago");
  const pasadas = (data ?? []).filter((r) => !activas.includes(r));
  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-4 p-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <CommonTitle as="h1">Mis reservas</CommonTitle>
        <CommonButton size="sm" color="ghost" onClick={salir}>
          Salir
        </CommonButton>
      </div>
      {error && <CommonWarning>{error}</CommonWarning>}
      {cargando && !data ? (
        <CommonLoading />
      ) : !data?.length ? (
        <Card className="text-center">
          <p className="mt-0">Todavía no reservaste ningún lugar.</p>
          <Link href="/" className="font-semibold text-brand-strong hover:underline">
            Buscar estacionamiento
          </Link>
        </Card>
      ) : (
        <>
          {activas.map((r) => (
            <TarjetaReserva key={r.id} reserva={r} />
          ))}
          {pasadas.length > 0 && <h2 className="mt-4 mb-0 text-[11px] font-bold tracking-[.08em] text-ink-muted uppercase">Anteriores</h2>}
          {pasadas.map((r) => (
            <TarjetaReserva key={r.id} reserva={r} />
          ))}
        </>
      )}
    </main>
  );
}
