import * as React from "react";
import { cn } from "@/lib/utils";
import { CommonIcon } from "@/components/common/CommonIcon";

interface Props {
  label: string;
  children: React.ReactNode;
  /** Ocupa las dos columnas del formulario. */
  full?: boolean;
  error?: string;
  className?: string;
}

/** Etiqueta + control. Se usa dentro de CommonFormGrid o suelto. */
export function CommonField({ label, children, full, error, className }: Props) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", full && "col-span-full", className)}>
      <span className="text-[13px] leading-[18px] font-semibold text-ink">{label}</span>
      {children}
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <CommonIcon name="alerta" size={14} />
          {error}
        </span>
      )}
    </label>
  );
}

export function CommonFormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("my-3 grid grid-cols-2 gap-3", className)}>{children}</div>;
}
