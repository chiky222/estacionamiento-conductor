import * as React from "react";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

/** Encabezado de sección en mayúsculas (estilo overline). */
export function CommonEyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-[11px] leading-[14px] font-bold tracking-[.08em] text-ink-muted uppercase", className)} {...props} />;
}

/** Títulos en Sora: h1 título de pantalla, h2 título de tarjeta, h3 subtítulo. */
export function CommonTitle({ as = "h2", className, ...props }: React.ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3" }) {
  const Tag = as;
  const tam = as === "h1" ? "text-[28px] leading-[34px] tracking-[-.01em]" : as === "h2" ? "text-xl leading-[26px]" : "text-[17px] leading-6";
  return <Tag className={cn("m-0 font-display font-semibold", tam, className)} {...props} />;
}

export function CommonHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-2 text-[13px] leading-[19px] text-ink-muted", className)} {...props} />;
}

/** Aviso de error: siempre con ícono de alerta además del color. */
export function CommonWarning({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mt-3 flex gap-2 rounded-[10px] bg-danger-soft px-3 py-2.5 text-[13px] text-danger", className)} {...props}>
      <CommonIcon name="alerta" size={18} className="mt-px" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
