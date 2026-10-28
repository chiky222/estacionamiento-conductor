"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CommonTitle } from "@/components/common/CommonText";
import { IngresoForm } from "@/components/sesion/IngresoForm";

/** Login (a donde manda httpClient ante un 401), y vuelta a la pantalla en la que estaba. */
export function LoginView() {
  const router = useRouter();
  const volver = useSearchParams().get("volver") || "/";
  // Solo rutas internas, para que nadie arme un link que lleve a otro sitio después del login.
  const destino = volver.startsWith("/") && !volver.startsWith("//") ? volver : "/";
  return (
    <main className="mx-auto max-w-[420px] p-4 pt-10">
      <Card className="p-6">
        <CommonTitle as="h1" className="mb-1 text-2xl">
          Ingresá
        </CommonTitle>
        <p className="mt-0 mb-5 text-sm text-ink-muted">Para reservar y ver tus reservas.</p>
        <IngresoForm volver={destino} onListo={() => router.replace(destino)} />
      </Card>
    </main>
  );
}
