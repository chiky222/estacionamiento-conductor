"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { CommonField, CommonFormGrid } from "@/components/common/CommonField";
import { CommonHint } from "@/components/common/CommonText";
import { CommonIcon } from "@/components/common/CommonIcon";
import type { CheckoutForm } from "@/components/checkout/checkout.schema";

export const tarjetaSchema = z.object({
  numero: z.string().refine((v) => /^\d{15,16}$/.test(v.replace(/\s/g, "")), "Revisá el número de la tarjeta"),
  vence: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Usá el formato MM/AA")
    .refine((v) => {
      const [m, a] = v.split("/").map(Number);
      return new Date(2000 + a, m, 1) > new Date();
    }, "La tarjeta está vencida"),
  cvv: z.string().regex(/^\d{3,4}$/, "3 o 4 números"),
  titular: z.string().trim().min(3, "Como figura en la tarjeta"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI sin puntos"),
});
export type TarjetaForm = z.infer<typeof tarjetaSchema>;

/** Marca por los primeros números (solo para mostrarla; la valida la pasarela). */
export const marcaDe = (numero: string) => {
  const n = numero.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  if (/^589562/.test(n)) return "Naranja";
  if (/^6042/.test(n)) return "Cabal";
  return "";
};

/** Agrupa de a 4: "4509953566233704" → "4509 9535 6623 3704". */
export const formatoNumero = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
export const formatoVence = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

interface Props {
  register: UseFormRegister<CheckoutForm>;
  errors?: FieldErrors<TarjetaForm>;
  numero: string;
}

/** Datos de la tarjeta. No se mandan a nuestro back: se tokenizan con la pasarela (ver tarjeta.service). */
export function FormTarjeta({ register, errors, numero }: Props) {
  const marca = marcaDe(numero);
  return (
    <div>
      <CommonFormGrid className="mt-0">
        <CommonField label="Número de la tarjeta" full error={errors?.numero?.message}>
          <div className="relative">
            <Input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              className="pr-28 font-mono"
              {...register("tarjeta.numero", { onChange: (e) => (e.target.value = formatoNumero(e.target.value)) })}
            />
            {marca && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-ink-muted">{marca}</span>}
          </div>
        </CommonField>
        <CommonField label="Vencimiento" error={errors?.vence?.message}>
          <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" className="font-mono" {...register("tarjeta.vence", { onChange: (e) => (e.target.value = formatoVence(e.target.value)) })} />
        </CommonField>
        <CommonField label="Código de seguridad" error={errors?.cvv?.message}>
          <Input inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} className="font-mono" {...register("tarjeta.cvv")} />
        </CommonField>
        <CommonField label="Nombre del titular" error={errors?.titular?.message}>
          <Input autoComplete="cc-name" {...register("tarjeta.titular")} />
        </CommonField>
        <CommonField label="DNI del titular" error={errors?.dni?.message}>
          <Input inputMode="numeric" maxLength={8} {...register("tarjeta.dni")} />
        </CommonField>
      </CommonFormGrid>
      <CommonHint className="mt-0 flex items-center gap-1.5">
        <CommonIcon name="escudo" size={14} />
        Los datos de la tarjeta van directo a la pasarela de pago; nosotros no los guardamos.
      </CommonHint>
    </div>
  );
}
