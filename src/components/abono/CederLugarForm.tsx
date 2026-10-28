"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aMinutos } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { CommonButton } from "@/components/common/CommonButton";
import { CommonField } from "@/components/common/CommonField";

const DIAS = 7;

const esquema = z
  .object({
    dia: z.coerce.number().int().min(0).max(DIAS - 1),
    desde: z.string().regex(/^\d{2}:\d{2}$/, "Elegí la hora"),
    hasta: z.string().regex(/^\d{2}:\d{2}$/, "Elegí la hora"),
  })
  .refine((f) => aMinutos(f.hasta) > aMinutos(f.desde), { path: ["hasta"], message: "Tiene que ser después del inicio" });
type Form = z.input<typeof esquema>;

/** ISO de una hora ("09:30") de un día a `dia` días de hoy, en hora local. */
function isoDe(dia: number, hora: string) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dia);
  d.setMinutes(aMinutos(hora));
  return d.toISOString();
}

/** Elegir un día de la próxima semana y el horario en que no se va a usar el lugar. */
export function CederLugarForm({ enviando, onCeder }: { enviando: boolean; onCeder: (desde: string, hasta: string) => Promise<boolean> }) {
  const dias = useMemo(
    () =>
      [...Array(DIAS).keys()].map((i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const label = i === 0 ? "Hoy" : i === 1 ? "Mañana" : d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "2-digit" });
        return { value: i, label: label.charAt(0).toUpperCase() + label.slice(1) };
      }),
    [],
  );
  const { register, handleSubmit, formState, reset } = useForm<Form>({ resolver: zodResolver(esquema), defaultValues: { dia: 1, desde: "09:00", hasta: "18:00" } });
  const { errors } = formState;

  const enviar = handleSubmit(async (f) => {
    const dia = Number(f.dia);
    if (await onCeder(isoDe(dia, f.desde), isoDe(dia, f.hasta))) reset({ dia, desde: f.desde, hasta: f.hasta });
  });

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <CommonField label="Día" error={errors.dia?.message}>
        <NativeSelect {...register("dia")}>
          {dias.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </NativeSelect>
      </CommonField>
      <div className="grid grid-cols-2 gap-3">
        <CommonField label="Desde" error={errors.desde?.message}>
          <Input type="time" step={900} {...register("desde")} />
        </CommonField>
        <CommonField label="Hasta" error={errors.hasta?.message}>
          <Input type="time" step={900} {...register("hasta")} />
        </CommonField>
      </div>
      <CommonButton type="submit" color="primary" icon="mas" loading={enviando}>
        Ceder mi lugar en ese horario
      </CommonButton>
    </form>
  );
}
