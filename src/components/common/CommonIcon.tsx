import { ICONOS, type NombreIcono } from "@/lib/iconos";
import { cn } from "@/lib/utils";

interface Props {
  name: NombreIcono;
  /** 16, 20 o 24 px. */
  size?: number;
  /** 1.75 por defecto; 2.25 sólo dentro de chips chicos. */
  strokeWidth?: number;
  /** Si el ícono es la única señal, describirlo; si no, queda oculto a lectores de pantalla. */
  label?: string;
  className?: string;
}

/** Ícono de trazo de ESTACIONARTE. Toma el color del texto (currentColor). */
export function CommonIcon({ name, size = 20, strokeWidth = 1.75, label, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block flex-none", className)}
      dangerouslySetInnerHTML={{ __html: ICONOS[name] }}
    />
  );
}

/** El mismo ícono para usar dentro de un <svg> (por ejemplo, en el plano). */
export function CommonIconSvg({ name, x, y, size, color, strokeWidth = 1.75 }: { name: NombreIcono; x: number; y: number; size: number; color: string; strokeWidth?: number }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
      aria-hidden
      style={{ stroke: color, overflow: "visible" }}
      dangerouslySetInnerHTML={{ __html: ICONOS[name] }}
    />
  );
}
