"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCarga } from "@/hooks/useCarga";
import { pagosService } from "@/services/pagos.service";
import { mensajeDeError } from "@/lib/errors";
import { ars } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonLoading } from "@/components/common/CommonLoading";
import { CommonPill } from "@/components/common/CommonPill";
import { CommonTitle, CommonWarning } from "@/components/common/CommonText";
import { CodigoQr } from "@/components/reservas/CodigoQr";

const NOMBRES: Record<string, string> = { mercadopago: "Mercado Pago", modo: "MODO" };

/**
 * Solo con la API simulada: hace de pantalla de la pasarela (Checkout Pro, MODO…) para probar el flujo
 * completo. En producción el conductor va al sitio de la pasarela y vuelve a /reservas/:id.
 */
export function PagoSimuladoView() {
  const router = useRouter();
  const id = useSearchParams().get("pago") ?? "";
  const { data: pago, error } = useCarga(() => pagosService.estado(id), [id]);
  const [enviando, setEnviando] = useState<"si" | "no" | null>(null);

  if (error) return <main className="mx-auto max-w-[460px] p-4 pt-10"><CommonWarning>{error}</CommonWarning></main>;
  if (!pago) return <CommonLoading />;

  const resolver = async (aprobar: boolean) => {
    setEnviando(aprobar ? "si" : "no");
    try {
      await pagosService.simular(pago.id, aprobar);
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
    router.replace(`/reservas/${pago.reservaId}`);
  };
  const qr = pago.pasarela === "modo";

  return (
    <main className="mx-auto max-w-[460px] p-4 pt-8">
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <CommonPill tone="amber" icon="alerta" size="sm">
          Pasarela simulada · modo de prueba
        </CommonPill>
        <CommonTitle as="h1" className="text-2xl">
          {NOMBRES[pago.pasarela] ?? pago.pasarela}
        </CommonTitle>
        <div className="font-display text-[40px] leading-[44px] font-bold text-coral-text tabular">{ars(pago.monto)}</div>
        {qr ? (
          <>
            <CodigoQr valor={`pago-de-prueba:${pago.id}`} tam={200} />
            <p className="m-0 text-sm text-ink-muted">Escaneá el QR con la app de tu banco. Acá podés simular lo que contesta.</p>
          </>
        ) : (
          <p className="m-0 text-sm text-ink-muted">En producción acá se abre {NOMBRES[pago.pasarela] ?? "la pasarela"} y, al terminar, vuelve sola a tu reserva.</p>
        )}
        {pago.estado !== "pendiente" ? (
          <CommonButton color="primary" onClick={() => router.replace(`/reservas/${pago.reservaId}`)}>
            Volver a la reserva
          </CommonButton>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <CommonButton color="pay" icon="check" loading={enviando === "si"} disabled={!!enviando} onClick={() => resolver(true)}>
              Aprobar pago
            </CommonButton>
            <CommonButton color="secondary" loading={enviando === "no"} disabled={!!enviando} onClick={() => resolver(false)}>
              Rechazar pago
            </CommonButton>
          </div>
        )}
      </Card>
    </main>
  );
}
