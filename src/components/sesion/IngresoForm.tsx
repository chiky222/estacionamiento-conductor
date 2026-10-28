"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUserSession } from "@/contexts/UserSessionContext";
import { sesionService } from "@/services/sesion.service";
import { config } from "@/lib/config";
import { mensajeDeError } from "@/lib/errors";
import { Input } from "@/components/ui/input";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonField } from "@/components/common/CommonField";

const esquema = z.object({
  nombre: z.string().trim().max(40).optional(),
  email: z.string().trim().email("Ingresá un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Form = z.infer<typeof esquema>;

/** Ingreso con Google o con email. `volver` = adónde ir después del login con Google (redirige el back). */
export function IngresoForm({ volver = "/", onListo }: { volver?: string; onListo?: () => void }) {
  const { ingresar, registrarse, refrescar } = useUserSession();
  const [nueva, setNueva] = useState(false);
  const [conGoogle, setConGoogle] = useState(false);
  const { register, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(esquema) });

  const google = async () => {
    if (config.modoApi !== "mock") {
      window.location.href = sesionService.urlGoogle(volver);
      return;
    }
    // En la API simulada no hay Google: se ingresa con un usuario de prueba.
    setConGoogle(true);
    try {
      await sesionService.registrarse({ nombre: "Cris", email: "cris@ejemplo.com", password: "demo" });
      await refrescar();
      onListo?.();
    } finally {
      setConGoogle(false);
    }
  };

  const enviar = handleSubmit(async (f) => {
    try {
      if (nueva) await registrarse(f.nombre || f.email.split("@")[0], f.email, f.password);
      else await ingresar(f.email, f.password);
      onListo?.();
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <CommonButton type="button" color="secondary" className="w-full" onClick={google} loading={conGoogle}>
        <span aria-hidden className="grid size-5 place-items-center rounded-full border-[1.5px] border-current font-display text-[11px] font-bold">G</span>
        Continuar con Google
      </CommonButton>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />o con tu email<span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        {nueva && (
          <CommonField label="Nombre">
            <Input autoComplete="name" {...register("nombre")} />
          </CommonField>
        )}
        <CommonField label="Email" error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </CommonField>
        <CommonField label="Contraseña" error={formState.errors.password?.message}>
          <Input type="password" autoComplete={nueva ? "new-password" : "current-password"} {...register("password")} />
        </CommonField>
        <CommonButton type="submit" color="primary" loading={formState.isSubmitting}>
          {nueva ? "Crear cuenta" : "Ingresar"}
        </CommonButton>
      </form>
      <button type="button" className="text-sm font-semibold text-brand-strong hover:underline" onClick={() => setNueva((v) => !v)}>
        {nueva ? "Ya tengo cuenta" : "Es mi primera vez: crear cuenta"}
      </button>
    </div>
  );
}
