import * as React from "react";
import { Button } from "@/components/ui/button";
import { CommonIcon } from "@/components/common/CommonIcon";
import { CommonSpinner } from "@/components/common/CommonSpinner";
import type { NombreIcono } from "@/lib/iconos";

export type CommonButtonColor = "primary" | "pay" | "secondary" | "ghost" | "danger";
export type CommonButtonSize = "sm" | "md" | "icon";

const VARIANTE = { primary: "default", pay: "pay", secondary: "outline", ghost: "ghost", danger: "destructive" } as const;
const TAMANO = { sm: "sm", md: "default", icon: "icon" } as const;

export interface CommonButtonProps extends Omit<React.ComponentProps<"button">, "color"> {
  /** primary = paso principal (petróleo); pay = cobrar o pagar (coral); danger = borrar. */
  color?: CommonButtonColor;
  size?: CommonButtonSize;
  loading?: boolean;
  /** Botón tipo toggle encendido (se pinta como primario). */
  active?: boolean;
  /** Ícono de ESTACIONARTE antes del texto. */
  icon?: NombreIcono;
}

/** Botón único de la plataforma: variantes y tamaños tipados, con loading e ícono incorporados. */
export function CommonButton({ color = "secondary", size = "md", loading, active, icon, disabled, className, children, ...props }: CommonButtonProps) {
  const tamIcono = size === "md" ? 20 : 16;
  return (
    <Button
      variant={active ? "default" : VARIANTE[color]}
      size={TAMANO[size]}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={className}
      {...props}
    >
      {loading ? <CommonSpinner /> : icon && <CommonIcon name={icon} size={tamIcono} />}
      {children}
    </Button>
  );
}
